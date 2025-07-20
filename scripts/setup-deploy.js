#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║                    易舍部署配置向导                            ║
║                    Yishe Deploy Setup Wizard                 ║
╚══════════════════════════════════════════════════════════════╝
`));

async function setupDeploy() {
    console.log(chalk.yellow('📋 这个向导将帮助你配置自动化部署到Windows服务器'));
    console.log(chalk.gray('请确保你已经准备好Windows服务器的相关信息\n'));

    const config = await getServerConfig();
    await setupPassword(config);
    showNextSteps(config);
}

async function getServerConfig() {
    const config = await inquirer.prompt([{
            type: 'input',
            name: 'host',
            message: 'Windows服务器IP地址或域名:',
            validate: (input) => input.trim() ? true : '请输入服务器地址'
        },
        {
            type: 'input',
            name: 'user',
            message: '服务器用户名:',
            validate: (input) => input.trim() ? true : '请输入用户名'
        },
        {
            type: 'number',
            name: 'port',
            message: 'SSH端口:',
            default: 22
        },
        {
            type: 'input',
            name: 'path',
            message: '服务器上的目标路径:',
            default: 'C:\\deploy\\yishe-scripts',
            validate: (input) => input.trim() ? true : '请输入目标路径'
        }
    ]);

    return config;
}

async function setupPassword(config) {
    console.log(chalk.cyan('\n🔐 密码配置'));

    const {
        password
    } = await inquirer.prompt([{
        type: 'password',
        name: 'password',
        message: '服务器密码:',
        validate: (input) => input.trim() ? true : '请输入密码'
    }]);

    console.log(chalk.yellow('\n🔧 配置信息:'));
    console.log('请将以下信息添加到GitHub Secrets:');
    console.log(chalk.gray('WINDOWS_SERVER_HOST:'), config.host);
    console.log(chalk.gray('WINDOWS_SERVER_USER:'), config.user);
    console.log(chalk.gray('WINDOWS_SERVER_PASSWORD:'), '***' + password.slice(-4));
    console.log(chalk.gray('WINDOWS_SERVER_PATH:'), config.path);
    console.log(chalk.gray('WINDOWS_SERVER_PORT:'), config.port);
}

function showHelp() {
    console.log(chalk.cyan('\n📖 部署配置说明:'));
    console.log('1. 进入GitHub仓库 → Settings → Secrets and variables → Actions');
    console.log('2. 添加以下Secrets:');
    console.log(chalk.gray('   WINDOWS_SERVER_HOST: 服务器IP地址'));
    console.log(chalk.gray('   WINDOWS_SERVER_USER: 服务器用户名'));
    console.log(chalk.gray('   WINDOWS_SERVER_PASSWORD: 服务器密码'));
    console.log(chalk.gray('   WINDOWS_SERVER_PATH: 目标路径'));
    console.log(chalk.gray('   WINDOWS_SERVER_PORT: SSH端口（可选）'));
    console.log('3. 在Windows服务器上准备相应的环境');
    console.log('\n详细说明请参考 DEPLOY_SETUP.md 文件');
}

function showNextSteps(config) {
    console.log(chalk.green('\n✅ 配置完成！'));
    console.log(chalk.yellow('\n📋 下一步操作:'));
    console.log('1. 将上述配置信息添加到GitHub Secrets');
    console.log('2. 在Windows服务器上准备部署环境');
    console.log('3. 推送代码到GitHub触发自动部署');
    console.log('4. 在GitHub Actions页面查看部署状态');
    console.log('\n📚 更多信息请参考 DEPLOY_SETUP.md 文件');
}

// 运行配置向导
if (require.main === module) {
    setupDeploy().catch(console.error);
}

module.exports = {
    setupDeploy,
    getServerConfig,
    setupPassword
};