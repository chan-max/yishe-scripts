#!/usr/bin/env node

const {
    spawn,
    exec
} = require('child_process');

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0];

// 显示帮助信息
function showHelp() {
    console.log(`
🚀 恒优信脚本管理工具

使用方法: node manage.js <命令>

可用命令:
  start     - 启动服务
  stop      - 停止服务
  restart   - 重启服务
  status    - 查看状态
  logs      - 查看日志
  delete    - 删除服务
  test      - 启动测试模式（每5分钟执行）
  prod      - 启动生产模式（每天凌晨2点执行）

示例:
  node manage.js start    # 启动服务
  node manage.js status   # 查看状态
  node manage.js logs     # 查看日志
  node manage.js restart  # 重启服务
`);
}

// 执行PM2命令
function runPM2Command(pm2Args) {
    return new Promise((resolve) => {
        const pm2 = spawn('pm2', pm2Args, {
            stdio: 'inherit',
            shell: true
        });

        pm2.on('close', (code) => {
            resolve(code === 0);
        });
    });
}

// 启动服务
async function startService() {
    console.log('🚀 启动恒优信调度器...');
    const success = await runPM2Command(['start', 'hengyouxin-pm2-scheduler.config.js', '--only', 'hengyouxin-scheduler']);
    if (success) {
        console.log('✅ 调度器启动成功');
        await runPM2Command(['save']);
    } else {
        console.log('❌ 调度器启动失败');
    }
}

// 启动测试模式
async function startTest() {
    console.log('🧪 启动测试模式（每5分钟执行）...');
    // 直接运行一次爬取任务进行测试
    const success = await runPM2Command(['start', 'index.js', '--', 'yesterday', '--name', 'hengyouxin-test']);
    if (success) {
        console.log('✅ 测试模式启动成功');
        await runPM2Command(['save']);
    } else {
        console.log('❌ 测试模式启动失败');
    }
}

// 启动生产模式
async function startProd() {
    console.log('🏭 启动生产模式（每天凌晨2点执行）...');
    const success = await runPM2Command(['start', 'hengyouxin-pm2-scheduler.config.js', '--only', 'hengyouxin-scheduler']);
    if (success) {
        console.log('✅ 生产模式启动成功');
        await runPM2Command(['save']);
    } else {
        console.log('❌ 生产模式启动失败');
    }
}

// 停止服务
async function stopService() {
    console.log('⏹️  停止恒优信调度器...');
    const success = await runPM2Command(['stop', 'hengyouxin-scheduler']);
    if (success) {
        console.log('✅ 调度器停止成功');
    } else {
        console.log('❌ 调度器停止失败');
    }
}

// 重启服务
async function restartService() {
    console.log('🔄 重启恒优信调度器...');
    const success = await runPM2Command(['restart', 'hengyouxin-scheduler']);
    if (success) {
        console.log('✅ 调度器重启成功');
    } else {
        console.log('❌ 调度器重启失败');
    }
}

// 查看状态
async function showStatus() {
    console.log('📊 查看服务状态...');
    await runPM2Command(['status']);
}

// 查看日志
async function showLogs() {
    console.log('📄 查看服务日志...');
    const lines = args[1] || '50';
    await runPM2Command(['logs', 'hengyouxin-scheduler', '--lines', lines]);
}

// 删除服务
async function deleteService() {
    console.log('🗑️  删除恒优信调度器...');
    const success = await runPM2Command(['delete', 'hengyouxin-scheduler']);
    if (success) {
        console.log('✅ 调度器删除成功');
    } else {
        console.log('❌ 调度器删除失败');
    }
}

// 主函数
async function main() {
    if (!command || command === 'help' || command === '-h' || command === '--help') {
        showHelp();
        return;
    }

    switch (command) {
        case 'start':
            await startService();
            break;
        case 'test':
            await startTest();
            break;
        case 'prod':
            await startProd();
            break;
        case 'stop':
            await stopService();
            break;
        case 'restart':
            await restartService();
            break;
        case 'status':
            await showStatus();
            break;
        case 'logs':
            await showLogs();
            break;
        case 'delete':
            await deleteService();
            break;
        default:
            console.log(`❌ 未知命令: ${command}`);
            showHelp();
    }
}

// 运行主函数
main().catch(console.error);