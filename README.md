# 易舍自动化脚本

这是一个自动化爬虫项目，可以爬取百度首页数据并通过飞书机器人发送通知。

## 功能特性

- 🔍 自动爬取百度首页数据
- 📸 自动截图保存
- 🤖 通过飞书机器人发送通知
- ⚡ GitHub Actions 自动运行
- 📅 支持定时任务和手动触发

## 项目结构

```
yishe-scripts/
├── example.js              # 主爬虫脚本
├── package.json            # 项目依赖配置
├── .github/workflows/      # GitHub Actions 工作流
│   ├── main.yml           # 数据库备份工作流
│   └── scraper.yml        # 爬虫工作流
└── README.md              # 项目说明
```

## 安装和运行

### 本地运行

1. 安装依赖：
```bash
npm install
```

2. 设置环境变量：
```bash
export FEISHU_WEBHOOK_URL="你的飞书机器人webhook地址"
```

3. 运行爬虫：
```bash
npm start
```

### GitHub Actions 自动运行

项目配置了GitHub Actions工作流，会在以下情况自动运行：

- 🔄 代码推送到 main/master 分支
- 📝 创建 Pull Request
- ⏰ 每天早上9点定时执行
- 🖱️ 手动触发

## 配置说明

### 飞书机器人配置

1. 在飞书中创建一个机器人
2. 获取webhook地址
3. 在GitHub仓库的Settings > Secrets and variables > Actions中添加：
   - 名称：`FEISHU_WEBHOOK_URL`
   - 值：你的飞书机器人webhook地址

### 工作流触发条件

- **代码推送**：当 `example.js` 或 `package.json` 文件发生变化时
- **定时任务**：每天早上9点自动执行
- **手动触发**：在GitHub Actions页面可以手动运行

## 输出内容

爬虫会收集以下信息并发送到飞书：

- 📄 页面标题
- 🔥 热搜榜（前10个）
- 📰 热门新闻（前5个）
- 📸 页面截图
- ⏰ 执行时间

## 注意事项

- 确保飞书webhook地址正确配置
- 爬虫使用无头浏览器模式运行
- 截图会自动保存到仓库
- 失败时会发送错误通知

## 依赖包

- `puppeteer`: 浏览器自动化
- `axios`: HTTP请求库

## 许可证

MIT License
