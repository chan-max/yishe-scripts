#!/usr/bin/env node

const {
    spawn
} = require('child_process');

console.log('🚀 恒优信调度器启动...');

// 执行爬取任务
function runCrawler() {
    console.log(`📅 [${new Date().toLocaleString()}] 开始执行爬取任务...`);

    const crawler = spawn('node', ['index.js', 'yesterday'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    crawler.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ [${new Date().toLocaleString()}] 爬取任务完成`);
        } else {
            console.log(`❌ [${new Date().toLocaleString()}] 爬取任务失败，退出码: ${code}`);
        }
    });

    crawler.on('error', (error) => {
        console.log(`❌ [${new Date().toLocaleString()}] 爬取任务出错: ${error.message}`);
    });
}

// 计算到下一个凌晨2点的时间
function getNextExecutionTime() {
    const now = new Date();
    const next = new Date(now);

    // 设置为明天凌晨2点
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);

    return next;
}

// 启动调度器
function startScheduler() {
    console.log('📅 调度器已启动');

    // 计算下次执行时间
    const nextExecution = getNextExecutionTime();
    console.log(`⏰ 下次执行时间: ${nextExecution.toLocaleString()}`);

    // 设置定时器
    const timeUntilNext = nextExecution.getTime() - Date.now();

    setTimeout(() => {
        // 执行爬取任务
        runCrawler();

        // 设置每天执行一次
        setInterval(() => {
            runCrawler();
        }, 24 * 60 * 60 * 1000); // 24小时

    }, timeUntilNext);

    console.log('✅ 定时任务已注册，等待执行...');
}

// 如果直接运行此脚本，启动调度器
if (require.main === module) {
    startScheduler();

    // 保持进程运行
    process.on('SIGINT', () => {
        console.log('\n🛑 调度器正在停止...');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 调度器正在停止...');
        process.exit(0);
    });
}

module.exports = {
    startScheduler,
    runCrawler
};