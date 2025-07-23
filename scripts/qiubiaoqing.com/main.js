// 求表情网爬虫脚本
// 该网站支持传入 page 参数，最大页数目前不确定，例如：https://www.qiubiaoqing.com/?page=2
// 后续可实现自动遍历、命令行参数等功能

const axios = require('axios');
const chalk = require('chalk');
const { printHeader } = require('../utils');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'albums.json');

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

async function fetchAlbumImages(albumUrl, albumTitle, existedImages = []) {
  let page = 1;
  let allImages = existedImages || [];
  const imageUrlSet = new Set(allImages.map(img => img.url));
  while (true) {
    const url = albumUrl + (albumUrl.includes('?') ? `&page=${page}` : `?page=${page}`);
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      let found = false;
      $('.album-img-list .row-nest .mb-2').each((i, el) => {
        const $a = $(el).find('a').first();
        const $img = $a.find('img').first();
        const imgUrl = $a.attr('href') || '';
        if (!imgUrl || imageUrlSet.has(imgUrl)) return;
        found = true;
        allImages.push({
          url: imgUrl,
          title: $a.attr('title') || $img.attr('alt') || $img.attr('title') || '',
          img: $img.attr('src') || ''
        });
        imageUrlSet.add(imgUrl);
      });
      if (!found) break;
      page++;
    } catch (e) {
      console.error(chalk.red(`专辑 ${albumTitle} 页面 ${page} 抓取失败: `), e.message);
      break;
    }
  }
  return allImages;
}

async function main() {
  printHeader();
  printBanner();
  let page = 1;
  let allAlbums = loadAlbums();
  const albumUrlSet = new Set(allAlbums.map(a => a.albumUrl));
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
        allAlbums.push({ ...album, images });
        albumUrlSet.add(album.albumUrl);
        newCount++;
        saveAlbums(allAlbums);
        console.log(chalk.green(`  已抓取 ${images.length} 张图片`));
      }
    }
    if (newCount > 0) {
      console.log(chalk.green(`新增 ${newCount} 条，已累计 ${allAlbums.length} 条。`));
    } else {
      console.log(chalk.gray('本页无新专辑。'));
    }
    page++;
  }
  console.log(chalk.green('全部专辑及图片已保存到 albums.json'));
}

main();
