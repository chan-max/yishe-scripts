const puppeteer = require('puppeteer');

(async () => {
  // 启动浏览器
  const browser = await puppeteer.launch({ headless: false });
  // 新建页面
  const page = await browser.newPage();
  // 打开百度首页
  await page.goto('https://www.baidu.com');
  // 截图并保存
  await page.screenshot({ path: 'baidu.png' });
  // 关闭浏览器
  await browser.close();
})(); 