const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'config.json');

// 读取配置
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('读取配置文件失败:', error.message);
  }
  return {
    feishuWebhookUrl: '',
    autoSave: true,
    screenshotPath: './screenshots',
    maxRetries: 3
  };
}

// 飞书机器人webhook URL - 优先使用配置文件中的设置
function getFeishuWebhookUrl() {
  const config = loadConfig();
  return config.feishuWebhookUrl || process.env.FEISHU_WEBHOOK_URL || 'https://open.feishu.cn/open-apis/bot/v2/hook/77213058-0955-487d-8376-863ca5845ab4';
}

async function sendToFeishu(message, config) {
  let webhookUrl = '';
  if (config && config.feishuWebhookUrl) {
    webhookUrl = config.feishuWebhookUrl;
  } else if (process.env.FEISHU_WEBHOOK_URL) {
    webhookUrl = process.env.FEISHU_WEBHOOK_URL;
  }
  if (!webhookUrl) {
    console.log('飞书webhook URL未配置，跳过发送消息');
    return;
  }

  try {
    const response = await axios.post(webhookUrl, {
      msg_type: 'text',
      content: { text: message }
    });
    console.log('消息发送成功:', response.data);
  } catch (error) {
    console.error('发送消息到飞书失败:', error.message);
  }
}

async function scrapeBaidu() {
  let browser;
  let result = { success: false, error: null };
  try {
    console.log('开始爬取百度首页数据...');
    const config = loadConfig();
    // 确保截图目录存在
    if (config.autoSave && config.screenshotPath) {
      if (!fs.existsSync(config.screenshotPath)) {
        fs.mkdirSync(config.screenshotPath, { recursive: true });
      }
    }
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto('https://www.baidu.com', { waitUntil: 'networkidle2' });
    const screenshotPath = config.autoSave && config.screenshotPath 
      ? path.join(config.screenshotPath, `baidu_${new Date().toISOString().replace(/[:.]/g, '-')}.png`)
      : 'baidu.png';
    await page.screenshot({ path: screenshotPath });
    const pageData = await page.evaluate(() => {
      const title = document.title;
      const hotSearchItems = Array.from(document.querySelectorAll('.s-hotsearch-content .hotsearch-item')).map(item => {
        const title = item.querySelector('.title-content-title')?.textContent?.trim();
        const index = item.querySelector('.title-content-index')?.textContent?.trim();
        return { index, title };
      }).slice(0, 10);
      const newsItems = Array.from(document.querySelectorAll('.s-hotsearch-content .hotsearch-item')).map(item => {
        const title = item.querySelector('.title-content-title')?.textContent?.trim();
        return title;
      }).slice(0, 5);
      return {
        title,
        hotSearchItems,
        newsItems,
        timestamp: new Date().toISOString()
      };
    });
    console.log('爬取完成，数据:', pageData);
    if (config.autoSave) {
      const dataPath = path.join(config.screenshotPath || '.', `baidu_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(dataPath, JSON.stringify(pageData, null, 2));
      console.log(`数据已保存到: ${dataPath}`);
    }
    const message = `🔍 百度首页数据爬取报告\n\n📅 时间: ${new Date().toLocaleString('zh-CN')}\n📄 页面标题: ${pageData.title}\n\n🔥 热搜榜 (前10):\n${pageData.hotSearchItems.map((item, index) => `${index + 1}. ${item.title || '未知'}`).join('\n')}\n\n📰 热门新闻 (前5):\n${pageData.newsItems.map((item, index) => `${index + 1}. ${item || '未知'}`).join('\n')}\n\n✅ 爬取状态: 成功\n📸 截图已保存: ${screenshotPath}`;
    await sendToFeishu(message, config);
    result.success = true;
    return result;
  } catch (error) {
    console.error('爬取过程中出现错误:', error);
    const errorMessage = `❌ 百度首页数据爬取失败\n\n📅 时间: ${new Date().toLocaleString('zh-CN')}\n❌ 错误信息: ${error.message}\n\n请检查网络连接或网站结构是否发生变化。`;
    const config = loadConfig();
    await sendToFeishu(errorMessage, config);
    result.error = error;
    return result;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 爬取百度新闻首页内容
 * @returns {Promise<void>}
 */
async function scrapeBaiduNews() {
  let browser;
  try {
    console.log('开始爬取百度新闻首页...');
    const config = loadConfig();
    // 确保截图目录存在
    if (config.autoSave && config.screenshotPath) {
      if (!fs.existsSync(config.screenshotPath)) {
        fs.mkdirSync(config.screenshotPath, { recursive: true });
      }
    }
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto('https://news.baidu.com/', { waitUntil: 'networkidle2' });
    // 截图
    const screenshotPath = config.autoSave && config.screenshotPath
      ? path.join(config.screenshotPath, `baidu_news_${new Date().toISOString().replace(/[:.]/g, '-')}.png`)
      : 'baidu_news.png';
    await page.screenshot({ path: screenshotPath });
    // 爬取新闻数据
    const newsData = await page.evaluate(() => {
      // 百度新闻首页主要新闻区块
      const newsList = Array.from(document.querySelectorAll('.hotnews a, .hdline0 a, .hdline1 a, .hdline2 a, .hdline3 a'));
      const news = newsList.map(a => ({
        title: a.textContent.trim(),
        href: a.href
      })).filter(item => item.title && item.href);
      // 只保留前20条
      return news.slice(0, 20);
    });
    console.log('爬取完成，新闻数据:');
    newsData.slice(0, 5).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.title} (${item.href})`);
    });
    // 保存数据
    if (config.autoSave) {
      const dataPath = path.join(config.screenshotPath || '.', `baidu_news_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(dataPath, JSON.stringify(newsData, null, 2));
      console.log(`新闻数据已保存到: ${dataPath}`);
    }
    // 飞书通知
    const message = `📰 百度新闻爬取报告\n\n📅 时间: ${new Date().toLocaleString('zh-CN')}\n\n前5条新闻:\n${newsData.slice(0, 5).map((item, i) => `${i + 1}. ${item.title}`).join('\n')}\n\n✅ 爬取状态: 成功\n📸 截图已保存: ${screenshotPath}`;
    await sendToFeishu(message, config);
    console.log('百度新闻爬取任务完成');
  } catch (error) {
    console.error('爬取百度新闻时出错:', error);
    const errorMessage = `❌ 百度新闻爬取失败\n\n📅 时间: ${new Date().toLocaleString('zh-CN')}\n❌ 错误信息: ${error.message}`;
    await sendToFeishu(errorMessage, config);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  scrapeBaidu();
}

module.exports = { scrapeBaidu, scrapeBaiduNews }; 