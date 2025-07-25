#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 用户配置部分 - 可以根据需要修改这些值
const CONFIG = {
  // 下载单个图像的配置
  singleDownload: {
    // 图像URL - 需要下载的图像地址
    imageUrl: 'https://artsandculture.google.com/asset/self-portrait-0001/zAFdL1SpZE0r-A',
    // 输出文件路径 - 下载后的图像保存位置
    outputPath: '', // 留空则自动设置为脚本目录下的output-image.jpg
    // 下载选项
    options: {
      largest: true,           // 下载最大尺寸
      maxWidth: 5000,         // 最大宽度
      maxHeight: 5000,        // 最大高度
      parallelism: 8,         // 并行下载数
      retries: 3,             // 重试次数
      // 可选参数
      // dezoomer: '',        // 指定使用的dezoomer
      // headers: [],         // 自定义HTTP头
      // tileCache: '',       // 瓦片缓存路径
      // compression: 0,      // 压缩级别
    }
  },
  
  // 批量下载的配置
  bulkDownload: {
    // 批量源文件路径 - 包含多个URL的文本文件
    bulkSource: 'urls.txt', // 相对于脚本目录的路径
    // 批量下载选项
    options: {
      largest: true,           // 下载最大尺寸
      outputPrefix: 'downloads/', // 输出目录前缀，相对于脚本目录
      parallelism: 4,         // 并行下载数
      // 可选参数
      // maxWidth: 5000,      // 最大宽度
      // maxHeight: 5000,     // 最大高度
    }
  },
  
  // 运行模式 - 选择要执行的操作
  mode: 'single', // 'single'=下载单个图像, 'bulk'=批量下载, 'version'=显示版本信息
};

class DezoomifyController {
    constructor() {
        this.scriptDir = __dirname;
        this.binaryPath = this.getBinaryPath();
    }

    /**
     * 根据操作系统获取对应的二进制文件路径
     */
    getBinaryPath() {
        const platform = os.platform();
        let binaryName;

        switch (platform) {
            case 'darwin': // macOS
                binaryName = 'dezoomify-rs-mac';
                break;
            case 'linux':
                binaryName = 'dezoomify-rs-linux';
                break;
            case 'win32':
                binaryName = 'dezoomify-rs-win.exe';
                break;
            default:
                throw new Error(`不支持的操作系统: ${platform}`);
        }

        const binaryPath = path.join(this.scriptDir, binaryName);

        // 检查文件是否存在
        if (!fs.existsSync(binaryPath)) {
            throw new Error(`二进制文件不存在: ${binaryPath}`);
        }

        // Windows 不需要设置执行权限
        if (platform !== 'win32') {
            try {
                fs.chmodSync(binaryPath, '755');
            } catch (error) {
                console.warn(`警告: 无法设置执行权限: ${error.message}`);
            }
        }

        return binaryPath;
    }

