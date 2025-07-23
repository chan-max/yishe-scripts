// 求表情网爬虫脚本
// 该网站支持传入 page 参数，最大页数目前不确定，例如：https://www.qiubiaoqing.com/?page=2
// 后续可实现自动遍历、命令行参数等功能

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');
const chalk = require('chalk');
const { printHeader } = require('../utils');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { uploadLocalFileToCOS } = require('../utils');

const DATA_FILE = path.join(__dirname, 'albums.json');
const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/add';

function loadAlbums() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveAlbums(albums) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(albums, null, 2), 'utf-8');
}

function printBanner() {
  const line = chalk.gray('='.repeat(48));
  console.log(line);
  console.log(chalk.cyan.bold('   🚀 求表情网爬虫启动！'));
  console.log(chalk.green('   Target:'), chalk.yellow('https://www.qiubiaoqing.com/'));
  console.log(chalk.magenta('   Time  :'), chalk.white(new Date().toLocaleString()));
  console.log(line + '\n');
}

async function fetchPage(page) {
  const url = `https://www.qiubiaoqing.com/?page=${page}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const albums = [];
    $('.common-album-list .common-album').each((i, el) => {
      const $album = $(el);
      const $mainA = $album.find('> .bg-white > a').first();
      const $info = $album.find('.album-info').first();
      const $infoA = $info.find('a').first();
      albums.push({
        title: $infoA.find('h5.album-title').text().trim(),
        albumUrl: $mainA.attr('href') || ''
      });
    });
    return albums;
  } catch (error) {
    console.error(chalk.red(`请求失败: page=${page}`), error.message);
    return null;
  }
}

async function saveToServer({ url, name, source, suffix, description, keywords }) {
  try {
    const res = await axios.post(DESIGN_SERVER_API, {
      url,
      name,
      source,
      suffix,
      description,
      keywords
    });
    console.log(`[design-server返回]`, res.data);
    return res.data;
  } catch (err) {
    console.error('[保存到design-server失败]', err.message);
    return null;
  }
}

async function downloadAndUploadToCOS(imgUrl, cosKey) {
  const tempPath = path.join(__dirname, 'tmp_' + Date.now() + path.extname(imgUrl).split('?')[0]);
  let cosResult = null;
  try {
    const res = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(tempPath, res.data);
    cosResult = await uploadLocalFileToCOS(tempPath, cosKey);
    return cosResult.url;
  } catch (err) {
    throw new Error('下载或上传COS失败: ' + err.message);
  } finally {
    // 无论成功失败都删除本地文件
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) { console.error('删除临时文件失败:', e.message); }
  }
}

async function fetchAlbumImages(albumUrl, albumTitle, existedImages = []) {
  let page = 1;
  let allImages = existedImages || [];
  const imageUrlSet = new Set(allImages.map(img => img.url));
  const cosUrlSet = new Set(allImages.filter(img => img.cosUrl).map(img => img.url));
  while (true) {
    const url = albumUrl + (albumUrl.includes('?') ? `&page=${page}` : `?page=${page}`);
    let pageOk = true;
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      let found = false;
      const imgEls = $('.album-img-list .row-nest .mb-2').toArray();
      for (const el of imgEls) {
        try {
          const $a = $(el).find('a').first();
          const $img = $a.find('img').first();
          const imgPageUrl = $a.attr('href') || '';
          if (!imgPageUrl || imageUrlSet.has(imgPageUrl)) continue;
          found = true;
          const imgTitle = $a.attr('title') || $img.attr('alt') || $img.attr('title') || '';
          const originImg = $img.attr('src') || '';
          // 断点续传：如果已上传cosUrl则跳过
          let cosUrl = '';
          let serverRes = null;
          let alreadyUploaded = false;
          // 查找已存在且有cosUrl的图片
          const existed = allImages.find(img => img.url === imgPageUrl && img.cosUrl);
          if (existed) {
            cosUrl = existed.cosUrl;
            serverRes = existed.serverRes;
            alreadyUploaded = true;
          }
          if (!alreadyUploaded) {
            let cosKey = `qiubiaoqing/${albumTitle.replace(/[^\w\d]/g, '_').slice(0, 32)}/${path.basename(originImg).split('?')[0]}`;
            try {
              cosUrl = await downloadAndUploadToCOS(originImg, cosKey);
            } catch (e) {
              console.error(chalk.red(`[上传失败] ${originImg}`), e.message);
              continue; // 上传失败直接跳过
            }
            // 自动生成 description 和 keywords
            const description = `${albumTitle} - ${imgTitle}`;
            const keywords = [albumTitle, imgTitle].filter(Boolean).join(',');
            try {
              serverRes = await saveToServer({
                url: cosUrl,
                name: imgTitle || path.basename(originImg),
                source: 'qiubiaoqing.com',
                suffix: path.extname(originImg).replace('.', '') || 'jpg',
                description,
                keywords
              });
            } catch (e) {
              console.error(chalk.red(`[通知服务器失败] ${cosUrl}`), e.message);
            }
          }
          allImages.push({
            url: imgPageUrl,
            title: imgTitle,
            img: originImg,
            cosUrl,
            albumTitle,
            serverRes
          });
          saveAlbums(allImages); // 实时保存
        } catch (imgErr) {
          console.error(chalk.red(`[图片处理异常]`), imgErr.message);
          continue;
        }
      }
      if (!found) break;
      page++;
    } catch (e) {
      console.error(chalk.red(`专辑 ${albumTitle} 页面 ${page} 抓取失败: `), e.message);
      pageOk = false;
    }
    if (!pageOk) break;
  }
  return allImages;
}

async function main() {
  printHeader();
  printBanner();
  let page = 1;
  let globalAllAlbums = loadAlbums();
  const albumUrlSet = new Set(globalAllAlbums.map(a => a.albumUrl));
  let foundAny = true;
  while (foundAny) {
    console.log(chalk.cyan(`抓取第 ${page} 页...`));
    const albums = await fetchPage(page);
    if (!albums || albums.length === 0) {
      console.log(chalk.yellow('没有更多专辑，爬取结束。'));
      break;
    }
    let newCount = 0;
    for (const album of albums) {
      if (album.albumUrl && !albumUrlSet.has(album.albumUrl)) {
        // 新专辑，立即抓取图片信息
        console.log(chalk.blue(`抓取专辑：${album.title}`));
        const images = await fetchAlbumImages(album.albumUrl, album.title);
        globalAllAlbums.push({ ...album, images });
        albumUrlSet.add(album.albumUrl);
        newCount++;
        saveAlbums(globalAllAlbums);
        console.log(chalk.green(`  已抓取 ${images.length} 张图片`));
      }
    }
    if (newCount > 0) {
      console.log(chalk.green(`新增 ${newCount} 条，已累计 ${globalAllAlbums.length} 条。`));
    } else {
      console.log(chalk.gray('本页无新专辑。'));
    }
    page++;
  }
  console.log(chalk.green('全部专辑及图片已保存到 albums.json'));
}

main();
