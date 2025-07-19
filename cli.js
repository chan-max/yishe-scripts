#!/usr/bin/env node

const inquirer = require('inquirer');
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const chalk = require('chalk');
const ora = require('ora');
const { scrapeBaidu } = require('./example');
const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'config.json');

// 默认配置
const defaultConfig = {
  feishuWebhookUrl: '',
  autoSave: true,
  screenshotPath: './screenshots',
  maxRetries: 3
};

// 读取配置
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('读取配置文件失败:', error.message);
  }
  return { ...defaultConfig };
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('保存配置文件失败:', error.message);
    return false;
  }
}

// 显示欢迎界面
function showWelcome() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║                    易舍自动化爬虫工具                          ║
║                    Yishe Scraper Tool                        ║
╚══════════════════════════════════════════════════════════════╝
  `));
}

// 主菜单
async function showMainMenu() {
  const { action } = await prompt([
    {
      type: 'list',
      name: 'action',
      message: '请选择要执行的操作:',
      choices: [
        { name: '🚀 开始爬取数据', value: 'scrape' },
        { name: '⚙️  配置设置', value: 'config' },
        { name: '📊 查看历史记录', value: 'history' },
        { name: '❓ 帮助信息', value: 'help' },
        { name: '🚪 退出程序', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'scrape':
      await showScrapeMenu();
      break;
    case 'config':
      await showConfigMenu();
      break;
    case 'history':
      await showHistory();
      break;
    case 'help':
      showHelp();
      break;
    case 'exit':
      console.log(chalk.yellow('👋 感谢使用易舍爬虫工具！'));
      process.exit(0);
  }
}

// 爬取菜单
async function showScrapeMenu() {
  const { target } = await prompt([
    {
      type: 'list',
      name: 'target',
      message: '选择要爬取的目标:',
      choices: [
        { name: '🔍 百度首页数据', value: 'baidu' },
        { name: '📰 百度新闻', value: 'baiduNews' },
        { name: '📰 自定义网站', value: 'custom' },
        { name: '⬅️  返回主菜单', value: 'back' }
      ]
    }
  ]);

  if (target === 'back') {
    await showMainMenu();
    return;
  }

  if (target === 'baidu') {
    await startBaiduScraping();
  } else if (target === 'baiduNews') {
    await startBaiduNewsScraping();
  } else if (target === 'custom') {
    await startCustomScraping();
  }
}

// 开始百度爬取
async function startBaiduScraping() {
  const config = loadConfig();
  
  console.log(chalk.cyan('\n📋 爬取配置:'));
  console.log(chalk.gray(`   目标网站: 百度首页`));
  console.log(chalk.gray(`   飞书通知: ${config.feishuWebhookUrl ? '✅ 已配置' : '❌ 未配置'}`));
  console.log(chalk.gray(`   自动保存: ${config.autoSave ? '✅ 开启' : '❌ 关闭'}`));

  const { confirm } = await prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确认开始爬取？',
      default: true
    }
  ]);

  if (!confirm) {
    await showMainMenu();
    return;
  }

  const spinner = ora('正在爬取百度首页数据...').start();
  
  try {
    await scrapeBaidu();
    spinner.succeed(chalk.green('✅ 爬取完成！'));
    
    // 保存历史记录
    saveHistory('baidu', 'success');
    
  } catch (error) {
    spinner.fail(chalk.red('❌ 爬取失败！'));
    console.error(chalk.red('错误信息:'), error.message);
    
    // 保存历史记录
    saveHistory('baidu', 'failed', error.message);
  }

  const { continueAction } = await prompt([
    {
      type: 'list',
      name: 'continueAction',
      message: '接下来要做什么？',
      choices: [
        { name: '🔄 再次爬取', value: 'retry' },
        { name: '⬅️  返回主菜单', value: 'back' },
        { name: '🚪 退出程序', value: 'exit' }
      ]
    }
  ]);

  switch (continueAction) {
    case 'retry':
      await startBaiduScraping();
      break;
    case 'back':
      await showMainMenu();
      break;
    case 'exit':
      console.log(chalk.yellow('👋 感谢使用易舍爬虫工具！'));
      process.exit(0);
  }
}

// 自定义爬取
async function startCustomScraping() {
  const { url } = await prompt([
    {
      type: 'input',
      name: 'url',
      message: '请输入要爬取的网站URL:',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return '请输入有效的URL地址';
        }
      }
    }
  ]);

  console.log(chalk.yellow('⚠️  自定义爬取功能正在开发中...'));
  console.log(chalk.gray(`   您输入的URL: ${url}`));
  
  await showMainMenu();
}

// 新增：百度新闻爬取交互
async function startBaiduNewsScraping() {
  const config = loadConfig();
  console.log(chalk.cyan('\n📋 爬取配置:'));
  console.log(chalk.gray(`   目标网站: 百度新闻 https://news.baidu.com/`));
  console.log(chalk.gray(`   飞书通知: ${config.feishuWebhookUrl ? '✅ 已配置' : '❌ 未配置'}`));
  console.log(chalk.gray(`   自动保存: ${config.autoSave ? '✅ 开启' : '❌ 关闭'}`));

  const { confirm } = await prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确认开始爬取百度新闻？',
      default: true
    }
  ]);

  if (!confirm) {
    await showMainMenu();
    return;
  }

  const spinner = ora('正在爬取百度新闻...').start();
  try {
    const { scrapeBaiduNews } = require('./example');
    await scrapeBaiduNews();
    spinner.succeed(chalk.green('✅ 百度新闻爬取完成！'));
    saveHistory('baiduNews', 'success');
  } catch (error) {
    spinner.fail(chalk.red('❌ 百度新闻爬取失败！'));
    console.error(chalk.red('错误信息:'), error.message);
    saveHistory('baiduNews', 'failed', error.message);
  }

  const { continueAction } = await prompt([
    {
      type: 'list',
      name: 'continueAction',
      message: '接下来要做什么？',
      choices: [
        { name: '🔄 再次爬取百度新闻', value: 'retry' },
        { name: '⬅️  返回主菜单', value: 'back' },
        { name: '🚪 退出程序', value: 'exit' }
      ]
    }
  ]);

  switch (continueAction) {
    case 'retry':
      await startBaiduNewsScraping();
      break;
    case 'back':
      await showMainMenu();
      break;
    case 'exit':
      console.log(chalk.yellow('👋 感谢使用易舍爬虫工具！'));
      process.exit(0);
  }
}

