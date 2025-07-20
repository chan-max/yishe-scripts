# 易舍自动化脚本

这是一个功能强大的自动化爬虫项目，支持交互式命令行界面，可以爬取网站数据并通过飞书机器人发送通知。

## 🚀 功能特性

- 🔍 自动爬取网站数据（支持百度首页等）
- 🖥️ 交互式命令行界面，操作简单直观
- 📸 自动截图保存，支持自定义保存路径
- 🤖 通过飞书机器人发送通知
- ⚙️ 配置文件管理，支持自定义设置
- 📊 历史记录管理，查看爬取历史
- ⚡ GitHub Actions 自动运行
- 📅 支持定时任务和手动触发

## 📁 项目结构

```
yishe-scripts/
├── cli.js                   # 主命令行界面脚本
├── example.js               # 爬虫核心逻辑
├── package.json             # 项目依赖配置
├── start.sh                 # Linux/macOS 启动脚本
├── start.bat                # Windows 启动脚本
├── config.json              # 配置文件（运行时生成）
├── history.json             # 历史记录（运行时生成）
├── screenshots/             # 截图保存目录
├── scripts/                 # 示例脚本
│   └── example-usage.js     # 使用示例
├── .github/workflows/       # GitHub Actions 工作流
│   ├── main.yml            # 数据库备份工作流
│   └── scraper.yml         # 爬虫工作流
└── README.md               # 项目说明
```

## 🛠️ 安装和运行

### 快速启动

#### Windows 用户

```bash
# 双击运行
start.bat

# 或在命令行运行
.\start.bat
```

#### Linux/macOS 用户

```bash
# 直接运行
./start.sh

# 或使用 bash
bash start.sh
```

### 手动安装和运行

1. 安装依赖：

```bash
npm install
```

2. 运行交互式界面：

```bash
npm start
# 或者
node cli.js
```

3. 直接运行爬虫（无界面）：

```bash
npm run scrape
# 或者
node example.js
```

4. 运行使用示例：

```bash
npm run example
# 或者
node scripts/example-usage.js
```

5. 配置自动化部署：

```bash
npm run deploy:setup
```

6. 手动部署：

```bash
npm run deploy
```

## 🎯 使用说明

### 交互式界面

运行后，会显示主菜单：

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

### 配置设置

在主菜单中选择"配置设置"，可以配置：

- 🔗 **飞书Webhook**: 设置飞书机器人通知地址
- 💾 **自动保存**: 是否自动保存截图和数据
- 📁 **截图路径**: 截图文件的保存位置
- 🔄 **重置配置**: 恢复默认设置

### 爬取功能

支持以下爬取目标：

- 🔍 **百度首页数据**: 爬取热搜榜、热门新闻等
- 📰 **自定义网站**: 输入URL进行爬取（开发中）

### 历史记录

- 查看最近10次爬取记录
- 显示成功/失败状态和错误信息
- 支持清空历史记录

## ⚙️ 配置说明

### 配置文件 (config.json)

```json
{
  "feishuWebhookUrl": "https://open.feishu.cn/open-apis/bot/v2/hook/xxx",
  "autoSave": true,
  "screenshotPath": "./screenshots",
  "maxRetries": 3
}
```

### 环境变量

- `FEISHU_WEBHOOK_URL`: 飞书机器人webhook地址

### 飞书机器人配置

1. 在飞书中创建一个机器人
2. 获取webhook地址
3. 在配置中设置 `feishuWebhookUrl`

## 📊 输出内容

爬虫会收集以下信息并发送到飞书：

- 📄 页面标题
- 🔥 热搜榜（前10个）
- 📰 热门新闻（前5个）
- 📸 页面截图
- ⏰ 执行时间
- 📁 数据文件（JSON格式）

## 🔧 开发说明

### 添加新的爬取目标

1. 在 `example.js` 中添加新的爬取函数
2. 在 `cli.js` 的 `showScrapeMenu()` 中添加选项
3. 实现对应的爬取逻辑

### 自定义配置

1. 在 `defaultConfig` 中添加新配置项
2. 在配置菜单中添加设置选项
3. 在爬取逻辑中使用配置

## 🚀 GitHub Actions

项目配置了GitHub Actions工作流，会在以下情况自动运行：

- 🔄 代码推送到 main/master 分支
- 📝 创建 Pull Request
- ⏰ 每天早上9点定时执行
- 🖱️ 手动触发

## 🚀 自动化部署

### 功能特性

- ✅ 自动触发：推送到main/master/develop分支时自动部署
- ✅ 手动触发：可以在GitHub Actions页面手动触发部署
- ✅ 文件过滤：自动排除不需要的文件（node_modules、.git等）
- ✅ 版本备份：自动备份当前版本，支持回滚
- ✅ 密码认证：使用用户名密码方式连接服务器
- ✅ 部署通知：部署完成后显示详细信息

### 快速配置

1. 运行部署配置向导：

```bash
npm run deploy:setup
```

2. 按照向导提示配置GitHub Secrets
3. 在Windows服务器上准备部署环境
4. 推送代码触发自动部署

详细配置说明请参考 [DEPLOY_SETUP.md](./DEPLOY_SETUP.md) 文件。

## 📋 依赖包

### 核心依赖

- `puppeteer`: 浏览器自动化
- `axios`: HTTP请求库

### 命令行界面

- `inquirer`: 交互式命令行界面
- `chalk`: 终端颜色输出
- `ora`: 加载动画

## 🐛 故障排除

### 常见问题

1. **Puppeteer 下载失败**

   ```bash
   # 设置镜像源
   export PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors
   npm install
   ```
2. **权限问题（Linux/macOS）**

   ```bash
   chmod +x start.sh
   chmod +x cli.js
   ```
3. **依赖安装失败**

   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```
4. **Node.js 版本问题**

   ```bash
   # 检查 Node.js 版本
   node --version
   # 建议使用 Node.js 16+ 版本
   ```

### 日志文件

程序运行时会生成以下文件：

- `config.json`: 配置文件
- `history.json`: 历史记录
- `screenshots/`: 截图目录

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请通过以下方式联系：

- GitHub Issues
- 邮箱: your-email@example.com


# 

#
