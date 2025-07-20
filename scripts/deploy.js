#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
    exec
} = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

// 部署配置文件
const DEPLOY_CONFIG_FILE = path.join(__dirname, '../deploy-config.json');

// 默认部署配置
const defaultDeployConfig = {
    server: {
        host: '',
        username: '',
        password: '',
        port: 22,
        remotePath: ''
    },
    localPath: process.cwd(),
    excludeFiles: [
        'node_modules',
        '.git',
        '.DS_Store',
        '*.log',
        'screenshots',
        'temp',
        'db_backups'
    ],
    includeFiles: [
        '*.js',
        '*.json',
        '*.md',
        '*.html',
        '*.css',
        '*.ts',
        '*.vue',
        '*.py',
        '*.yml',
        '*.yaml',
        '*.sh',
        '*.bat'
    ]
};

// 读取部署配置
function loadDeployConfig() {
    try {
        if (fs.existsSync(DEPLOY_CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(DEPLOY_CONFIG_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('读取部署配置文件失败:', error.message);
    }
    return {
        ...defaultDeployConfig
    };
}

// 保存部署配置
function saveDeployConfig(config) {
    try {
        fs.writeFileSync(DEPLOY_CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('保存部署配置文件失败:', error.message);
        return false;
    }
}

// 检查是否安装了scp命令
function checkScpAvailable() {
    return new Promise((resolve) => {
        exec('which scp', (error) => {
            resolve(!error);
        });
    });
}

// 使用scp复制文件到服务器
async function deployWithScp(config) {
    const {
        server,
        localPath,
        excludeFiles,
        includeFiles
    } = config;

    // 构建exclude参数
    const excludeParams = excludeFiles.map(file => `--exclude="${file}"`).join(' ');

    // 构建include参数
    const includeParams = includeFiles.map(file => `--include="${file}"`).join(' ');

    const scpCommand = `scp -r -P ${server.port} ${excludeParams} ${includeParams} --exclude="*" "${localPath}/" ${server.username}@${server.host}:${server.remotePath}`;

    return new Promise((resolve, reject) => {
        console.log(chalk.cyan('执行命令:'), scpCommand);

        exec(scpCommand, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`SCP复制失败: ${error.message}\n${stderr}`));
                return;
            }
            resolve(stdout);
        });
    });
}

