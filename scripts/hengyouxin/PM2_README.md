# PM2 定时执行配置说明

## 概述
使用 PM2 定时执行 hengyouxin 脚本，每天自动爬取前一天的素材。

## 安装 PM2
```bash
# 全局安装 PM2
npm install -g pm2

# 或者使用 yarn
yarn global add pm2
```

## 配置文件说明

### hengyouxin-pm2-scheduler.config.js
- **hengyouxin-yesterday**: 生产环境配置，每天凌晨 2 点执行
- **hengyouxin-yesterday-test**: 测试环境配置，每 5 分钟执行一次（用于测试）

### 定时配置
```javascript
// 每天凌晨 2 点执行
cron_restart: '0 2 * * *'

// 每 5 分钟执行一次（测试用）
cron_restart: '*/5 * * * *'
```

### Cron 表达式说明
```
* * * * *
│ │ │ │ │
│ │ │ │ └── 星期几 (0-7, 0 和 7 都表示星期日)
│ │ │ └──── 月份 (1-12)
│ │ └────── 日期 (1-31)
│ └──────── 小时 (0-23)
└────────── 分钟 (0-59)
```

## 使用方法

### 1. 启动定时任务
```bash
# 启动生产环境定时任务（每天凌晨 2 点执行）
pm2 start hengyouxin-pm2-scheduler.config.js --only hengyouxin-yesterday

# 启动测试环境定时任务（每 5 分钟执行一次）
pm2 start hengyouxin-pm2-scheduler.config.js --only hengyouxin-yesterday-test

# 启动所有定时任务
pm2 start hengyouxin-pm2-scheduler.config.js
```

### 2. 查看任务状态
```bash
# 查看所有 PM2 进程
pm2 list

# 查看特定进程状态
pm2 show hengyouxin-yesterday

# 查看日志
pm2 logs hengyouxin-yesterday
pm2 logs hengyouxin-yesterday-test
```

### 3. 停止任务
```bash
# 停止特定任务
pm2 stop hengyouxin-yesterday
pm2 stop hengyouxin-yesterday-test

# 停止所有任务
pm2 stop all
```

### 4. 重启任务
```bash
# 重启特定任务
pm2 restart hengyouxin-yesterday

# 重启所有任务
pm2 restart all
```

### 5. 删除任务
```bash
# 删除特定任务
pm2 delete hengyouxin-yesterday

# 删除所有任务
pm2 delete all
```

### 6. 保存和恢复配置
```bash
# 保存当前 PM2 配置
pm2 save

# 恢复保存的配置
pm2 resurrect
```

## 日志管理

### 日志文件位置
- 错误日志: `./logs/err.log`
- 输出日志: `./logs/out.log`
- 合并日志: `./logs/combined.log`
- 测试错误日志: `./logs/test-err.log`
- 测试输出日志: `./logs/test-out.log`
- 测试合并日志: `./logs/test-combined.log`

### 查看日志
```bash
# 实时查看日志
pm2 logs hengyouxin-yesterday --lines 100

# 查看错误日志
pm2 logs hengyouxin-yesterday --err

# 查看输出日志
pm2 logs hengyouxin-yesterday --out

# 清空日志
pm2 flush hengyouxin-yesterday
```

## 监控和管理

### 1. PM2 监控面板
```bash
# 启动 PM2 监控面板
pm2 monit
```

### 2. 进程监控
```bash
# 查看进程详细信息
pm2 show hengyouxin-yesterday

# 查看资源使用情况
pm2 status
```

### 3. 自动重启配置
```bash
# 设置 PM2 开机自启动
pm2 startup

# 保存当前配置
pm2 save
```

## 常见问题

### 1. 认证信息过期
如果遇到 401 错误，需要手动更新认证信息：
```bash
# 停止定时任务
pm2 stop hengyouxin-yesterday

# 手动更新认证信息
npm run hengyouxin:update

# 重新启动定时任务
pm2 start hengyouxin-pm2-scheduler.config.js --only hengyouxin-yesterday
```

### 2. 修改定时时间
编辑 `hengyouxin-pm2-scheduler.config.js` 文件中的 `cron_restart` 字段：
```javascript
// 每天凌晨 3 点执行
cron_restart: '0 3 * * *'

// 每天上午 9 点和下午 6 点执行
cron_restart: '0 9,18 * * *'
```

### 3. 查看执行历史
```bash
# 查看昨天的日志文件
npm run hengyouxin:yesterday-log

# 查看 PM2 日志
pm2 logs hengyouxin-yesterday --lines 200
```

## 推荐的部署流程

### 1. 首次部署
```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 测试脚本是否正常
npm run hengyouxin:yesterday

# 3. 启动定时任务
pm2 start hengyouxin-pm2-scheduler.config.js --only hengyouxin-yesterday

# 4. 保存配置
pm2 save

# 5. 设置开机自启动
pm2 startup
```

### 2. 日常维护
```bash
# 查看任务状态
pm2 list

# 查看最新日志
pm2 logs hengyouxin-yesterday --lines 50

# 检查昨天爬取结果
npm run hengyouxin:yesterday-log
```

### 3. 故障排查
```bash
# 查看错误日志
pm2 logs hengyouxin-yesterday --err

# 重启任务
pm2 restart hengyouxin-yesterday

# 检查认证信息
npm run hengyouxin:test
```

## 注意事项

1. **认证信息管理**: 定期检查认证信息是否过期
2. **日志轮转**: PM2 会自动管理日志文件大小
3. **资源监控**: 注意内存使用情况，避免内存泄漏
4. **网络稳定性**: 确保服务器网络连接稳定
5. **备份重要数据**: 定期备份认证配置和重要日志 