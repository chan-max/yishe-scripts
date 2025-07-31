#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 模拟进度文件
const PROGRESS_FILE = path.join(__dirname, 'progress.json');
const LOG_FILE = path.join(__dirname, 'crawl_log.json');

// 创建测试进度（素材级别）
function createTestProgress() {
    const progress = {
        currentPage: 5,
        currentIndex: 3, // 从第5页第4个素材开始
        totalExtracted: 80,
        uploadedMaterials: [
            'material_001',
            'material_002',
            'material_003',
            'http://iuufu-erp-material.oss-cn-beijing.aliyuncs.com/dev/material/1746527196227/SY6.jpg'
        ],
        startTime: Date.now() - 3600000 // 1小时前
    };

    const log = {
        materials: [],
        totalCount: 80,
        lastUpdate: new Date().toISOString()
    };

    // 保存测试数据
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

    console.log('✅ 测试进度文件已创建（素材级别断点续传）');
    console.log(`📄 进度文件: ${PROGRESS_FILE}`);
    console.log(`📄 日志文件: ${LOG_FILE}`);
    console.log(`📊 当前进度: 第 ${progress.currentPage} 页第 ${progress.currentIndex + 1} 个素材`);
    console.log(`📊 已提取: ${progress.totalExtracted} 个素材`);
    console.log(`📊 已上传素材数量: ${progress.uploadedMaterials.length} 个`);
    console.log(`📋 已上传素材列表:`, progress.uploadedMaterials);
}

// 清理测试文件
function cleanupTestFiles() {
    if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
        console.log('🗑️  进度文件已删除');
    }

    if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
        console.log('🗑️  日志文件已删除');
    }
}

// 检查文件是否存在
function checkFiles() {
    console.log('📋 检查文件状态:');
    console.log(`进度文件: ${fs.existsSync(PROGRESS_FILE) ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`日志文件: ${fs.existsSync(LOG_FILE) ? '✅ 存在' : '❌ 不存在'}`);

    if (fs.existsSync(PROGRESS_FILE)) {
        const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log(`📊 进度内容:`);
        console.log(`   - 当前页: ${progress.currentPage}`);
        console.log(`   - 当前索引: ${progress.currentIndex}`);
        console.log(`   - 已提取: ${progress.totalExtracted} 个素材`);
        console.log(`   - 已上传素材: ${progress.uploadedMaterials ? progress.uploadedMaterials.length : 0} 个`);
        if (progress.uploadedMaterials && progress.uploadedMaterials.length > 0) {
            console.log(`   - 已上传素材列表:`, progress.uploadedMaterials.slice(0, 3));
            if (progress.uploadedMaterials.length > 3) {
                console.log(`   - ... 还有 ${progress.uploadedMaterials.length - 3} 个`);
            }
        }
    }
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'create':
            createTestProgress();
            break;
        case 'cleanup':
            cleanupTestFiles();
            break;
        case 'check':
            checkFiles();
            break;
        default:
            console.log('使用方法:');
            console.log('  node test-resume.js create   # 创建测试进度文件（素材级别）');
            console.log('  node test-resume.js cleanup  # 清理测试文件');
            console.log('  node test-resume.js check    # 检查文件状态');
            break;
    }
}

main();