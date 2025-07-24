#!/usr/bin/env node

const DezoomifyController = require('./dezoomify-controller');

async function examples() {
    const controller = new DezoomifyController();
    
    try {
        // 检查工具是否可用
        console.log('检查 dezoomify-rs 可用性...');
        const isAvailable = await controller.checkAvailability();
        if (!isAvailable) {
            console.error('dezoomify-rs 不可用');
            return;
        }
        
        // 获取版本信息
        const version = await controller.getVersion();
        console.log(`dezoomify-rs 版本: ${version}`);
        
        // 示例1: 下载 Google Arts & Culture 图像
        console.log('\n=== 示例1: 下载 Google Arts & Culture 图像 ===');
        const googleArtUrl = 'https://artsandculture.google.com/asset/light-in-the-dark/ZQFouDGMVmsI2w';
        await controller.downloadImage(googleArtUrl, 'google-art-example.jpg', {
            largest: true,
            parallelism: 8,
            headers: ['Referer: https://artsandculture.google.com/']
        });
        
        // 示例2: 使用自定义选项下载
        console.log('\n=== 示例2: 使用自定义选项下载 ===');
        await controller.downloadImage(googleArtUrl, 'custom-size.jpg', {
            maxWidth: 2000,
            maxHeight: 2000,
            compression: 10,
            tileCache: './tile-cache'
        });
        
        // 示例3: 批量下载（如果有 urls.txt 文件）
        console.log('\n=== 示例3: 批量下载 ===');
        const urlsFile = './urls.txt';
        if (require('fs').existsSync(urlsFile)) {
            await controller.bulkDownload(urlsFile, {
                largest: true,
                parallelism: 4,
                outputPrefix: 'batch-download'
            });
        } else {
            console.log('urls.txt 文件不存在，跳过批量下载示例');
        }
        
        console.log('\n所有示例执行完成！');
        
    } catch (error) {
        console.error('执行示例时出错:', error.message);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    examples();
}

module.exports = { examples };
