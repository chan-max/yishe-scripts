# 🔧 调度器修复说明

## 问题描述

之前的PM2配置使用了 `cron_restart`，这会导致：
- 启动时立即执行爬取任务
- 每次定时重启时都会执行爬取任务
- 造成循环执行，不断下载和删除图片

## 解决方案

### 1. 新的调度器架构

使用专门的调度器脚本 `scheduler.js`：
- ✅ 启动时不会立即执行爬取任务
- ✅ 只在指定时间（每天凌晨2点）执行
- ✅ 避免循环执行问题
- ✅ 使用内置定时器，无需额外依赖

### 2. 调度器工作原理

```javascript
// 计算到下一个凌晨2点的时间
function getNextExecutionTime() {
    const now = new Date();
    const next = new Date(now);
    
    // 设置为明天凌晨2点
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);
    
    return next;
}
```

### 3. 启动流程

1. **调度器启动**：计算下次执行时间
2. **等待执行**：等待到凌晨2点
3. **执行爬取**：运行爬取任务
4. **循环执行**：每24小时执行一次

## 使用方法

### 启动调度器
```bash
# 在根目录
npm run hengyouxin:pm2-start

# 或在hengyouxin目录
node manage.js start
```

### 管理调度器
```bash
# 查看状态
npm run hengyouxin:pm2-status

# 查看日志
npm run hengyouxin:pm2-logs

# 重启调度器
npm run hengyouxin:pm2-restart

# 停止调度器
npm run hengyouxin:pm2-stop
```

## 日志文件

- **调度器日志**：`logs/scheduler-combined.log`
- **爬取任务日志**：`yesterday_logs/` 目录
- **上传日志**：`cos-upload.log`, `server-upload.log`, `fail.log`

## 测试模式

如果需要立即测试，可以：
```bash
# 直接运行一次爬取
npm run hengyouxin:yesterday

# 或启动测试模式
npm run hengyouxin:pm2-start-test
```

## 优势

1. **避免循环执行**：启动时不会立即执行
2. **精确时间控制**：只在凌晨2点执行
3. **资源节约**：不会占用过多系统资源
4. **日志清晰**：调度器和爬取任务日志分离
5. **易于管理**：统一的管理命令

## 注意事项

- 调度器进程会一直运行，等待执行时间
- 如果需要修改执行时间，编辑 `scheduler.js` 中的 `getNextExecutionTime` 函数
- 重启调度器会重新计算下次执行时间 