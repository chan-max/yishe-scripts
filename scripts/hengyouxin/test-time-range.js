/**
 * 时间范围爬取功能测试脚本
 * 
 * 用于测试新增的时间范围爬取功能
 */

const { crawlYesterday, crawlByTimeRange } = require('./index.js');

async function testTimeRangeFeatures() {
    console.log('🧪 === 测试时间范围爬取功能 ===');
    console.log('');
    
    try {
        // 测试1：前一天爬取功能
        console.log('📋 测试1：前一天爬取功能');
        console.log('💡 这将爬取前一天的所有素材');
        console.log('⚠️  注意：这需要有效的认证信息');
        console.log('');
        
        // 计算前一天的开始和结束时间
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const startTime = new Date(yesterday);
        startTime.setHours(0, 0, 0, 0);
        
        const endTime = new Date(yesterday);
        endTime.setHours(23, 59, 59, 999);
        
        const startTimeMs = startTime.getTime();
        const endTimeMs = endTime.getTime();
        
        console.log(`📅 前一天日期: ${yesterday.toLocaleDateString()}`);
        console.log(`📅 时间范围: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`);
        console.log(`📅 时间戳: ${startTimeMs} - ${endTimeMs}`);
        console.log('');
        
        // 测试2：自定义时间范围爬取
        console.log('📋 测试2：自定义时间范围爬取');
        console.log('💡 示例：爬取2024年1月1日的素材');
        
        const testStartTime = 1704067200000; // 2024-01-01 00:00:00
        const testEndTime = 1704153599999;   // 2024-01-01 23:59:59
        
        console.log(`📅 测试时间范围: ${new Date(testStartTime).toLocaleString()} - ${new Date(testEndTime).toLocaleString()}`);
        console.log(`📅 测试时间戳: ${testStartTime} - ${testEndTime}`);
        console.log('');
        
        console.log('🎯 测试完成');
        console.log('💡 要运行实际测试，请使用以下命令：');
        console.log('   npm run hengyouxin:yesterday');
        console.log('   npm run hengyouxin:timerange 1704067200000 1704153599999 "2024年1月1日"');
        
    } catch (error) {
        console.log('❌ 测试过程中发生错误:', error.message);
    }
}

// 运行测试
if (require.main === module) {
    testTimeRangeFeatures().catch(console.error);
}

module.exports = { testTimeRangeFeatures }; 