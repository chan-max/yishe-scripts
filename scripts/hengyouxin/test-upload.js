#!/usr/bin/env node

/**
 * 测试 COS 上传和飞书通知功能
 */

const {
    uploadLocalFileToCOS,
    sendToFeishu
} = require('../utils');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log('🧪 开始测试上传功能...');

    try {
        // 创建一个测试文件
        const testContent = '这是一个测试文件，用于验证 COS 上传功能';
        const testFilePath = path.join(__dirname, 'test-upload.txt');
        fs.writeFileSync(testFilePath, testContent);

        console.log('📁 创建测试文件:', testFilePath);

        // 测试 COS 上传
        console.log('☁️ 测试 COS 上传...');
        const cosResult = await uploadLocalFileToCOS(testFilePath, 'hengyouxin/test-upload.txt');
        console.log('✅ COS 上传成功:', cosResult.url);

        // 清理测试文件
        fs.unlinkSync(testFilePath);
        console.log('🗑️ 清理测试文件');

        // 测试飞书通知
        console.log('📱 测试飞书通知...');
        await sendToFeishu('🧪 恒优信脚本测试\n\n✅ COS 上传功能正常\n✅ 飞书通知功能正常\n\n测试时间: ' + new Date().toLocaleString());
        console.log('✅ 飞书通知发送成功');

        console.log('\n🎉 所有测试通过！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    testUpload();
}

module.exports = {
    testUpload
};