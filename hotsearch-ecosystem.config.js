module.exports = {
    apps: [{
        name: 'hotsearch-crawler',
        // ===== HOTSEARCH CONFIG =====
        // 热搜索数据爬虫 - 每小时获取各平台热搜数据
        script: 'scripts/hotsearch/main.js',
        args: '--feishu',
        instances: 1,
        autorestart: false,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production'
        },
        cron_restart: '0 * * * *', // 每小时执行一次 - 获取热搜数据
        log_file: './scripts/hotsearch/logs/hotsearch.log',
        out_file: './scripts/hotsearch/logs/hotsearch-out.log',
        error_file: './scripts/hotsearch/logs/hotsearch-error.log',
        // 日志文件说明：
        // - hotsearch.log: 标准日志输出
        // - hotsearch-out.log: 程序输出日志
        // - hotsearch-error.log: 错误日志
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        // ===== HOTSEARCH CONFIG END =====
    }]
};