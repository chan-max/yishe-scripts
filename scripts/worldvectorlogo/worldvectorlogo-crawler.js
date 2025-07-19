/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-19 23:13:40
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-20 01:09:35
 * @FilePath: /design-server/Users/jackie/workspace/yishe-scripts/scripts/worldvectorlogo-crawler.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// worldvectorlogo-crawler.js
// 用途：爬取 worldvectorlogo.com 网站上的 logo 矢量图标（SVG）
// 用法：node scripts/worldvectorlogo/worldvectorlogo-crawler.js
// 说明：本脚本用于批量下载 worldvectorlogo.com 上的 logo 图标，后续将实现自动化爬取与下载功能。
//
// 数据来源说明：
// 网址 https://worldvectorlogo.com/zh/most-downloaded/1 到 /3839 都有 logo 数据，
// 可通过遍历这些编号实现批量下载。

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const {
    sendToFeishu,
    uploadLocalFileToCOS
} = require('../utils');

const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler-material';

async function downloadAndUploadToCOS(svgUrl, name) {
    // 下载SVG
    const res = await axios.get(svgUrl, {
        responseType: 'arraybuffer'
    });
    const tempPath = path.join(__dirname, `${name}.svg`);
    fs.writeFileSync(tempPath, res.data);
    // 上传到COS
    const cosResult = await uploadLocalFileToCOS(tempPath);
    fs.unlinkSync(tempPath); // 删除临时文件
    return cosResult.url;
}

async function saveToServer({
    url,
    name,
    source,
    suffix
}) {
    await axios.post(DESIGN_SERVER_API, {
        url,
        name,
        source,
        suffix
    });
}

async function main() {
    const url = 'https://worldvectorlogo.com/zh/most-downloaded/1';
    const source = 'worldvectorlogo.com';
    try {
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        let count = 0;
        for (const el of $('.logos a.logo').toArray()) {
            const img = $(el).find('img.logo__img');
            const svgUrl = img.attr('src');
            const alt = img.attr('alt');
            const name = $(el).find('.logo__name').text() || alt || `logo_${count}`;
            const suffix = 'svg';
            // 1. 下载并上传到COS
            const cosUrl = await downloadAndUploadToCOS(svgUrl, name);
            // 2. 存到 design-server
            await saveToServer({
                url: cosUrl,
                name,
                source,
                suffix
            });
            console.log(`已上传并保存: ${name}`);
            count++;
        }
        await sendToFeishu('本页logo已全部上传并入库');
    } catch (err) {
        console.error('失败:', err);
        await sendToFeishu(`❌ worldvectorlogo爬取失败: ${err.message}`);
    }
}

main();