// 配置菜单
async function showConfigMenu() {
  const config = loadConfig();
  
  const { configAction } = await prompt([
    {
      type: 'list',
      name: 'configAction',
      message: '配置设置:',
      choices: [
        { name: '🔗 设置飞书Webhook', value: 'webhook' },
        { name: '💾 自动保存设置', value: 'autosave' },
        { name: '📁 截图保存路径', value: 'screenshot' },
        { name: '🔄 重置为默认配置', value: 'reset' },
        { name: '⬅️  返回主菜单', value: 'back' }
      ]
    }
  ]);

  if (configAction === 'back') {
    await showMainMenu();
    return;
  }

  switch (configAction) {
    case 'webhook':
      await setWebhookConfig(config);
      break;
    case 'autosave':
      await setAutoSaveConfig(config);
      break;
    case 'screenshot':
      await setScreenshotConfig(config);
      break;
    case 'reset':
      await resetConfig();
      break;
  }
}

// 设置飞书Webhook
async function setWebhookConfig(config) {
  const { webhookUrl } = await prompt([
    {
      type: 'input',
      name: 'webhookUrl',
      message: '请输入飞书机器人Webhook URL:',
      default: config.feishuWebhookUrl,
      validate: (input) => {
        if (!input) return true; // 允许为空
        try {
          new URL(input);
          return true;
        } catch {
          return '请输入有效的URL地址';
        }
      }
    }
  ]);

  config.feishuWebhookUrl = webhookUrl;
  
  if (saveConfig(config)) {
    console.log(chalk.green('✅ 飞书Webhook配置已保存！'));
  } else {
    console.log(chalk.red('❌ 配置保存失败！'));
  }

  await showConfigMenu();
}

// 设置自动保存
async function setAutoSaveConfig(config) {
  const { autoSave } = await prompt([
    {
      type: 'confirm',
      name: 'autoSave',
      message: '是否开启自动保存截图和数据？',
      default: config.autoSave
    }
  ]);

  config.autoSave = autoSave;
  
  if (saveConfig(config)) {
    console.log(chalk.green(`✅ 自动保存已${autoSave ? '开启' : '关闭'}！`));
  } else {
    console.log(chalk.red('❌ 配置保存失败！'));
  }

  await showConfigMenu();
}

// 设置截图路径
async function setScreenshotConfig(config) {
  const { screenshotPath } = await prompt([
    {
      type: 'input',
      name: 'screenshotPath',
      message: '请输入截图保存路径:',
      default: config.screenshotPath
    }
  ]);

  config.screenshotPath = screenshotPath;
  
  if (saveConfig(config)) {
    console.log(chalk.green('✅ 截图保存路径已更新！'));
  } else {
    console.log(chalk.red('❌ 配置保存失败！'));
  }

  await showConfigMenu();
}

