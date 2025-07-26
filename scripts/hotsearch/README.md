# 热搜索爬虫 - PM2 管理

## 目录结构
```
hotsearch/
├── main.js              # 主脚本
├── platforms.js         # 平台配置
├── platforms/           # 各平台爬虫
├── ecosystem.config.js  # PM2 配置文件
├── logs/               # 日志目录
│   ├── hotsearch.log
│   ├── hotsearch-out.log
│   └── hotsearch-error.log
└── README.md           # 说明文档
```

## PM2 管理命令

### 启动应用
```bash
pm2 start ecosystem.config.js
```

### 查看状态
```bash
pm2 status
pm2 list
```

### 查看日志
```bash
# 查看实时日志
pm2 logs hotsearch-crawler

# 查看特定日志文件
tail -f logs/hotsearch.log
tail -f logs/hotsearch-error.log
```

### 停止应用
```bash
pm2 stop hotsearch-crawler
```

### 重启应用
```bash
pm2 restart hotsearch-crawler
```

### 删除应用
```bash
pm2 delete hotsearch-crawler
```

## 配置说明

- **定时执行**: 每小时执行一次 (`0 * * * *`)
- **启动参数**: `--feishu` (启用飞书通知)
- **内存限制**: 1GB
- **日志位置**: `./logs/` 目录下
- **环境**: 生产环境 (`NODE_ENV=production`)

## 日志文件

- `logs/hotsearch.log` - 标准日志
- `logs/hotsearch-out.log` - 输出日志  
- `logs/hotsearch-error.log` - 错误日志 