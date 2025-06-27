const puppeteer = require('puppeteer');
const axios = require('axios');

// 飞书机器人webhook URL - 需要在GitHub Secrets中配置
const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/77213058-0955-487d-8376-863ca5845ab4';

async function sendToFeishu(message) {
  if (!FEISHU_WEBHOOK_URL) {
    console.log('飞书webhook URL未配置，跳过发送消息');
    return;
  }

  try {
    const response = await axios.post(FEISHU_WEBHOOK_URL, {
      msg_type: 'text',
      content: {
        text: message
      }
    });
    console.log('消息发送成功:', response.data);
  } catch (error) {
    console.error('发送消息到飞书失败:', error.message);
  }
}

async function scrapeBaidu() {
  let browser;
  try {
    console.log('开始爬取百度首页数据...');
    
    // 启动浏览器
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // 新建页面
    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 打开百度首页
    await page.goto('https://www.baidu.com', { waitUntil: 'networkidle2' });
    
    // 截图并保存
    await page.screenshot({ path: 'baidu.png' });
    
    // 爬取页面数据
    const pageData = await page.evaluate(() => {
      const title = document.title;
      const hotSearchItems = Array.from(document.querySelectorAll('.s-hotsearch-content .hotsearch-item')).map(item => {
        const title = item.querySelector('.title-content-title')?.textContent?.trim();
        const index = item.querySelector('.title-content-index')?.textContent?.trim();
        return { index, title };
      }).slice(0, 10); // 只取前10个热搜
      
      const newsItems = Array.from(document.querySelectorAll('.s-hotsearch-content .hotsearch-item')).map(item => {
        const title = item.querySelector('.title-content-title')?.textContent?.trim();
        return title;
      }).slice(0, 5); // 只取前5个新闻
      
      return {
        title,
        hotSearchItems,
        newsItems,
        timestamp: new Date().toISOString()
      };
    });
    
    console.log('爬取完成，数据:', pageData);
    
    // 构建消息内容
    const message = `🔍 百度首页数据爬取报告
    
📅 时间: ${new Date().toLocaleString('zh-CN')}
📄 页面标题: ${pageData.title}

🔥 热搜榜 (前10):
${pageData.hotSearchItems.map((item, index) => `${index + 1}. ${item.title || '未知'}`).join('\n')}

📰 热门新闻 (前5):
${pageData.newsItems.map((item, index) => `${index + 1}. ${item || '未知'}`).join('\n')}

✅ 爬取状态: 成功
📸 截图已保存: baidu.png`;

    // 发送到飞书
    await sendToFeishu(message);
    
    console.log('爬取任务完成');
    
  } catch (error) {
    console.error('爬取过程中出现错误:', error);
    
    const errorMessage = `❌ 百度首页数据爬取失败
    
📅 时间: ${new Date().toLocaleString('zh-CN')}
❌ 错误信息: ${error.message}

请检查网络连接或网站结构是否发生变化。`;
    
    await sendToFeishu(errorMessage);
    
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

module.exports = { scrapeBaidu }; 