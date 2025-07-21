#!/usr/bin/env node

const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);

(async function main() {
    const baseUrl = 'https://artsandculture.google.com/search/asset?q=';
    console.log(chalk.bgBlue.white.bold('\n==============================='));
    console.log(chalk.bgBlue.white.bold('  Google Arts & Culture 爬虫  '));
    console.log(chalk.bgBlue.white.bold('===============================\n'));
    console.log(chalk.green('目标网站: ') + chalk.underline.blue(baseUrl));
    console.log(chalk.yellow('功能: 自动爬取谷歌艺术与文化中的图片资源。'));
    console.log(chalk.cyan('你可以输入任意关键词进行搜索，脚本会自动打开对应的搜索结果页面。\n'));

    const {
        keyword
    } = await prompt([{
        type: 'input',
        name: 'keyword',
        message: chalk.magenta('请输入你想搜索的内容（如 van gogh、cat、flower 等）：'),
        validate: input => input.trim() ? true : '搜索内容不能为空'
    }]);

    const searchUrl = baseUrl + encodeURIComponent(keyword.trim());
    console.log(chalk.green('\n即将打开: ') + chalk.underline.blue(searchUrl) + '\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
    });
    console.log(chalk.bgGreen.white.bold('页面已打开，祝你探索愉快！'));
    // 保持页面不自动关闭
})();