    /**
     * 执行 dezoomify-rs 命令
     * @param {string[]} args - 命令行参数
     * @param {Object} options - 选项
     * @returns {Promise<{stdout: string, stderr: string, code: number}>}
     */
    async execute(args = [], options = {}) {
        return new Promise((resolve, reject) => {
            console.log(`执行命令: ${this.binaryPath} ${args.join(' ')}`);

            const child = spawn(this.binaryPath, args, {
                stdio: options.silent ? 'pipe' : 'inherit',
                cwd: options.cwd || process.cwd(),
                ...options.spawnOptions
            });

            let stdout = '';
            let stderr = '';

            if (options.silent) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        stdout,
                        stderr,
                        code
                    });
                } else {
                    reject(new Error(`dezoomify-rs 执行失败，退出码: ${code}\n${stderr}`));
                }
            });

            child.on('error', (error) => {
                reject(new Error(`启动 dezoomify-rs 失败: ${error.message}`));
            });
        });
    }

    /**
     * 下载单个图像
     * @param {string} url - 图像URL
     * @param {string} outputPath - 输出路径
     * @param {Object} options - 选项
     */
    async downloadImage(url, outputPath, options = {}) {
        const args = [];

        // 添加各种选项
        if (options.dezoomer) args.push('--dezoomer', options.dezoomer);
        if (options.largest) args.push('--largest');
        if (options.maxWidth) args.push('--max-width', options.maxWidth.toString());
        if (options.maxHeight) args.push('--max-height', options.maxHeight.toString());
        if (options.parallelism) args.push('--parallelism', options.parallelism.toString());
        if (options.retries) args.push('--retries', options.retries.toString());
        if (options.zoomLevel !== undefined) args.push('--zoom-level', options.zoomLevel.toString());
        if (options.headers) {
            options.headers.forEach(header => {
                args.push('--header', header);
            });
        }
        if (options.tileCache) args.push('--tile-cache', options.tileCache);
        if (options.compression) args.push('--compression', options.compression.toString());

        // 添加URL和输出路径
        args.push(url);
        if (outputPath) args.push(outputPath);

        return this.execute(args, options);
    }

    /**
     * 批量下载
     * @param {string} bulkSource - 批量源（文件路径或URL）
     * @param {Object} options - 选项
     */
    async bulkDownload(bulkSource, options = {}) {
        const args = ['--bulk', bulkSource];

        // 添加选项
        if (options.largest) args.push('--largest');
        if (options.maxWidth) args.push('--max-width', options.maxWidth.toString());
        if (options.maxHeight) args.push('--max-height', options.maxHeight.toString());
        if (options.parallelism) args.push('--parallelism', options.parallelism.toString());
        if (options.outputPrefix) args.push(options.outputPrefix);

        return this.execute(args, options);
    }

    /**
     * 获取版本信息
     */
    async getVersion() {
        try {
            const result = await this.execute(['--version'], {
                silent: true
            });
            return result.stdout.trim();
        } catch (error) {
            throw new Error(`获取版本信息失败: ${error.message}`);
        }
    }

    /**
     * 检查工具是否可用
     */
    async checkAvailability() {
        try {
            await this.getVersion();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 解析 dezoomify-rs 的 --info 输出，提取 zoom levels
     * @param {string} stdout - dezoomify-rs 的 stdout
     * @returns {Array<{width: number, height: number}>} 解析出的 zoom levels 数组
     */
    parseZoomLevels(stdout) {
        const levels = [];
        const lines = stdout.split('\n');
        for (const line of lines) {
            if (line.includes('Zoom level')) {
                const match = line.match(/Zoom level (\d+): (\d+)x(\d+)/);
                if (match) {
                    levels.push({
                        level: parseInt(match[1]),
                        width: parseInt(match[2]),
                        height: parseInt(match[3])
                    });
                }
            }
        }
        return levels;
    }

    /**
     * 获取 zoom level 列表（通过解析 dezoomify-rs 的交互输出）
     * @param {string} imageUrl
     * @returns {Promise<Array<{level: number, title: string, width: number, height: number, tiles: number}>>}
     */
    async getZoomLevelsByParsing(imageUrl) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const child = spawn(this.binaryPath, [imageUrl], { stdio: ['ignore', 'pipe', 'pipe'] });
            let output = '';
            let error = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('Which level do you want to download?')) {
                    child.kill();
                }
            });
            child.stderr.on('data', (data) => {
                error += data.toString();
            });
            child.on('close', () => {
                // 解析 zoom level 列表
                const levels = [];
                const regex = /\s*(\d+)\. (.*?)\(\s*(\d+) x\s*(\d+) pixels,\s*(\d+) tiles\)/g;
                let match;
                while ((match = regex.exec(output)) !== null) {
                    levels.push({
                        level: parseInt(match[1]),
                        title: match[2].trim(),
                        width: parseInt(match[3]),
                        height: parseInt(match[4]),
                        tiles: parseInt(match[5])
                    });
                }
                resolve(levels);
            });
            child.on('error', (err) => {
                reject(err);
            });
        });
    }
}

