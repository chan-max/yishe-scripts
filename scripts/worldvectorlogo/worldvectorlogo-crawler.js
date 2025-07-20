process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-19 23:13:40
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-20 07:56:09
 * @FilePath: /design-server/Users/jackie/workspace/yishe-scripts/scripts/worldvectorlogo-crawler.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// worldvectorlogo-crawler.js
// 用途：爬取 worldvectorlogo.com 网站上的 logo 矢量图标（SVG）
// 用法：node scripts/worldvectorlogo/worldvectorlogo-crawler.js
// 说明：本脚本用于批量下载 worldvectorlogo.com 上的 logo 图标，支持断点续传功能。
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

const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/add';
const SUCCESS_LOG = path.join(__dirname, 'success.log');
const FAIL_LOG = path.join(__dirname, 'fail.log');

function appendLog(file, data) {
    fs.appendFileSync(file, data + '\n');
}

// 读取日志文件，获取已处理的页面和项目
function readProcessedData() {
    const processedPages = new Set();
    const processedItems = new Set();

    // 读取成功日志
    if (fs.existsSync(SUCCESS_LOG)) {
        const successLines = fs.readFileSync(SUCCESS_LOG, 'utf8').split('\n').filter(line => line.trim());
        successLines.forEach(line => {
            try {
                const data = JSON.parse(line);
                processedPages.add(data.page);
                processedItems.add(`${data.page}_${data.name}`);
            } catch (e) {
                console.warn(`[警告] 解析成功日志行失败: ${line}`);
            }
        });
    }

    // 读取失败日志
    if (fs.existsSync(FAIL_LOG)) {
        const failLines = fs.readFileSync(FAIL_LOG, 'utf8').split('\n').filter(line => line.trim());
        failLines.forEach(line => {
            try {
                const data = JSON.parse(line);
                if (data.name) {
                    processedItems.add(`${data.page}_${data.name}`);
                }
            } catch (e) {
                console.warn(`[警告] 解析失败日志行失败: ${line}`);
            }
        });
    }

    return {
        processedPages,
        processedItems
    };
}

// 检查页面是否已完全处理
function isPageFullyProcessed(page, processedPages, processedItems, totalItems) {
    if (processedPages.has(page)) {
        return true;
    }

    // 检查该页面的所有项目是否都已处理
    let processedCount = 0;
    for (let i = 0; i < totalItems; i++) {
        if (processedItems.has(`${page}_logo_${page}_${i}`)) {
            processedCount++;
        }
    }

    return processedCount >= totalItems;
}

async function downloadAndUploadToCOS(svgUrl, name) {
    console.log(`[下载] ${name} - ${svgUrl}`);
    const res = await axios.get(svgUrl, {
        responseType: 'arraybuffer'
    });
    const tempPath = path.join(__dirname, `${name}.svg`);
    fs.writeFileSync(tempPath, res.data);
    console.log(`[本地保存] ${tempPath}`);
    // 上传到COS，增加 worldvectorlogo/ 前缀
    const cosResult = await uploadLocalFileToCOS(tempPath, `worldvectorlogo/${name}.svg`);
    console.log(`[上传到COS] ${cosResult.url}`);
    fs.unlinkSync(tempPath);
    return cosResult.url;
}

async function saveToServer({
    url,
    name,
    source,
    suffix
}) {
    console.log(`[保存到design-server] ${name} - ${url}`);
    const res = await axios.post(DESIGN_SERVER_API, {
        url,
        name,
        source,
        suffix
    });
    console.log(`[design-server返回]`, res.data);
}

async function main() {
    const source = 'worldvectorlogo.com';
    let totalSuccess = 0;
    let totalFail = 0;
    let skippedPages = 0;
    let skippedItems = 0;

    // 读取已处理的数据
    console.log('[开始] 读取已处理数据...');
    const {
        processedPages,
        processedItems
    } = readProcessedData();
    console.log(`[已处理] 页面: ${processedPages.size} 个, 项目: ${processedItems.size} 个`);

    for (let page = 1; page <= 3839; page++) {
        const url = `https://worldvectorlogo.com/zh/most-downloaded/${page}`;

        try {
            const res = await axios.get(url);
            const $ = cheerio.load(res.data);
            const logoEls = $('.logos a.logo').toArray();
            console.log(`\n[发现logo] 第${page}页 共${logoEls.length}个`);

            // 检查页面是否已完全处理
            if (isPageFullyProcessed(page, processedPages, processedItems, logoEls.length)) {
                console.log(`[跳过] 第${page}页已完全处理`);
                skippedPages++;
                continue;
            }

            console.log(`[开始] worldvectorlogo-crawler ${url}`);

            for (let i = 0; i < logoEls.length; i++) {
                const el = logoEls[i];
                let name = '',
                    svgUrl = '',
                    cosUrl = '',
                    status = 'success',
                    errMsg = '';

                try {
                    const img = $(el).find('img.logo__img');
                    svgUrl = img.attr('src');
                    const alt = img.attr('alt');
                    name = $(el).find('.logo__name').text() || alt || `logo_${page}_${i}`;

                    // 检查该项目是否已处理
                    const itemKey = `${page}_${name}`;
                    if (processedItems.has(itemKey)) {
                        console.log(`[跳过] ${name} - 已处理`);
                        skippedItems++;
                        continue;
                    }

                    const suffix = 'svg';
                    // 1. 下载并上传到COS
                    cosUrl = await downloadAndUploadToCOS(svgUrl, name);
                    // 2. 存到 design-server
                    await saveToServer({
                        url: cosUrl,
                        name,
                        source,
                        suffix
                    });
                    appendLog(SUCCESS_LOG, JSON.stringify({
                        page,
                        name,
                        svgUrl,
                        cosUrl,
                        status
                    }));
                    totalSuccess++;
                    console.log(`[成功] ${name}`);
                } catch (err) {
                    status = 'fail';
                    errMsg = err.message || String(err);
                    appendLog(FAIL_LOG, JSON.stringify({
                        page,
                        name,
                        svgUrl,
                        status,
                        errMsg
                    }));
                    totalFail++;
                    console.error(`[失败] ${name}:`, errMsg);
                }
            }
        } catch (err) {
            // 整页失败
            appendLog(FAIL_LOG, JSON.stringify({
                page,
                name: '',
                svgUrl: '',
                status: 'fail',
                errMsg: '页面请求失败: ' + (err.message || String(err))
            }));
            totalFail++;
            console.error(`[致命错误] 第${page}页:`, err.message);
        }
    }

    const finishMsg = `✅ worldvectorlogo处理完毕\n成功: ${totalSuccess} 个\n失败: ${totalFail} 个\n跳过页面: ${skippedPages} 个\n跳过项目: ${skippedItems} 个`;
    console.log(finishMsg);
    await sendToFeishu(finishMsg);
    console.log('[结束] worldvectorlogo-crawler');
}

main();