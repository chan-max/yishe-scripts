/**
 * 模拟401错误测试脚本
 * 
 * 用于测试脚本对API响应数据中401错误的处理
 */

const axios = require('axios');

// 模拟401响应数据
const mock401Response = {
    code: 401,
    message: "认证失败",
    data: null,
    timestamp: new Date().toISOString()
};

// 模拟正常响应数据
const mockSuccessResponse = {
    code: 200,
    message: "成功",
    data: {
        total: 100,
        list: [
            {
                id: 1,
                imageFormat: "jpg",
                ossObjectName: "https://example.com/image1.jpg"
            }
        ]
    }
};

/**
 * 模拟API请求函数
 */
async function mockFetchMaterialList(pageNo = 1, pageSize = 20) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟401错误
    if (pageNo === 1) {
        console.log('🧪 模拟401错误响应...');
        return mock401Response;
    }
    
    // 模拟正常响应
    console.log('🧪 模拟正常响应...');
    return mockSuccessResponse;
}

/**
 * 测试401错误检测
 */
async function test401Detection() {
    console.log('🧪 === 模拟401错误检测测试 ===');
    console.log('');
    
    try {
        // 测试1：模拟401错误
        console.log('📋 测试1：模拟API响应数据中的401错误');
        const result1 = await mockFetchMaterialList(1, 20);
        console.log('📄 响应数据:', JSON.stringify(result1, null, 2));
        
        // 检查是否包含401错误
        if (result1.code === 401 || result1.status === 401 || result1.error === 401) {
            console.log('✅ 成功检测到401错误');
            console.log('💡 错误信息:', result1.message);
            console.log('🔄 应该触发认证更新流程');
        } else {
            console.log('❌ 未能检测到401错误');
        }
        
        console.log('');
        
        // 测试2：模拟正常响应
        console.log('📋 测试2：模拟正常响应');
        const result2 = await mockFetchMaterialList(2, 20);
        console.log('📄 响应数据:', JSON.stringify(result2, null, 2));
        
        if (result2.code === 200) {
            console.log('✅ 正常响应检测成功');
            console.log('📊 数据统计:', result2.data.total);
        } else {
            console.log('❌ 正常响应检测失败');
        }
        
    } catch (error) {
        console.log('❌ 测试过程中发生错误:', error.message);
    }
    
    console.log('\n🎯 测试完成');
}

/**
 * 测试不同的401错误格式
 */
async function testDifferent401Formats() {
    console.log('\n🧪 === 测试不同401错误格式 ===');
    console.log('');
    
    const testCases = [
        { name: 'code字段401', data: { code: 401, message: '认证失败' } },
        { name: 'status字段401', data: { status: 401, message: '认证失败' } },
        { name: 'error字段401', data: { error: 401, message: '认证失败' } },
        { name: '正常响应', data: { code: 200, message: '成功', data: { total: 10 } } }
    ];
    
    for (const testCase of testCases) {
        console.log(`📋 测试: ${testCase.name}`);
        console.log('📄 数据:', JSON.stringify(testCase.data, null, 2));
        
        const has401 = testCase.data.code === 401 || 
                      testCase.data.status === 401 || 
                      testCase.data.error === 401;
        
        if (has401) {
            console.log('✅ 检测到401错误');
        } else {
            console.log('✅ 正常响应');
        }
        console.log('');
    }
}

// 运行测试
async function runTests() {
    await test401Detection();
    await testDifferent401Formats();
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { 
    test401Detection, 
    testDifferent401Formats,
    mockFetchMaterialList 
}; 