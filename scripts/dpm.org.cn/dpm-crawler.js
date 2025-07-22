// dpm-crawler.js
// 用于爬取 dpm.org.cn 网站内容的脚本
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { uploadLocalFileToCOS, sendToFeishu } = require('../utils');

const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/add';
const SUCCESS_LOG = path.join(__dirname, 'success.log');
const FAIL_LOG = path.join(__dirname, 'fail.log');
const BASE_URL = 'https://www.dpm.org.cn';
const TOTAL_PAGES = 166;

function appendLog(file, data) {
  fs.appendFileSync(file, data + '\n');
}

async function saveToServer({ url, name, source, suffix }) {
  try {
    const res = await axios.post(DESIGN_SERVER_API, {
      url,
      name,
      source,
      suffix
    });
    console.log(`[design-server返回]`, res.data);
  } catch (err) {
    console.error('[保存到design-server失败]', err.message);
  }
}

async function downloadAndUploadToCOS(imgUrl, name) {
  try {
    const res = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    const tempPath = path.join(__dirname, `${name}.jpg`);
    fs.writeFileSync(tempPath, res.data);
    const cosResult = await uploadLocalFileToCOS(tempPath, `dpm/${name}.jpg`);
    fs.unlinkSync(tempPath);
    return cosResult.url;
  } catch (err) {
    throw new Error('下载或上传COS失败: ' + err.message);
  }
}

function getHeaders() {
  return {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Cookie': 'sajssdk_2015_cross_new_user=1; _abfpc=378f26703e0b6c98a8d3f20250df6acadcaed34e_2.0; PHPSESSID=8afa7cafe8313157f2425c82e500de67; cna=c4dcb903aaf25cc291f46723c7b9399c; seasonal=%E9%BB%98%E8%AE%A4; seasonal_bak=%E9%BB%98%E8%AE%A4; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22198313b9214aa4-053b58d85178734-26011151-1327104-198313b9215e3b%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk4MzEzYjkyMTRhYTQtMDUzYjU4ZDg1MTc4NzM0LTI2MDExMTUxLTEzMjcxMDQtMTk4MzEzYjkyMTVlM2IifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%22%2C%22value%22%3A%22%22%7D%7D',
    'Host': 'www.dpm.org.cn',
    'Pragma': 'no-cache',
    'Referer': 'https://www.dpm.org.cn/lights/royal.html',
    'Sec-Ch-Ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
  };
}

async function fetchListPage(page) {
  const url = `${BASE_URL}/searchs/royalb.html?0.521316576229031&category_id=624&p=${page}&pagesize=24&is_pc=0&is_wap=0&is_calendar=0&is_four_k=0`;
  const res = await axios.get(url, { headers: getHeaders() });
  return res.data;
}

async function fetchDetailImgUrl(url) {
  const res = await axios.get(url, { headers: getHeaders() });
  const $ = cheerio.load(res.data);
  const img = $('img[style*="width: 100%"]');
  return img.attr('src');
}

async function main() {
  let totalSuccess = 0;
  let totalFail = 0;
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      console.log(`\n[列表] 第${page}页`);
      const html = await fetchListPage(page);
      const $ = cheerio.load(html);
      const links = [];
      $('a.item-a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) links.push(BASE_URL + href);
      });
      for (const detailUrl of links) {
        let name = detailUrl.split('/').pop().replace('.html', '');
        let imgUrl = '';
        let cosUrl = '';
        let status = 'success';
        let errMsg = '';
        try {
          imgUrl = await fetchDetailImgUrl(detailUrl);
          if (!imgUrl) throw new Error('未找到大图链接');
          console.log(`[图片] ${imgUrl}`);
          // 上传到COS
          cosUrl = await downloadAndUploadToCOS(imgUrl, name);
          // 保存到服务器
          await saveToServer({ url: cosUrl, name, source: 'dpm.org.cn', suffix: 'jpg' });
          appendLog(SUCCESS_LOG, JSON.stringify({ page, name, imgUrl, cosUrl, status }));
          totalSuccess++;
        } catch (err) {
          status = 'fail';
          errMsg = err.message || String(err);
          appendLog(FAIL_LOG, JSON.stringify({ page, name, imgUrl, status, errMsg }));
          totalFail++;
          console.error(`[失败] ${name}:`, errMsg);
        }
      }
    } catch (err) {
      appendLog(FAIL_LOG, JSON.stringify({ page, name: '', imgUrl: '', status: 'fail', errMsg: '页面请求失败: ' + (err.message || String(err)) }));
      totalFail++;
      console.error(`[致命错误] 第${page}页:`, err.message);
    }
  }
  const finishMsg = `✅ dpm.org.cn处理完毕\n成功: ${totalSuccess} 个\n失败: ${totalFail} 个`;
  console.log(finishMsg);
  await sendToFeishu(finishMsg);
  console.log('[结束] dpm-crawler');
}

main(); 