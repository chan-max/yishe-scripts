#!/usr/bin/env node

const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const fs = require('fs');
const path = require('path');
const {
    uploadLocalFileToCOS,
    sendToFeishu
} = require('../utils');
const crypto = require('crypto');

const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/add';
const SUCCESS_LOG = path.join(__dirname, 'success.log');
const FAIL_LOG = path.join(__dirname, 'fail.log');
const COS_LOG = path.join(__dirname, 'cos-upload.log');
const SERVER_LOG = path.join(__dirname, 'server-upload.log');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
                processed.add(data.imgUrl);
            } catch {}
        });
    }
    return processed;
}

async function downloadImage(url, name) {
    const axios = require('axios');
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
    source,
    suffix
}) {
    const axios = require('axios');
    const res = await axios.post(DESIGN_SERVER_API, {
        url,
        name,
        source,
        suffix
    });
    return res.data;
}

(async function main() {
    const url = 'https://www.vangoghmuseum.nl/en/collection';
    console.log(chalk.bgYellow.black.bold('\n==============================='));
    console.log(chalk.bgYellow.black.bold('  梵高博物馆藏品爬虫脚本  '));
    console.log(chalk.bgYellow.black.bold('===============================\n'));
    console.log(chalk.green('目标网站: ') + chalk.underline.blue(url));
    console.log(chalk.yellow('功能: 自动采集梵高博物馆藏品页面的图片链接。'));
    console.log(chalk.cyan('本脚本将持续滚动页面，实时打印新出现的图片链接。\n'));

    const {
        open
    } = await prompt([{
        type: 'confirm',
        name: 'open',
        message: chalk.magenta('是否现在开始采集图片链接？'),
        default: true
    }]);

    if (!open) {
        console.log(chalk.red('已取消操作。你可以稍后再运行本脚本。'));
        process.exit(0);
    }

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
    });
    console.log(chalk.bgGreen.white.bold('页面已打开，开始滚动并采集图片链接...'));

    let seen = new Set();
    let lastImgCount = 0; // 用于记录上次滚动后的图片总数
    let sameCount = 0;
    let processed = readProcessedData();
    let totalSuccess = 0;
    let totalFail = 0;
    while (sameCount < 5) { // 连续5次高度不变则认为到底
        const currentHeight = await page.evaluate('document.body.scrollHeight');
        process.stdout.write(chalk.gray(`[日志] 当前页面高度: ${currentHeight}\n`));
        if (currentHeight === lastImgCount) { // 使用 lastImgCount 作为比较
            sameCount++;
            process.stdout.write(chalk.gray(`[日志] 页面高度未变，sameCount=${sameCount}\n`));
        } else {
            sameCount = 0;
            lastImgCount = currentHeight; // 更新 lastImgCount
            process.stdout.write(chalk.gray(`[日志] 页面高度变化，重置 sameCount=0\n`));
        }
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        process.stdout.write(chalk.gray('[日志] 已滚动到底部，等待图片加载...\n'));
        await new Promise(resolve => setTimeout(resolve, 2500)); // 延长等待时间
        // 实时提取新图片最大尺寸链接
        const newImages = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('.collection-art-object-list[class*="columns-"] picture img'));
            return imgs.map(img => {
                let imgUrl = '';
                if (img.srcset) {
                    // 用正则匹配所有“图片地址+尺寸”对，兼容图片地址中带逗号
                    const matches = Array.from(img.srcset.matchAll(/([^\s]+)\s+(\d+)w/g));
                    if (matches.length > 0) {
                        imgUrl = matches[matches.length - 1][1].replace(/^,+/, ''); // 去除前方多余的逗号
                    }
                }
                if (!imgUrl) imgUrl = img.src;
                return imgUrl;
            }).filter(Boolean);
        });
        process.stdout.write(chalk.gray(`[日志] 本次采集到图片数量: ${newImages.length}\n`));
        let newCount = 0;
        let newToProcess = [];
        for (const imgUrl of newImages) {
            if (!seen.has(imgUrl)) {
                seen.add(imgUrl);
                process.stdout.write(chalk.blueBright('[图片]') + ' ' + imgUrl + '\n');
                newCount++;
                if (!processed.has(imgUrl)) {
                    newToProcess.push(imgUrl);
                }
            }
        }
        process.stdout.write(chalk.gray(`[日志] 本次新增图片数量: ${newCount}，已采集总数: ${seen.size}\n`));
        // 新增：本次采集到的新图片立即上传COS和服务器
        for (const imgUrl of newToProcess) {
            let tempPath = '';
            let cosUrl = '';
            let status = 'success';
            let errMsg = '';
            try {
                const safeName = path.basename(imgUrl).replace(/[\\/:*?"<>|]/g, '_');
                // 用图片链接的md5哈希作为唯一文件名
                const hash = crypto.createHash('md5').update(imgUrl).digest('hex');
                const ext = path.extname(imgUrl).split('?')[0] || '.jpg';
                tempPath = await downloadImage(imgUrl, hash);
                const cosPath = `vangogh/${hash}${ext}`;
                cosUrl = (await uploadLocalFileToCOS(tempPath, cosPath)).url;
                appendLog(COS_LOG, JSON.stringify({
                    imgUrl,
                    cosUrl,
                    status: 'cos_upload_success'
                }));
                console.log(chalk.green(`[COS上传成功] ${imgUrl}`));
                const serverRes = await saveToServer({
                    url: cosUrl,
                    name: safeName,
                    source: 'vangoghmuseum.nl',
                    suffix: ext.replace('.', '') || 'jpg'
                });
                appendLog(SERVER_LOG, JSON.stringify({
                    imgUrl,
                    cosUrl,
                    serverRes,
                    status: 'server_upload_success'
                }));
                appendLog(SUCCESS_LOG, JSON.stringify({
                    imgUrl,
                    cosUrl,
                    status
                }));
                totalSuccess++;
                console.log(chalk.green(`[服务器上传成功] ${imgUrl}`));
                processed.add(imgUrl);
            } catch (err) {
                status = 'fail';
                errMsg = err.message || String(err);
                appendLog(FAIL_LOG, JSON.stringify({
                    imgUrl,
                    status,
                    errMsg
                }));
                totalFail++;
                console.error(chalk.red(`[失败] ${imgUrl}: ${errMsg}`));
            } finally {
                if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }
        }
        if (seen.size === lastImgCount) {
            sameCount++;
            process.stdout.write(chalk.gray(`[日志] 图片总数未变，sameCount=${sameCount}\n`));
        } else {
            sameCount = 0;
            lastImgCount = seen.size;
            process.stdout.write(chalk.gray(`[日志] 图片总数变化，重置 sameCount=0\n`));
        }
    }
    console.log(chalk.green(`\n滚动结束，共采集到 ${seen.size} 个图片链接。`));
    console.log(chalk.bgBlue.white.bold('\n所有图片链接如下：'));
    let idx = 1;
    for (const imgUrl of seen) {
        console.log(chalk.blueBright(`${idx}. ${imgUrl}`));
        idx++;
    }
    // 写入 log 文件
    const logFile = 'collection-image-urls.log';
    const allLinks = Array.from(seen);
    const logContent = `总数: ${allLinks.length}\n` + allLinks.join('\n') + '\n';
    fs.writeFileSync(logFile, logContent, 'utf-8');
    console.log(chalk.green(`\n所有图片链接已写入 ${logFile}`));

    const finishMsg = `✅ 梵高图片处理完毕\n成功: ${totalSuccess} 个\n失败: ${totalFail} 个`;
    console.log(finishMsg);
    await sendToFeishu(finishMsg);
    await browser.close();
})();