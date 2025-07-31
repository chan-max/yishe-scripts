#!/usr/bin/env node

const {
    spawn,
    exec
} = require('child_process');
const fs = require('fs');
const path = require('path');

// 检查PM2是否安装
function checkPM2() {
    return new Promise((resolve) => {
        exec('pm2 --version', (error) => {
            if (error) {
                console.log('📦 PM2 未安装，正在安装...');
                exec('npm install -g pm2', (installError) => {
                    if (installError) {
                        console.log('❌ PM2 安装失败，请手动安装: npm install -g pm2');
                        resolve(false);
                    } else {
                        console.log('✅ PM2 安装成功');
                        resolve(true);
                    }
                });
            } else {
                console.log('✅ PM2 已安装');
                resolve(true);
            }
        });
    });
}

// 创建必要目录
function createDirectories() {
    const dirs = ['logs', 'yesterday_logs'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true
            });
            console.log(`📁 创建目录: ${dir}`);
        }
    });
}

// 检查配置文件
function checkConfig() {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
        console.log('📝 创建配置文件...');
        const defaultConfig = {
            "auth": {
                "authorization": "your-authorization-token-here"
            },
            "api": {
                "baseUrl": "https://your-api-server.com"
            }
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('⚠️  请编辑 config.json 文件，填入正确的认证信息');
        console.log('然后重新运行此脚本');
        return false;
    }
    return true;
}

// 启动PM2服务
function startPM2() {
    return new Promise((resolve) => {
        console.log('🚀 启动 PM2 服务...');

        // 读取PM2配置文件
        const configPath = path.join(__dirname, 'hengyouxin-pm2-scheduler.config.js');
        if (!fs.existsSync(configPath)) {
            console.log('❌ PM2 配置文件不存在');
            resolve(false);
            return;
        }

        // 启动PM2
        const pm2 = spawn('pm2', ['start', configPath, '--only', 'hengyouxin-yesterday'], {
            stdio: 'inherit',
            shell: true
        });

        pm2.on('close', (code) => {
            if (code === 0) {
                console.log('✅ PM2 服务启动成功');

                // 保存PM2配置
                exec('pm2 save', (error) => {
                    if (error) {
                        console.log('⚠️  PM2 配置保存失败');
                    } else {
                        console.log('🔧 PM2 配置已保存');
                    }
                    resolve(true);
                });
            } else {
                console.log('❌ PM2 服务启动失败');
                resolve(false);
            }
        });
    });
}

// 显示状态
function showStatus() {
    console.log('\n📋 常用命令:');
    console.log('  查看状态: pm2 status');
    console.log('  查看日志: pm2 logs hengyouxin-yesterday');
    console.log('  重启服务: pm2 restart hengyouxin-yesterday');
    console.log('  停止服务: pm2 stop hengyouxin-yesterday');
    console.log('');
    console.log('📅 脚本将在每天凌晨2点自动执行');
    console.log('📱 执行结果会通过飞书通知');
    console.log('');

    // 显示当前状态
    exec('pm2 status', (error, stdout) => {
        if (!error) {
            console.log('🔍 当前状态:');
            console.log(stdout);
        }
    });
}

// 主函数
async function main() {
    console.log('🚀 开始部署恒优信脚本...\n');

    // 检查配置文件
    if (!checkConfig()) {
        return;
    }

    // 创建目录
    createDirectories();

    // 检查PM2
    const pm2Installed = await checkPM2();
    if (!pm2Installed) {
        return;
    }

    // 启动PM2服务
    const started = await startPM2();
    if (started) {
        console.log('\n✅ 部署完成！');
        showStatus();
    }
}

// 运行主函数
main().catch(console.error);