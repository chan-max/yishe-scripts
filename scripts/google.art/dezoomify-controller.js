#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

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
                    resolve({ stdout, stderr, code });
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
            const result = await this.execute(['--version'], { silent: true });
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

// 如果直接运行此脚本，提供命令行接口
if (require.main === module) {
    const controller = new DezoomifyController();
    
    // 简单的命令行参数处理
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Dezoomify-rs Controller');
        console.log('用法:');
        console.log('  node dezoomify-controller.js <url> [output]');
        console.log('  node dezoomify-controller.js --bulk <source>');
        console.log('  node dezoomify-controller.js --version');
        process.exit(0);
    }

    async function main() {
        try {
            if (args[0] === '--version') {
                const version = await controller.getVersion();
                console.log(version);
            } else if (args[0] === '--bulk') {
                if (args.length < 2) {
                    console.error('错误: --bulk 需要指定源文件或URL');
                    process.exit(1);
                }
                await controller.bulkDownload(args[1]);
            } else {
                const url = args[0];
                const output = args[1];
                await controller.downloadImage(url, output);
            }
        } catch (error) {
            console.error('错误:', error.message);
            process.exit(1);
        }
    }

    main();
}

module.exports = DezoomifyController;
