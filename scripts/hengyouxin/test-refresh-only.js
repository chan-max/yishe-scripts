/**
 * 单独测试 refreshAccessToken 函数
 * 查看其返回结果
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function refreshAccessToken(refreshToken) {
    try {
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
        
        // 尝试通过查询字符串传递参数
        const url = `https://www.erp.iuufu.com/api/admin-api/system/auth/refresh-token?refreshToken=${refreshToken}`;
        
        const response = await axios.post(
            url,
            {}, // 空的请求体
            { headers }
        );
        
        // 解析返回的数据
        const { code, data, msg } = response.data;
        
        if (code === 0 && data) {
            return response.data;
        } else {
            return response.data;
        }
        
    } catch (error) {
        throw error;
    }
}

async function testRefreshToken() {
    console.log('🧪 === 单独测试 refreshAccessToken 函数 ===\n');
    
    // 使用预设的refreshToken进行测试
    const testRefreshToken = '21caf4bb57e145c390e228164e71bbb4';
    
    try {
        const result = await refreshAccessToken(testRefreshToken);
        console.log('✅ 测试成功！');
        return result;
    } catch (error) {
        console.log('❌ 测试失败！');
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