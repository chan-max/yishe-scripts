module.exports = {
    apps: [{
        name: 'hotsearch-crawler',
        script: 'scripts/hotsearch/main.js',
        args: '--feishu',
        instances: 1,
        autorestart: false,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production'
        },
        cron_restart: '0 * * * *', // 每小时执行一次
        log_file: '/var/log/hotsearch.log',
        out_file: '/var/log/hotsearch-out.log',
        error_file: '/var/log/hotsearch-error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }]
};