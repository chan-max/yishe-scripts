// 一键批量补全贴纸和爬虫素材的 phash，只需调用后端批量接口

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');
const chalk = require('chalk');

async function main() {
  try {
    console.log(chalk.cyan('请求后端批量补全贴纸素材 phash...'));
    const stickerRes = await axios.post('https://1s.design:1520/api/sticker/batch-generate-phash');
    console.log(chalk.green('贴纸素材补全结果：'), stickerRes.data);
  } catch (e) {
    console.error(chalk.red('贴纸素材批量补全接口调用失败'), e.message);
  }

  try {
    console.log(chalk.cyan('请求后端批量补全爬虫素材 phash...'));
    const crawlerRes = await axios.post('https://1s.design:1520/api/crawler/material/batch-generate-phash');
    console.log(chalk.green('爬虫素材补全结果：'), crawlerRes.data);
  } catch (e) {
    console.error(chalk.red('爬虫素材批量补全接口调用失败'), e.message);
  }
}

main();
