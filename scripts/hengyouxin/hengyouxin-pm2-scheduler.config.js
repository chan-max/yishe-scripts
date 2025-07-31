/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-31 22:22:06
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-31 22:28:12
 * @FilePath: /yishe-scripts/scripts/hengyouxin/ecosystem.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
module.exports = {
    apps: [{
            name: 'hengyouxin-yesterday',
            script: 'index.js',
            args: 'yesterday',
            cwd: __dirname,
            instances: 1,
            autorestart: false,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            // 每天凌晨 2 点执行
            cron_restart: '0 2 * * *',
            // 日志轮转配置
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            // 进程管理
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 3000,
            // 错误处理
            max_restarts: 3,
            min_uptime: '10s'
        },
        {
            name: 'hengyouxin-yesterday-test',
            script: 'index.js',
            args: 'yesterday',
            cwd: __dirname,
            instances: 1,
            autorestart: false,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            error_file: './logs/test-err.log',
            out_file: './logs/test-out.log',
            log_file: './logs/test-combined.log',
            time: true,
            // 测试用：每5分钟执行一次
            cron_restart: '*/5 * * * *',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 3000,
            max_restarts: 3,
            min_uptime: '10s'
        }
    ]
};