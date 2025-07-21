#!/usr/bin/env node

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);

const DOMAIN = 'artvee.com';
const SAVE_DIR = path.join(__dirname, DOMAIN);
const META_FILE = path.join(SAVE_DIR, 'meta.json');

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }
}

async function getAllItemLinks(page, categoryUrl) {
    let links = [];
    let pageNum = 1;
    while (true) {
        const url = categoryUrl + (categoryUrl.endsWith('/') ? '' : '/') + (pageNum > 1 ? `page/${pageNum}/` : '');
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        const pageLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a.boxed-listing-link')).map(a => a.href);
        });
        if (pageLinks.length === 0) break;
        links.push(...pageLinks);
        // 检查是否有下一页
        const hasNext = await page.evaluate(() => {
            return !!document.querySelector('.pagination .next');
        });
        if (!hasNext) break;
        pageNum++;
    }
    return links;
}

async function getItemMeta(page, detailUrl) {
    await page.goto(detailUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    const meta = await page.evaluate(() => {
        const title = (document.querySelector('h1') && document.querySelector('h1').textContent && document.querySelector('h1').textContent.trim()) || '';
        const author = (document.querySelector('.artist-name') && document.querySelector('.artist-name').textContent && document.querySelector('.artist-name').textContent.trim()) || '';
        const imgLink = (document.querySelector('a.download-button') && document.querySelector('a.download-button').href) || '';
        return {
            title,
            author,
            imgLink
        };
    });
    return meta;
}

async function downloadImage(imgUrl, filename) {
    const resp = await axios.get(imgUrl, {
        responseType: 'arraybuffer'
    });
    fs.writeFileSync(filename, resp.data);
}

(async function main() {
    console.log('\n=== Artvee 分类图片爬虫 ===\n');
    await ensureDir(SAVE_DIR);
    // 用户输入分类URL
    const {
        categoryUrl
    } = await prompt([{
        type: 'input',
        name: 'categoryUrl',
        message: '请输入 Artvee 分类页面URL（如 https://artvee.com/category/illustration/ ）:',
        validate: input => /^https:\/\/artvee\.com\//.test(input) ? true : '请输入有效的 Artvee 分类URL'
    }]);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let allLinks = [];
    let allMeta = [];
    try {
        console.log('正在收集所有作品链接...');
        allLinks = await getAllItemLinks(page, categoryUrl);
        console.log(`共发现 ${allLinks.length} 个作品。`);
        for (let i = 0; i < allLinks.length; i++) {
            const meta = await getItemMeta(page, allLinks[i]);
            if (meta.imgLink) {
                const ext = path.extname(meta.imgLink).split('?')[0] || '.jpg';
                const safeTitle = meta.title.replace(/[\\/:*?"<>|]/g, '_');
                const filename = path.join(SAVE_DIR, `${safeTitle}${ext}`);
                try {
                    await downloadImage(meta.imgLink, filename);
                    console.log(`[${i+1}/${allLinks.length}] 下载: ${meta.title}`);
                } catch (e) {
                    console.log(`[${i+1}/${allLinks.length}] 下载失败: ${meta.title} (${e.message})`);
                }
            }
            allMeta.push({
                ...meta,
                detailUrl: allLinks[i]
            });
        }
        fs.writeFileSync(META_FILE, JSON.stringify(allMeta, null, 2), 'utf-8');
        console.log(`\n全部完成，元数据已保存到 ${META_FILE}`);
    } catch (e) {
        console.error('爬取过程中出错:', e.message);
    } finally {
        await browser.close();
    }
})();