// 使用rsync复制文件到服务器
async function deployWithRsync(config) {
    const {
        server,
        localPath,
        excludeFiles,
        includeFiles
    } = config;

    // 构建exclude参数
    const excludeParams = excludeFiles.map(file => `--exclude="${file}"`).join(' ');

    const rsyncCommand = `rsync -avz --delete -e "ssh -p ${server.port}" ${excludeParams} "${localPath}/" ${server.username}@${server.host}:${server.remotePath}`;

    return new Promise((resolve, reject) => {
        console.log(chalk.cyan('执行命令:'), rsyncCommand);

        exec(rsyncCommand, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Rsync复制失败: ${error.message}\n${stderr}`));
                return;
            }
            resolve(stdout);
        });
    });
}

// 使用Windows共享复制文件
async function deployWithWindowsShare(config) {
    const {
        server,
        localPath,
        excludeFiles,
        includeFiles
    } = config;

    // 构建robocopy命令（Windows）
    const excludeParams = excludeFiles.map(file => `/XD "${file}"`).join(' ');

    const robocopyCommand = `robocopy "${localPath}" "${server.remotePath}" /E /MIR ${excludeParams} /R:3 /W:1`;

    return new Promise((resolve, reject) => {
        console.log(chalk.cyan('执行命令:'), robocopyCommand);

        exec(robocopyCommand, (error, stdout, stderr) => {
            // robocopy返回码1-8都是成功的
            if (error && error.code > 8) {
                reject(new Error(`Robocopy复制失败: ${error.message}\n${stderr}`));
                return;
            }
            resolve(stdout);
        });
    });
}

// 显示部署菜单
async function showDeployMenu() {
    const {
        action
    } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: '请选择部署操作:',
        choices: [{
                name: '🚀 开始部署',
                value: 'deploy'
            },
            {
                name: '⚙️  配置服务器',
                value: 'config'
            },
            {
                name: '📋 查看配置',
                value: 'view'
            },
            {
                name: '🔄 测试连接',
                value: 'test'
            },
            {
                name: '⬅️  返回',
                value: 'back'
            }
        ]
    }]);

    switch (action) {
        case 'deploy':
            await startDeploy();
            break;
        case 'config':
            await showConfigMenu();
            break;
        case 'view':
            showCurrentConfig();
            break;
        case 'test':
            await testConnection();
            break;
        case 'back':
            return;
    }
}

// 开始部署
async function startDeploy() {
    const config = loadDeployConfig();

    // 检查配置是否完整
    if (!config.server.host || !config.server.username || !config.server.remotePath) {
        console.log(chalk.red('❌ 请先配置服务器信息！'));
        await showConfigMenu();
        return;
    }

    console.log(chalk.cyan('\n📋 部署配置:'));
    console.log(chalk.gray(`   服务器: ${config.server.host}:${config.server.port}`));
    console.log(chalk.gray(`   用户名: ${config.server.username}`));
    console.log(chalk.gray(`   目标路径: ${config.server.remotePath}`));
    console.log(chalk.gray(`   本地路径: ${config.localPath}`));

    const {
        confirm
    } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '确认开始部署？',
        default: true
    }]);

    if (!confirm) {
        return;
    }

    const spinner = ora('正在部署代码到服务器...').start();

    try {
        // 检查可用的部署方法
        const hasScp = await checkScpAvailable();

        let result;
        if (hasScp) {
            result = await deployWithScp(config);
        } else {
            // 尝试使用rsync
            try {
                result = await deployWithRsync(config);
            } catch (rsyncError) {
                // 如果rsync也失败，尝试Windows共享
                result = await deployWithWindowsShare(config);
            }
        }

        spinner.succeed(chalk.green('✅ 部署完成！'));
        console.log(chalk.green('部署结果:'), result);

    } catch (error) {
        spinner.fail(chalk.red('❌ 部署失败！'));
        console.error(chalk.red('错误信息:'), error.message);
    }

    const {
        continueAction
    } = await inquirer.prompt([{
        type: 'list',
        name: 'continueAction',
        message: '接下来要做什么？',
        choices: [{
                name: '🔄 重新部署',
                value: 'retry'
            },
            {
                name: '⬅️  返回菜单',
                value: 'back'
            },
            {
                name: '🚪 退出',
                value: 'exit'
            }
        ]
    }]);

    switch (continueAction) {
        case 'retry':
            await startDeploy();
            break;
        case 'back':
            await showDeployMenu();
            break;
        case 'exit':
            console.log(chalk.yellow('👋 部署完成！'));
            process.exit(0);
    }
}

// 配置菜单
async function showConfigMenu() {
    const config = loadDeployConfig();

    const {
        action
    } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: '请选择要配置的项目:',
        choices: [{
                name: '🖥️  服务器配置',
                value: 'server'
            },
            {
                name: '📁 路径配置',
                value: 'paths'
            },
            {
                name: '📄 文件过滤',
                value: 'files'
            },
            {
                name: '⬅️  返回',
                value: 'back'
            }
        ]
    }]);

    switch (action) {
        case 'server':
            await configureServer(config);
            break;
        case 'paths':
            await configurePaths(config);
            break;
        case 'files':
            await configureFiles(config);
            break;
        case 'back':
            await showDeployMenu();
            break;
    }
}

// 配置服务器信息
async function configureServer(config) {
    const answers = await inquirer.prompt([{
            type: 'input',
            name: 'host',
            message: '服务器IP地址或域名:',
            default: config.server.host,
            validate: (input) => input.trim() ? true : '请输入服务器地址'
        },
        {
            type: 'input',
            name: 'username',
            message: '用户名:',
            default: config.server.username,
            validate: (input) => input.trim() ? true : '请输入用户名'
        },
        {
            type: 'password',
            name: 'password',
            message: '密码:',
            default: config.server.password
        },
        {
            type: 'number',
            name: 'port',
            message: 'SSH端口:',
            default: config.server.port
        },
        {
            type: 'input',
            name: 'remotePath',
            message: '服务器目标路径:',
            default: config.server.remotePath,
            validate: (input) => input.trim() ? true : '请输入目标路径'
        }
    ]);

    config.server = {
        ...config.server,
        ...answers
    };

    if (saveDeployConfig(config)) {
        console.log(chalk.green('✅ 服务器配置已保存！'));
    } else {
        console.log(chalk.red('❌ 保存配置失败！'));
    }

    await showConfigMenu();
}

// 配置路径
async function configurePaths(config) {
    const answers = await inquirer.prompt([{
        type: 'input',
        name: 'localPath',
        message: '本地代码路径:',
        default: config.localPath,
        validate: (input) => {
            if (!input.trim()) return '请输入本地路径';
            if (!fs.existsSync(input)) return '路径不存在';
            return true;
        }
    }]);

    config.localPath = answers.localPath;

    if (saveDeployConfig(config)) {
        console.log(chalk.green('✅ 路径配置已保存！'));
    } else {
        console.log(chalk.red('❌ 保存配置失败！'));
    }

    await showConfigMenu();
}

// 配置文件过滤
async function configureFiles(config) {
    const {
        action
    } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: '请选择要配置的文件过滤:',
        choices: [{
                name: '🚫 排除文件',
                value: 'exclude'
            },
            {
                name: '✅ 包含文件',
                value: 'include'
            },
            {
                name: '⬅️  返回',
                value: 'back'
            }
        ]
    }]);

    if (action === 'back') {
        await showConfigMenu();
        return;
    }

    const currentFiles = action === 'exclude' ? config.excludeFiles : config.includeFiles;
    const fileType = action === 'exclude' ? '排除' : '包含';

    const answers = await inquirer.prompt([{
        type: 'input',
        name: 'files',
        message: `请输入要${fileType}的文件模式（用逗号分隔）:`,
        default: currentFiles.join(', '),
        validate: (input) => input.trim() ? true : `请输入要${fileType}的文件`
    }]);

    const files = answers.files.split(',').map(f => f.trim()).filter(f => f);

    if (action === 'exclude') {
        config.excludeFiles = files;
    } else {
        config.includeFiles = files;
    }

    if (saveDeployConfig(config)) {
        console.log(chalk.green(`✅ ${fileType}文件配置已保存！`));
    } else {
        console.log(chalk.red('❌ 保存配置失败！'));
    }

    await configureFiles(config);
}

// 显示当前配置
function showCurrentConfig() {
    const config = loadDeployConfig();

    console.log(chalk.cyan('\n📋 当前部署配置:'));
    console.log(chalk.gray('服务器配置:'));
    console.log(chalk.white(`   地址: ${config.server.host || '未配置'}`));
    console.log(chalk.white(`   端口: ${config.server.port}`));
    console.log(chalk.white(`   用户: ${config.server.username || '未配置'}`));
    console.log(chalk.white(`   目标路径: ${config.server.remotePath || '未配置'}`));

    console.log(chalk.gray('\n路径配置:'));
    console.log(chalk.white(`   本地路径: ${config.localPath}`));

    console.log(chalk.gray('\n文件过滤:'));
    console.log(chalk.white(`   排除文件: ${config.excludeFiles.join(', ')}`));
    console.log(chalk.white(`   包含文件: ${config.includeFiles.join(', ')}`));

    console.log('\n');
}

// 测试连接
async function testConnection() {
    const config = loadDeployConfig();

    if (!config.server.host || !config.server.username) {
        console.log(chalk.red('❌ 请先配置服务器信息！'));
        return;
    }

    const spinner = ora('正在测试服务器连接...').start();

    try {
        const testCommand = `ssh -p ${config.server.port} -o ConnectTimeout=10 ${config.server.username}@${config.server.host} "echo '连接成功'"`;

        await new Promise((resolve, reject) => {
            exec(testCommand, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`连接失败: ${error.message}`));
                    return;
                }
                resolve(stdout);
            });
        });

        spinner.succeed(chalk.green('✅ 服务器连接成功！'));

    } catch (error) {
        spinner.fail(chalk.red('❌ 服务器连接失败！'));
        console.error(chalk.red('错误信息:'), error.message);
    }
}

// 主函数
async function main() {
    console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║                    易舍自动化部署工具                          ║
║                    Yishe Deploy Tool                         ║
╚══════════════════════════════════════════════════════════════╝
  `));

    await showDeployMenu();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    loadDeployConfig,
    saveDeployConfig,
    deployWithScp,
    deployWithRsync,
    deployWithWindowsShare,
    showDeployMenu,
    startDeploy
};