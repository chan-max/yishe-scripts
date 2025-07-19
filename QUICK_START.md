# 快速开始指南

## 🚀 5分钟快速上手

### 1. 环境准备

确保你的系统已安装 Node.js（版本 16+）：

```bash
node --version
```

### 2. 下载项目

```bash
git clone <your-repo-url>
cd yishe-scripts
```

### 3. 一键启动

#### Windows 用户
```bash
start.bat
```

#### Linux/macOS 用户
```bash
./start.sh
```

### 4. 开始使用

启动后会看到交互式菜单：

```
╔══════════════════════════════════════════════════════════════╗
║                    易舍自动化爬虫工具                          ║
║                    Yishe Scraper Tool                        ║
╚══════════════════════════════════════════════════════════════╝

请选择要执行的操作:
❯ 🚀 开始爬取数据
  ⚙️  配置设置
  📊 查看历史记录
  ❓ 帮助信息
  🚪 退出程序
```

## 🎯 基本操作流程

### 第一次使用

1. **配置飞书通知**（可选）
   - 选择 "⚙️ 配置设置"
   - 选择 "🔗 设置飞书Webhook"
   - 输入你的飞书机器人webhook地址

2. **开始爬取**
   - 选择 "🚀 开始爬取数据"
   - 选择 "🔍 百度首页数据"
   - 确认开始爬取

3. **查看结果**
   - 爬取完成后会显示结果
   - 截图保存在 `screenshots/` 目录
   - 数据文件保存为 JSON 格式

### 常用功能

- **📊 查看历史记录**: 查看最近10次爬取记录
- **⚙️ 配置设置**: 修改各种配置选项
- **❓ 帮助信息**: 查看详细使用说明

## 🔧 高级配置

### 配置文件 (config.json)

程序会自动生成配置文件，你可以手动编辑：

```json
{
  "feishuWebhookUrl": "https://open.feishu.cn/open-apis/bot/v2/hook/xxx",
  "autoSave": true,
  "screenshotPath": "./screenshots",
  "maxRetries": 3
}
```

### 环境变量

```bash
export FEISHU_WEBHOOK_URL="你的飞书webhook地址"
```

## 🐛 常见问题

### Q: 启动时提示 "未找到 Node.js"
A: 请先安装 Node.js，下载地址：https://nodejs.org/

### Q: 依赖安装失败
A: 尝试以下命令：
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q: Puppeteer 下载慢
A: 设置镜像源：
```bash
export PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors
npm install
```

### Q: 权限问题（Linux/macOS）
A: 给脚本添加执行权限：
```bash
chmod +x start.sh
chmod +x cli.js
```

## 📞 获取帮助

- 查看帮助信息：在程序中选择 "❓ 帮助信息"
- 运行测试：`npm run test`
- 查看示例：`npm run example`

## 🎉 恭喜！

现在你已经成功配置并运行了易舍爬虫工具！

- 程序会自动保存截图和数据
- 支持飞书机器人通知
- 可以查看历史记录
- 配置会自动保存

开始你的爬虫之旅吧！🚀 