// 重置配置
async function resetConfig() {
  const { confirm } = await prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确定要重置所有配置为默认值吗？',
      default: false
    }
  ]);

  if (confirm) {
    if (saveConfig(defaultConfig)) {
      console.log(chalk.green('✅ 配置已重置为默认值！'));
    } else {
      console.log(chalk.red('❌ 配置重置失败！'));
    }
  }

  await showConfigMenu();
}

// 显示历史记录
async function showHistory() {
  const historyFile = path.join(__dirname, 'history.json');
  
  try {
    if (fs.existsSync(historyFile)) {
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      
      console.log(chalk.cyan('\n📊 爬取历史记录:'));
      console.log(chalk.gray('═'.repeat(80)));
      
      history.slice(-10).reverse().forEach((record, index) => {
        const status = record.status === 'success' ? chalk.green('✅') : chalk.red('❌');
        const time = new Date(record.timestamp).toLocaleString('zh-CN');
        console.log(`${status} ${time} - ${record.target} ${record.status === 'success' ? '成功' : '失败'}`);
        
        if (record.error) {
          console.log(chalk.gray(`   错误: ${record.error}`));
        }
      });
    } else {
      console.log(chalk.yellow('📭 暂无历史记录'));
    }
  } catch (error) {
    console.log(chalk.red('❌ 读取历史记录失败'));
  }

  const { action } = await prompt([
    {
      type: 'list',
      name: 'action',
      message: '选择操作:',
      choices: [
        { name: '⬅️  返回主菜单', value: 'back' },
        { name: '🗑️  清空历史记录', value: 'clear' }
      ]
    }
  ]);

  if (action === 'clear') {
    await clearHistory();
  } else {
    await showMainMenu();
  }
}

// 保存历史记录
function saveHistory(target, status, error = null) {
  const historyFile = path.join(__dirname, 'history.json');
  
  try {
    let history = [];
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
    
    history.push({
      target,
      status,
      error,
      timestamp: new Date().toISOString()
    });
    
    // 只保留最近100条记录
    if (history.length > 100) {
      history = history.slice(-100);
    }
    
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('保存历史记录失败:', error.message);
  }
}

// 清空历史记录
async function clearHistory() {
  const { confirm } = await prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确定要清空所有历史记录吗？',
      default: false
    }
  ]);

  if (confirm) {
    const historyFile = path.join(__dirname, 'history.json');
    try {
      if (fs.existsSync(historyFile)) {
        fs.unlinkSync(historyFile);
      }
      console.log(chalk.green('✅ 历史记录已清空！'));
    } catch (error) {
      console.log(chalk.red('❌ 清空历史记录失败！'));
    }
  }

  await showMainMenu();
}

// 显示帮助信息
function showHelp() {
  console.log(chalk.cyan('\n📖 使用帮助:'));
  console.log(chalk.gray('═'.repeat(80)));
  console.log(chalk.white(`
🔧 功能说明:
  • 自动爬取网站数据
  • 支持截图保存
  • 飞书机器人通知
  • 历史记录管理
  • 配置自定义设置

🚀 快速开始:
  1. 选择"配置设置"设置飞书Webhook
  2. 选择"开始爬取数据"
  3. 选择要爬取的目标网站
  4. 等待爬取完成

⚙️  配置选项:
  • 飞书Webhook: 用于发送通知
  • 自动保存: 是否自动保存截图和数据
  • 截图路径: 截图文件的保存位置

📊 历史记录:
  • 查看最近10次爬取记录
  • 显示成功/失败状态
  • 支持清空历史记录

🔗 相关链接:
  • GitHub: https://github.com/your-repo/yishe-scripts
  • 文档: https://docs.example.com
  `));

  prompt([
    {
      type: 'list',
      name: 'action',
      message: '选择操作:',
      choices: [
        { name: '⬅️  返回主菜单', value: 'back' }
      ]
    }
  ]).then(({ action }) => {
    if (action === 'back') {
      showMainMenu();
    }
  });
}

// 主程序入口
async function main() {
  showWelcome();
  await showMainMenu();
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ 未处理的Promise拒绝:'), reason);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 未捕获的异常:'), error);
  process.exit(1);
});

// 启动程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  showMainMenu,
  loadConfig,
  saveConfig,
  saveHistory
}; 