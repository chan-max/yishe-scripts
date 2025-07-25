// 删除爬虫素材表中所有 gif 图片

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');
const chalk = require('chalk');

const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/page';
const DELETE_API = 'https://1s.design:1520/api/crawler/material/delete';

async function deleteMaterials(ids) {
  if (!ids.length) return;
  try {
    const res = await axios.post(DELETE_API, { ids });
    console.log(chalk.green(`已删除 ${ids.length} 个 gif 素材。`));
    console.log(chalk.gray('删除的ID：'), ids.join(', '));
    console.log(res.data);
  } catch (e) {
    console.error(chalk.red('删除失败'), e.message);
  }
}

async function main() {
  console.log(chalk.cyan('开始查找并删除所有 gif 素材...'));
  let page = 1;
  const pageSize = 100;
  let total = 0;
  let deleted = 0;
  while (true) {
    try {
      const res = await axios.post(DESIGN_SERVER_API, {
        currentPage: page,
        pageSize,
      });


      const { list = [], total: t = 0 } = res.data.data || {};
      if (page === 1) total = t;
      if (!list.length) break;
      const gifList = list.filter(item => {
        const suffix = (item.suffix || '').toLowerCase();
        return suffix === 'gif' || (item.url && item.url.toLowerCase().endsWith('.gif'));
      });
      if (gifList.length) {
        // 分批删除
        const batchSize = 50;
        for (let i = 0; i < gifList.length; i += batchSize) {
          const batch = gifList.slice(i, i + batchSize).map(item => item.id);
          await deleteMaterials(batch);
          deleted += batch.length;
        }
      }
      if (page * pageSize >= total) break;
      page++;
    } catch (e) {
      console.error(chalk.red('分页查询失败'), e.message);
      break;
    }
  }
  if (deleted === 0) {
    console.log(chalk.yellow('未找到 gif 素材，无需删除。'));
  } else {
    console.log(chalk.green(`所有 gif 素材已删除完毕，共删除 ${deleted} 个。`));
  }
}

main();
