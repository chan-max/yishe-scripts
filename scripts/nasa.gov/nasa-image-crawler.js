process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const {
    uploadLocalFileToCOS,
    sendToFeishu
} = require('../utils');

const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/add';
const SUCCESS_LOG = path.join(__dirname, 'success.log');
const FAIL_LOG = path.join(__dirname, 'fail.log');

function appendLog(file, data) {
    fs.appendFileSync(file, data + '\n');
}

function readProcessedData() {
    const processed = new Set();
    if (fs.existsSync(SUCCESS_LOG)) {
        const lines = fs.readFileSync(SUCCESS_LOG, 'utf8').split('\n').filter(Boolean);
        lines.forEach(line => {
            try {
                const data = JSON.parse(line);
                processed.add(data.imgSrc);
            } catch {}
        });
    }
    return processed;
}

async function downloadImage(url, name) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer'
    });
    const ext = path.extname(url).split('?')[0] || '.jpg';
    const tempPath = path.join(__dirname, `${name}${ext}`);
    fs.writeFileSync(tempPath, res.data);
    return tempPath;
}

async function saveToServer({
    url,
    name,
    desc,
    source,
    suffix
}) {
    const res = await axios.post(DESIGN_SERVER_API, {
        url,
        name,
        desc,
        source,
        suffix
    });
    return res.data;
}

(async function main() {
    const source = 'images.nasa.gov';
    const processed = readProcessedData();
    let totalSuccess = 0;
    let totalFail = 0;
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://images.nasa.gov/', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });
    await page.waitForSelector('body');
    console.log('[日志] 页面加载完成，准备查找 #popular-link 按钮');
    // 新增：等待并点击 id="popular-link" 按钮，增加详细日志
    await page.waitForSelector('#popular-link', {
        visible: true
    });
    console.log('[日志] #popular-link 按钮已可见，尝试 page.click');
    try {
        await page.click('#popular-link');
        console.log('[日志] page.click 触发成功，等待图片内容加载...');
        await page.waitForSelector('.media-asset.image img', {
            timeout: 5000
        });
        console.log('[日志] 图片内容加载完成');
    } catch (e) {
        console.log('[警告] page.click 方式未能触发，尝试 evaluate 方式');
        const clickResult = await page.evaluate(() => {
            const btn = document.getElementById('popular-link');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });
        if (clickResult) {
            console.log('[日志] evaluate 方式触发 click 成功，等待图片内容加载...');
            await page.waitForSelector('.media-asset.image img', {
                timeout: 5000
            });
            console.log('[日志] 图片内容加载完成');
        } else {
            console.log('[错误] 无法找到 #popular-link 按钮或点击失败');
        }
    }
    // 分析所有图片及文字信息
    const items = await page.evaluate(() => {
        // 先获取所有图片节点
        const nodes = Array.from(document.querySelectorAll('.media-asset.image img'));
        return nodes.map(img => {
            const imgSrc = img.src;
            // 尝试获取图片父级的标题和描述
            let title = '';
            let desc = '';
            const box = img.closest('.media-asset.image');
            if (box) {
                const titleEl = box.querySelector('.media-asset-title, .title, h3, h2, h1');
                if (titleEl) title = titleEl.textContent.trim();
                const descEl = box.querySelector('.media-asset-description, .description, p');
                if (descEl) desc = descEl.textContent.trim();
            }
            return {
                imgSrc,
                title,
                desc
            };
        }).filter(item => item.imgSrc);
    });
    for (const item of items) {
        if (processed.has(item.imgSrc)) {
            console.log(`[跳过] 已处理: ${item.imgSrc}`);
            continue;
        }
        let tempPath = '';
        let cosUrl = '';
        let status = 'success';
        let errMsg = '';
        try {
            const safeName = (item.title || path.basename(item.imgSrc)).replace(/[\\/:*?"<>|]/g, '_');
            tempPath = await downloadImage(item.imgSrc, safeName);
            cosUrl = (await uploadLocalFileToCOS(tempPath, `nasa/${safeName}${path.extname(tempPath)}`)).url;
            await saveToServer({
                url: cosUrl,
                name: item.title || safeName,
                desc: item.desc || '',
                source,
                suffix: path.extname(tempPath).replace('.', '') || 'jpg'
            });
            appendLog(SUCCESS_LOG, JSON.stringify({
                ...item,
                cosUrl,
                status
            }));
            totalSuccess++;
            console.log(`[成功] ${item.title || safeName}`);
        } catch (err) {
            status = 'fail';
            errMsg = err.message || String(err);
            appendLog(FAIL_LOG, JSON.stringify({
                ...item,
                status,
                errMsg
            }));
            totalFail++;
            console.error(`[失败] ${item.title || item.imgSrc}:`, errMsg);
        } finally {
            if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
    const finishMsg = `✅ NASA图片处理完毕\n成功: ${totalSuccess} 个\n失败: ${totalFail} 个`;
    console.log(finishMsg);
    await sendToFeishu(finishMsg);
    await browser.close();
})();