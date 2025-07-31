/**
 * 单独测试 refreshAccessToken 函数
 * 查看其返回结果
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function refreshAccessToken(refreshToken) {
    try {
        console.log('🔄 正在调用刷新token接口...');
        console.log(`📡 请求地址: https://www.erp.iuufu.com/api/admin-api/system/auth/refresh-token`);
        console.log(`🔑 使用的refreshToken: ${refreshToken}`);
        
        // 使用与主脚本相同的请求头
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json',
            'Host': 'www.erp.iuufu.com',
            'Origin': 'https://www.erp.iuufu.com',
            'Pragma': 'no-cache',
            'Referer': 'https://www.erp.iuufu.com/',
            'Sec-Ch-Ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Tenant-Id': '163',  // 🔑 关键：租户标识
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0'
        };
        
        console.log('📤 请求头:', JSON.stringify(headers, null, 2));
        
        // 尝试通过查询字符串传递参数
        const url = `https://www.erp.iuufu.com/api/admin-api/system/auth/refresh-token?refreshToken=${refreshToken}`;
        
        console.log('📤 请求URL:', url);
        
        const response = await axios.post(
            url,
            {}, // 空的请求体
            { headers }
        );
        
        console.log('✅ 请求成功！');
        console.log('📄 完整响应数据：');
        console.log(JSON.stringify(response.data, null, 2));
        
        // 解析返回的数据
        const { code, data, msg } = response.data;
        
        if (code === 0 && data) {
            console.log('\n🎯 解析结果：');
            console.log(`✅ 状态码: ${code}`);
            console.log(`👤 用户ID: ${data.userId}`);
            console.log(`🔑 新的accessToken: ${data.accessToken}`);
            console.log(`🔄 新的refreshToken: ${data.refreshToken}`);
            console.log(`⏰ 过期时间: ${new Date(data.expiresTime).toLocaleString()}`);
            console.log(`📝 消息: ${msg}`);
            
            return response.data;
        } else {
            console.log('❌ 响应格式异常：');
            console.log(`状态码: ${code}`);
            console.log(`消息: ${msg}`);
            return response.data;
        }
        
    } catch (error) {
        console.error('❌ 请求失败：');
        if (error.response) {
            console.error(`HTTP状态码: ${error.response.status}`);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('网络错误，无法连接到服务器');
        } else {
            console.error('请求配置错误:', error.message);
        }
        throw error;
    }
}

async function testRefreshToken() {
    console.log('🧪 === 单独测试 refreshAccessToken 函数 ===\n');
    
    // 使用预设的refreshToken进行测试
    const testRefreshToken = '21caf4bb57e145c390e228164e71bbb4';
    
    try {
        const result = await refreshAccessToken(testRefreshToken);
        console.log('\n✅ 测试完成！');
        return result;
    } catch (error) {
        console.log('\n❌ 测试失败！');
        return null;
    }
}

// 如果直接运行此文件
if (require.main === module) {
    testRefreshToken();
}

module.exports = {
    refreshAccessToken,
    testRefreshToken
}; 