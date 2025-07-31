# PM2 定时任务快速开始指南

## 🚀 快速启动

### 1. 安装 PM2（如果未安装）
```bash
npm install -g pm2
```

### 2. 使用 npm 命令启动
```bash
# 启动生产环境定时任务（每天凌晨 2 点执行）
npm run hengyouxin:pm2-start

# 启动测试环境定时任务（每 5 分钟执行一次）
npm run hengyouxin:pm2-start-test

# 查看任务状态
npm run hengyouxin:pm2-status

# 查看日志
npm run hengyouxin:pm2-logs

# 停止任务
npm run hengyouxin:pm2-stop

# 重启任务
npm run hengyouxin:pm2-restart
```

### 3. 使用脚本启动
```bash
cd scripts/hengyouxin

# 启动生产环境任务
./start-pm2.sh start-prod

# 启动测试环境任务
./start-pm2.sh start-test

# 查看状态
./start-pm2.sh status

# 查看日志
./start-pm2.sh logs
```

## 📋 配置文件

- **配置文件**: `hengyouxin-pm2-scheduler.config.js`
- **启动脚本**: `start-pm2.sh`
- **日志目录**: `logs/`
- **昨天日志目录**: `yesterday_logs/`

## ⏰ 定时设置

- **生产环境**: 每天凌晨 2 点执行 (`0 2 * * *`)
- **测试环境**: 每 5 分钟执行一次 (`*/5 * * * *`)

## 📊 监控命令

```bash
# 查看所有 PM2 进程
pm2 list

# 查看特定进程详情
pm2 show hengyouxin-yesterday

# 实时监控
pm2 monit

# 查看昨天爬取结果
npm run hengyouxin:yesterday-log
```

## 🔧 故障排查

```bash
# 查看错误日志
pm2 logs hengyouxin-yesterday --err

# 重启任务
pm2 restart hengyouxin-yesterday

# 检查认证信息
npm run hengyouxin:test
```

## 📝 注意事项

1. 首次启动前请确保认证信息有效
2. 建议先运行测试环境验证配置
3. 生产环境建议在服务器重启后重新启动任务
4. 定期检查日志确保任务正常运行 