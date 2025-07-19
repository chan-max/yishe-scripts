#!/usr/bin/env node
const puppeteer = require('puppeteer');
const axios = require('axios');
const inquirer = require('inquirer');
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);

// 直接写死飞书 webhook 地址
const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/4040ef7e-9776-4010-bf53-c30e4451b449';

// 发送飞书
async function sendToFeishu(message) {
  if (!FEISHU_WEBHOOK_URL) {
    console.log('飞书webhook URL未配置，跳过发送消息');
    return;
  }
  try {
    const response = await axios.post(FEISHU_WEBHOOK_URL, {
      msg_type: 'text',
      content: { text: message }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('飞书消息发送成功:', response.data);
  } catch (error) {
    console.error('发送消息到飞书失败:', error.message);
    if (error.response) {
      console.error('飞书返回:', error.response.data);
    }
  }
}

(async function main() {
  console.log('\n=== 简单 Puppeteer 自动化爬虫 ===\n');
  console.log('飞书通知: 已写死在代码里');

  // 用户输入网址
  const { url } = await prompt([
    {
      type: 'input',
      name: 'url',
      message: '请输入要爬取的网址（如 https://news.baidu.com/ ）:',
      validate: input => {
        try {
          new URL(input);
          return true;
        } catch {
          return '请输入有效的网址';
        }
      }
    }
  ]);

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    // 抓取前5条文本内容（简单示例：取前5个 <a> 标签的文本）
    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => a.textContent.trim())
        .filter(Boolean)
        .slice(0, 5);
    });
    console.log('\n页面标题:', title);
    console.log('前5条内容:');
    items.forEach((item, i) => console.log(`${i + 1}. ${item}`));
    // 飞书通知
    const msg = `🌐 自动化爬虫结果\n\n网址: ${url}\n标题: ${title}\n前5条内容:\n${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
    await sendToFeishu(msg);
    console.log('\n✅ 爬取并通知完成！');
  } catch (e) {
    console.error('\n❌ 爬取失败:', e.message);
    await sendToFeishu(`❌ 爬取失败\n网址: ${url}\n错误: ${e.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})(); 