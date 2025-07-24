// google-art-crawler.js
// 访问 Google Arts & Culture 搜索页面并打印网页内容

const puppeteer = require('puppeteer');

async function main() {
  const url = 'https://artsandculture.google.com/search/asset?q';
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // 获取页面内容
  const content = await page.content();
  console.log(content);

  await browser.close();
}

main(); 