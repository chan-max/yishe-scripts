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
            default:
                throw new Error(`不支持的操作系统: ${platform}`);
        }

        const binaryPath = path.join(this.scriptDir, binaryName);

        // 检查文件是否存在
        if (!fs.existsSync(binaryPath)) {
            throw new Error(`二进制文件不存在: ${binaryPath}`);
        }

        // 确保文件有执行权限
        try {
            fs.chmodSync(binaryPath, '755');
        } catch (error) {
            console.warn(`警告: 无法设置执行权限: ${error.message}`);
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
}

// 如果直接运行此脚本，使用预设参数而不是命令行参数
if (require.main === module) {
    const controller = new DezoomifyController();
    
    // 处理配置
    const processConfig = () => {
        // 设置输出路径（如果未指定）
        if (!CONFIG.singleDownload.outputPath) {
            CONFIG.singleDownload.outputPath = path.join(__dirname, 'output-image.jpg');
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
                case 'single':
                    // 下载单个图像
                    console.log(`开始下载图像: ${CONFIG.singleDownload.imageUrl}`);
                    console.log(`输出路径: ${CONFIG.singleDownload.outputPath}`);
                    await controller.downloadImage(
                        CONFIG.singleDownload.imageUrl, 
                        CONFIG.singleDownload.outputPath, 
                        CONFIG.singleDownload.options
                    );
                    console.log(`图像已下载到: ${CONFIG.singleDownload.outputPath}`);
                    break;
                    
                case 'bulk':
                    // 批量下载
                    console.log(`开始批量下载，源文件: ${CONFIG.bulkDownload.bulkSource}`);
                    console.log(`输出目录: ${CONFIG.bulkDownload.options.outputPrefix || '当前目录'}`);
                    await controller.bulkDownload(
                        CONFIG.bulkDownload.bulkSource, 
                        CONFIG.bulkDownload.options
                    );
                    console.log(`批量下载完成`);
                    break;
                    
                case 'version':
                    // 获取版本信息
                    const version = await controller.getVersion();
                    console.log(`Dezoomify-rs 版本: ${version}`);
                    break;
                    
                default:
                    console.error(`错误: 未知的运行模式 '${CONFIG.mode}'`);
                    console.log(`支持的模式: 'single', 'bulk', 'version'`);
                    process.exit(1);
            }
        } catch (error) {
            console.error('错误:', error.message);
            process.exit(1);
        }
    }

    main();
}

module.exports = DezoomifyController;