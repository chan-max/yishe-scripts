/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-22 06:07:14
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-22 06:15:54
 * @FilePath: /design-server/Users/jackie/workspace/yishe-scripts/scripts/artsandculture.google.com/open-search.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

const puppeteer = require('puppeteer');

(async function main() {
    const url = 'https://artsandculture.google.com/search/asset?q';
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
    });
    console.log('已打开页面:', url);
    // 保持页面不自动关闭
})();