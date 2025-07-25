/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-25 19:01:45
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-26 08:05:10
 * @FilePath: /yishe-scripts/scripts/gen-hash-stickerandcrawler.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 一键批量补全贴纸和爬虫素材的 phash，只需调用后端批量接口

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';



/**
 * SELECT COUNT(*) FROM crawler_material WHERE phash IS NULL OR phash = '';
 */

const axios = require('axios');
const chalk = require('chalk');

// 解析命令行参数
env = process.argv[2] === 'dev' ? 'dev' : 'prod';
const baseUrl = env === 'dev' ? 'http://localhost:1520' : 'https://1s.design:1520';

// 创建不超时的 axios 实例
const axiosNoTimeout = axios.create({
    timeout: 0
});

async function main() {
    try {
        console.log(chalk.cyan(`请求后端批量补全贴纸素材 phash... [${env}]`));
        const stickerRes = await axiosNoTimeout.post(`${baseUrl}/api/sticker/batch-generate-phash`);
        console.log(chalk.green('贴纸素材补全结果：'), stickerRes.data);
    } catch (e) {
        console.error(chalk.red('贴纸素材批量补全接口调用失败'), e.message);
    }

    try {
        console.log(chalk.cyan(`请求后端批量补全爬虫素材 phash... [${env}]`));
        const crawlerRes = await axiosNoTimeout.post(`${baseUrl}/api/crawler/material/batch-generate-phash`);
        console.log(chalk.green('爬虫素材补全结果：'), crawlerRes.data);
    } catch (e) {
        console.error(chalk.red('爬虫素材批量补全接口调用失败'), e.message);
    }
}

main();