/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-21 20:27:30
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-21 21:15:33
 * @FilePath: /design-server/Users/jackie/workspace/yishe-scripts/scripts/nasa.gov/nasa-html-fetch.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const puppeteer = require('puppeteer');

(async function main() {
    const url = 'https://images.nasa.gov/';
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
    });
    await page.waitForSelector('body'); // 等待页面主体渲染

    // 分析 class 为 media-asset image 下的所有图片元素
    const images = await page.evaluate(() => {
        // 获取所有 class 包含 media-asset image 的元素
        const nodes = Array.from(document.querySelectorAll('.media-asset.image img'));
        // 提取 src 属性
        return nodes.map(img => img.src);
    });
    console.log('页面图片列表:');
    images.forEach((src, i) => console.log(`${i + 1}. ${src}`));
    await browser.close();
})();