// 如果直接运行此脚本，使用预设参数而不是命令行参数
if (require.main === module) {
    // 引入chalk用于美化命令行输出
    let chalk;
    try {
        chalk = require('chalk');
    } catch (e) {
        console.warn('\x1b[33m提示：建议安装 chalk 包以获得更美观的命令行输出。\x1b[0m');
        chalk = {
            cyan: (s) => `\x1b[36m${s}\x1b[0m`,
            green: (s) => `\x1b[32m${s}\x1b[0m`,
            yellow: (s) => `\x1b[33m${s}\x1b[0m`,
            red: (s) => `\x1b[31m${s}\x1b[0m`,
            bold: (s) => `\x1b[1m${s}\x1b[0m`,
            magenta: (s) => `\x1b[35m${s}\x1b[0m`,
        };
    }
    const controller = new DezoomifyController();
    
    // 处理配置
    const processConfig = () => {
        // 设置输出路径（如果未指定）
        if (!CONFIG.singleDownload.outputPath) {
            // 生成带时间戳的文件名
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            CONFIG.singleDownload.outputPath = path.join(__dirname, `output-image_${ts}.jpg`);
        } else if (!path.isAbsolute(CONFIG.singleDownload.outputPath)) {
            CONFIG.singleDownload.outputPath = path.join(__dirname, CONFIG.singleDownload.outputPath);
        }
        
        // 处理批量下载路径
        if (!path.isAbsolute(CONFIG.bulkDownload.bulkSource)) {
            CONFIG.bulkDownload.bulkSource = path.join(__dirname, CONFIG.bulkDownload.bulkSource);
        }
        
        // 处理批量下载输出前缀
        if (CONFIG.bulkDownload.options.outputPrefix && 
            !path.isAbsolute(CONFIG.bulkDownload.options.outputPrefix)) {
            CONFIG.bulkDownload.options.outputPrefix = 
                path.join(__dirname, CONFIG.bulkDownload.options.outputPrefix);
        }
    };
    
    // 执行配置处理
    processConfig();

    async function main() {
        try {
            // 根据配置的模式执行相应操作
            switch (CONFIG.mode) {
                case 'single': {
                    // 新增：命令行交互，提示用户输入图片地址
                    const readline = require('readline');
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    const question = (q) => new Promise(res => rl.question(q, res));
                    console.log(chalk.cyan('=============================='));
                    console.log(chalk.bold(chalk.magenta('Google Art 图片下载工具')));
                    console.log(chalk.green('请输入要下载的 Google Art 图片地址（直接回车使用默认地址）：'));
                    console.log(chalk.yellow(`默认地址: ${CONFIG.singleDownload.imageUrl}`));
                    console.log(chalk.cyan('=============================='));
                    let inputUrl = '';
                    while (true) {
                        inputUrl = (await question('图片地址: ')).trim();
                        if (!inputUrl) {
                            // 直接回车，使用默认
                            break;
                        }
                        if (!/^https:\/\/artsandculture\.google\.com\//.test(inputUrl)) {
                            console.error(chalk.red('错误：请输入有效的 Google Art 图片地址！'));
                            console.error(chalk.yellow('示例：https://artsandculture.google.com/asset/xxxx'));
                        } else {
                            break;
                        }
                    }
                    if (inputUrl) {
                        CONFIG.singleDownload.imageUrl = inputUrl;
                    }
                    // 新增：获取并显示所有可用的 zoom levels（解析 dezoomify-rs 输出）
                    console.log(chalk.cyan('=============================='));
                    console.log(chalk.bold(chalk.magenta('正在分析图片的可用分辨率...')));
                    console.log(chalk.cyan('=============================='));
                    let zoomLevels = [];
                    try {
                        zoomLevels = await controller.getZoomLevelsByParsing(inputUrl || CONFIG.singleDownload.imageUrl);
                    } catch (e) {
                        zoomLevels = [];
                    }
                    if (zoomLevels && zoomLevels.length > 0) {
                        console.log(chalk.cyan('=============================='));
                        console.log(chalk.bold(chalk.magenta('可用的分辨率选项：')));
                        zoomLevels.forEach((level, index) => {
                            const sizeText = `${level.width}x${level.height}`;
                            const isLargest = index === zoomLevels.length - 1;
                            const displayText = isLargest ? 
                                chalk.green(`${index}. ${sizeText} (最大分辨率) ${level.title}`) : 
                                chalk.green(`${index}. ${sizeText} ${level.title}`);
                            console.log(displayText);
                        });
                        console.log(chalk.cyan('=============================='));
                        let zoomChoice = '';
                        while (true) {
                            zoomChoice = (await question(`请选择分辨率 (0-${zoomLevels.length - 1}): `)).trim();
                            if (/^\d+$/.test(zoomChoice) && parseInt(zoomChoice) >= 0 && parseInt(zoomChoice) < zoomLevels.length) {
                                break;
                            }
                            console.error(chalk.red(`错误：请输入 0 到 ${zoomLevels.length - 1} 之间的数字`));
                        }
                        const selectedLevel = parseInt(zoomChoice);
                        CONFIG.singleDownload.options.zoomLevel = selectedLevel;
                        delete CONFIG.singleDownload.options.largest;
                        delete CONFIG.singleDownload.options.maxWidth;
                        delete CONFIG.singleDownload.options.maxHeight;
                        const selectedZoom = zoomLevels[selectedLevel];
                        console.log(chalk.green(`已选择分辨率：${selectedZoom.width}x${selectedZoom.height} ${selectedZoom.title}`));
                    } else {
                        // 回退到原来的分辨率选择逻辑
                        console.log(chalk.yellow('无法获取详细的分辨率信息，使用默认选择方式'));
                        console.log(chalk.cyan('=============================='));
                        console.log(chalk.bold(chalk.magenta('选择下载分辨率：')));
                        console.log(chalk.green('1. 最大分辨率（推荐）'));
                        console.log(chalk.green('2. 自定义分辨率'));
                        console.log(chalk.green('3. 使用默认设置'));
                        console.log(chalk.cyan('=============================='));
                        let resolutionChoice = '';
                        while (true) {
                            resolutionChoice = (await question('请选择 (1/2/3): ')).trim();
                            if (['1', '2', '3'].includes(resolutionChoice)) {
                                break;
                            }
                            console.error(chalk.red('错误：请输入 1、2 或 3'));
                        }
                        if (resolutionChoice === '2') {
                            // 自定义分辨率
                            let maxWidth = '';
                            let maxHeight = '';
                            while (true) {
                                maxWidth = (await question('请输入最大宽度 (像素，直接回车使用默认5000): ')).trim();
                                if (!maxWidth) {
                                    maxWidth = '5000';
                                    break;
                                }
                                if (/^\d+$/.test(maxWidth) && parseInt(maxWidth) > 0) {
                                    break;
                                }
                                console.error(chalk.red('错误：请输入有效的数字'));
                            }
                            while (true) {
                                maxHeight = (await question('请输入最大高度 (像素，直接回车使用默认5000): ')).trim();
                                if (!maxHeight) {
                                    maxHeight = '5000';
                                    break;
                                }
                                if (/^\d+$/.test(maxHeight) && parseInt(maxHeight) > 0) {
                                    break;
                                }
                                console.error(chalk.red('错误：请输入有效的数字'));
                            }
                            CONFIG.singleDownload.options.maxWidth = parseInt(maxWidth);
                            CONFIG.singleDownload.options.maxHeight = parseInt(maxHeight);
                            console.log(chalk.green(`已设置自定义分辨率：${maxWidth}x${maxHeight}`));
                        } else if (resolutionChoice === '1') {
                            // 最大分辨率
                            CONFIG.singleDownload.options.largest = true;
                            delete CONFIG.singleDownload.options.maxWidth;
                            delete CONFIG.singleDownload.options.maxHeight;
                            console.log(chalk.green('已选择最大分辨率'));
                        } else {
                            // 使用默认设置
                            console.log(chalk.green('使用默认设置'));
                        }
                    }
                    rl.close();
                    // 下载单个图像前，自动覆盖已存在的输出文件
                    if (fs.existsSync(CONFIG.singleDownload.outputPath)) {
                        try {
                            fs.unlinkSync(CONFIG.singleDownload.outputPath);
                            console.log(chalk.yellow('提示：已自动删除已存在的输出文件，准备覆盖。'));
                        } catch (e) {
                            console.error(chalk.red('错误：无法删除已存在的输出文件！'), e.message);
                            process.exit(1);
                        }
                    }
                    // 下载单个图像
                    console.log(chalk.cyan('------------------------------'));
                    console.log(chalk.green(`开始下载图像: ${CONFIG.singleDownload.imageUrl}`));
                    console.log(chalk.green(`输出路径: ${CONFIG.singleDownload.outputPath}`));
                    await controller.downloadImage(
                        CONFIG.singleDownload.imageUrl, 
                        CONFIG.singleDownload.outputPath, 
                        CONFIG.singleDownload.options
                    );
                    console.log(chalk.bold(chalk.green(`图像已下载到: ${CONFIG.singleDownload.outputPath}`)));
                    break;
                }
                case 'bulk':
                    // 批量下载
                    console.log(chalk.cyan('------------------------------'));
                    console.log(chalk.green(`开始批量下载，源文件: ${CONFIG.bulkDownload.bulkSource}`));
                    console.log(chalk.green(`输出目录: ${CONFIG.bulkDownload.options.outputPrefix || '当前目录'}`));
                    await controller.bulkDownload(
                        CONFIG.bulkDownload.bulkSource, 
                        CONFIG.bulkDownload.options
                    );
                    console.log(chalk.bold(chalk.green('批量下载完成')));
                    break;
                case 'version':
                    // 获取版本信息
                    const version = await controller.getVersion();
                    console.log(chalk.cyan('------------------------------'));
                    console.log(chalk.green(`Dezoomify-rs 版本: ${version}`));
                    break;
                default:
                    console.error(chalk.red(`错误: 未知的运行模式 '${CONFIG.mode}'`));
                    console.log(chalk.yellow(`支持的模式: 'single', 'bulk', 'version'`));
                    process.exit(1);
            }
        } catch (error) {
            console.error(chalk.red('错误:'), error.message);
            process.exit(1);
        }
    }

    main();
}

module.exports = DezoomifyController;