// google-art-crawler.js
// Node.js 版本：批量抓取 Google Arts & Culture 高清图片

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assertsFile = path.join(__dirname, 'asserts.txt');
const outputDir = path.join(__dirname, 'Ukiyo');
const tempDir = path.join(__dirname, 'temp');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '');
}

async function processUrl(index, url) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 4000, height: 4000 }
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // 获取标题和作者
  let title = await page.title();
  let author = '';
  try {
    author = await page.$eval(
      'div[role="main"] section ul li:nth-child(2) a',
      el => el.textContent.trim()
    );
  } catch {}
  try {
    title = await page.$eval(
      'div[role="main"] section ul li:nth-child(1)',
      el => el.textContent.replace(/^Title: /, '').trim()
    );
  } catch {}

  let filename = sanitizeFilename((author ? author + ' - ' : '') + title) || `image_${index}`;
  let tempPng = path.join(tempDir, `image${index}.png`);
  let finalPng = path.join(outputDir, filename + '.png');

  // 等待图片加载
  await page.waitForTimeout(3000);

  // 可根据实际页面结构调整截图区域
  await page.screenshot({ path: tempPng, fullPage: true });

  // 裁剪白边
  try {
    await sharp(tempPng)
      .trim()
      .toFile(finalPng);
    fs.unlinkSync(tempPng);
    console.log(`Saved: ${finalPng}`);
  } catch (e) {
    // 失败则直接保存原图
    fs.renameSync(tempPng, finalPng);
    console.log(`Saved (no trim): ${finalPng}`);
  }

  await browser.close();
}

async function main() {
  if (!fs.existsSync(assertsFile)) {
    // 自动生成示例 asserts.txt
    const example = [
      '/asset/sanjūrokkasen/RQEYzE71xKwOlQ',
      '/asset/the-starry-night/bgEuwDxel93_Pg',
      '/asset/the-great-wave-off-kanagawa/2QH0GmK2lQF1xA',
      '/asset/girl-with-a-pearl-earring/1QGd5Qm2v1F1xA',
      '/asset/mona-lisa/1gEuwDxel93_Pg'
    ].join('\n');
    fs.writeFileSync(assertsFile, example, 'utf-8');
    console.log('已自动生成 asserts.txt 示例文件，请编辑后重新运行。');
    process.exit(0);
  }
  const lines = fs.readFileSync(assertsFile, 'utf-8').split('\n').filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const url = 'https://artsandculture.google.com' + lines[i].trim();
    console.log(`Processing [${i}]: ${url}`);
    try {
      await processUrl(i, url);
    } catch (e) {
      console.error(`Failed [${i}]: ${url}`, e);
    }
  }
}

main(); 