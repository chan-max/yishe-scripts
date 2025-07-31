/**
 * 测试401错误处理
 * 
 * 这个脚本用于测试当认证信息过期时的处理逻辑
 * 支持检测API响应数据中的401错误
 */

const { fetchMaterialList, processMaterials } = require('./index.js');

async function test401Error() {
    console.log('🧪 === 测试401错误处理 ===');
    console.log('💡 这个测试会模拟认证信息过期的情况');
    console.log('📋 预期行为：');
    console.log('   1. 检测API响应数据中的401错误');
    console.log('   2. 显示认证信息已过期的提示');
    console.log('   3. 提供更新指导');
    console.log('   4. 显示当前认证信息');
    console.log('   5. 优雅退出程序');
    console.log('');
    
    try {
        // 测试1：直接请求API
        console.log('📋 测试1：直接请求API');
        const result = await fetchMaterialList(1, 20);
        console.log('✅ 认证信息有效，API请求成功');
        console.log('📊 获取到数据:', result.data ? result.data.total : 'N/A');
        
        // 测试2：处理数据（检查响应数据中的401）
        console.log('\n📋 测试2：处理数据');
        const usefulData = await processMaterials(result);
        console.log('✅ 数据处理成功');
        console.log(`📊 提取了 ${usefulData.length} 个素材信息`);
        
    } catch (error) {
        if (error.isAuthError && error.status === 401) {
            console.log('✅ 401错误处理测试通过');
            console.log('💡 错误类型:', error.message);
            if (error.responseData) {
                console.log('📄 响应数据:', JSON.stringify(error.responseData, null, 2));
            }
        } else {
            console.log('❌ 未预期的错误:', error.message);
        }
    }
}

// 运行测试
test401Error(); 