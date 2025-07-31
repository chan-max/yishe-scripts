/**
 * 测试自动刷新token功能
 * 
 * 这个脚本用于测试当遇到401错误时，脚本是否能自动使用refreshToken刷新访问令牌
 */

const { fetchMaterialList, refreshAccessToken, saveTokensToConfig } = require('./index.js');

async function testTokenRefresh() {
    console.log('🧪 === 测试自动刷新token功能 ===\n');
    
    try {
        console.log('📋 测试步骤：');
        console.log('1. 尝试获取素材列表（可能会遇到401错误）');
        console.log('2. 如果遇到401错误，脚本会自动尝试刷新token');
        console.log('3. 刷新成功后重新尝试请求');
        console.log('4. 如果刷新失败，会提示手动更新认证信息\n');
        
        // 尝试获取素材列表
        console.log('🔄 正在测试获取素材列表...');
        const result = await fetchMaterialList(1, 1);
        
        console.log('✅ 请求成功！');
        console.log('📄 返回数据：');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        if (error.isAuthError && error.status === 401) {
            console.log('❌ 认证错误，需要手动更新认证信息');
            console.log('💡 请使用以下命令更新认证信息：');
            console.log('   npm run hengyouxin:update');
        } else {
            console.error('❌ 其他错误:', error.message);
        }
    }
}

async function testRefreshTokenDirectly() {
    console.log('\n🧪 === 直接测试刷新token功能 ===\n');
    
    try {
        // 这里需要提供一个有效的refreshToken进行测试
        const testRefreshToken = '21caf4bb57e145c390e228164e71bbb4';
        
        console.log('🔄 正在直接测试刷新token...');
        const result = await refreshAccessToken(testRefreshToken);
        
        console.log('✅ 刷新token成功！');
        console.log('📄 返回数据：');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ 刷新token失败:', error.message);
        console.log('💡 这可能是因为refreshToken已过期，需要重新登录获取新的token');
    }
}

// 如果直接运行此文件
if (require.main === module) {
    console.log('🚀 开始测试自动刷新token功能...\n');
    
    // 先测试完整的自动刷新流程
    await testTokenRefresh();
    
    // 再测试直接刷新token
    await testRefreshTokenDirectly();
    
    console.log('\n✅ 测试完成！');
}

module.exports = {
    testTokenRefresh,
    testRefreshTokenDirectly
}; 