#!/usr/bin/env node

/**
 * 完整测试：模拟实际的素材上传流程
 * 包括 COS 上传和服务器同步
 */

// 跳过 SSL 证书验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const {
    uploadLocalFileToCOS,
    sendToFeishu
} = require('../utils');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 服务器上传配置
const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/add';

// 保存到服务器
async function saveToServer({
    url,
    name,
    desc,
    source,
    suffix
}) {
    try {
        const res = await axios.post(DESIGN_SERVER_API, {
            url,
            name,
            desc,
            source,
            suffix
        });
        console.log(`[design-server返回]`, res.data);
        return res.data;
    } catch (err) {
        console.error('[保存到design-server失败]', err.message);
        throw err;
    }
}

// 下载并上传到COS
async function downloadAndUploadToCOS(imgUrl, name, description = '') {
    try {
        console.log(`[下载] ${imgUrl}`);
        const res = await axios.get(imgUrl, {
            responseType: 'arraybuffer'
        });
        const tempPath = path.join(__dirname, `${name}.jpg`);
        fs.writeFileSync(tempPath, res.data);

        console.log(`[上传COS] ${name}`);
        const cosResult = await uploadLocalFileToCOS(tempPath, `hengyouxin/${name}.jpg`);

        // 清理临时文件
        fs.unlinkSync(tempPath);

        console.log(`[COS上传成功] ${cosResult.url}`);
        return cosResult.url;
    } catch (err) {
        throw new Error('下载或上传COS失败: ' + err.message);
    }
}

async function testFullUpload() {
    console.log('🧪 开始完整测试上传流程...');

    try {
        // 模拟一个素材数据
        const mockMaterial = {
            imageFormat: 'jpg',
            ossObjectName: 'https://picsum.photos/800/600', // 使用随机图片服务
            materialName: 'test_material_' + Date.now()
        };

        console.log('📋 模拟素材数据:', mockMaterial);

        // 1. 下载并上传到COS
        console.log('\n=== 步骤1: COS 上传 ===');
        const cosUrl = await downloadAndUploadToCOS(
            mockMaterial.ossObjectName,
            mockMaterial.materialName,
            '测试素材'
        );

        // 2. 保存到服务器
        console.log('\n=== 步骤2: 服务器同步 ===');
        await saveToServer({
            url: cosUrl,
            name: mockMaterial.materialName,
            desc: '测试素材',
            source: 'hengyouxin',
            suffix: mockMaterial.imageFormat || 'jpg'
        });

        // 3. 发送飞书通知
        console.log('\n=== 步骤3: 飞书通知 ===');
        await sendToFeishu(`🧪 恒优信完整测试成功

📊 测试素材: ${mockMaterial.materialName}
☁️ COS URL: ${cosUrl}
✅ 服务器同步: 成功
📝 描述: 测试素材

测试时间: ${new Date().toLocaleString()}`);

        console.log('\n🎉 完整测试通过！');
        console.log('✅ COS 上传: 成功');
        console.log('✅ 服务器同步: 成功');
        console.log('✅ 飞书通知: 成功');

    } catch (error) {
        console.error('❌ 完整测试失败:', error.message);

        // 发送失败通知
        await sendToFeishu(`❌ 恒优信完整测试失败

❌ 错误原因: ${error.message}
⏰ 测试时间: ${new Date().toLocaleString()}`);

        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    testFullUpload();
}

module.exports = {
    testFullUpload
};