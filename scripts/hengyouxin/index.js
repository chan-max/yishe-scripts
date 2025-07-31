/**
 * 恒优信素材爬取脚本
 * 
 * 🔄 认证信息更新说明：
 * 当遇到401未授权错误时，需要更新以下两个字段：
 * 1. Authorization - Bearer token（完全更换）
 * 2. Cookie - 会话Cookie（时间戳更新）
 * 
 * 更新方法：
 * - 方法1：使用 updateAuth() 函数
 * - 方法2：直接编辑 config.json 文件
 * - 方法3：修改下面的默认配置（不推荐）
 * 
 * 当前更新日期：2025-01-31
 * 上次更新：Bearer f371a314422941149fc4e5c6ab5b1576 → Bearer 9509c0fdf01c4eb19e0285b919190f87
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 读取配置文件
function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // 合并认证信息和固定头部
            const headers = {
                ...config.headers,
                'Authorization': config.auth.authorization,
                'Cookie': config.auth.cookie
            };
            
            return {
                baseURL: 'https://www.erp.iuufu.com',
                endpoint: '/api/admin-api/asset/material-management/page',
                headers: headers
            };
        }
    } catch (error) {
        console.error('读取配置文件失败:', error.message);
    }
    
    // 如果配置文件不存在或读取失败，使用默认配置
    return {
        baseURL: 'https://www.erp.iuufu.com',
        endpoint: '/api/admin-api/asset/material-management/page',
        headers: {
            // ===== 固定标头（通常不需要修改）=====
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
            'Tenant-Id': '163',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
            
            // ===== 🔄 易变认证信息（需要定期更新）=====
            // 更新日期: 2025-01-31
            // 旧值: Bearer f371a314422941149fc4e5c6ab5b1576
            'Authorization': 'Bearer 9509c0fdf01c4eb19e0285b919190f87',  // 🔄 需要更新
            
            // 更新日期: 2025-01-31  
            // 旧值: ...Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753937977...
            'Cookie': '_ga=GA1.1.884180217.1752652946; _ga_MRBW1BE7X4=GS2.1.s1752656046$o2$g0$t1752656046$j60$l0$h0; Hm_lvt_a1ff8825baa73c3a78eb96aa40325abc=1751534604,1753927964,1753937977; HMACCOUNT=0C80E26C5FDA120B; Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753941047'  // 🔄 需要更新
        }
    };
}

// 配置信息
const CONFIG = loadConfig();

// 请求参数
const requestParams = {
    pageNo: 1,
    pageSize: 20,
    sortingFields: [
        {
          "field": "create_time",
          "order": "asc"
        },
        {
          "field": "id",
          "order": "desc"
        }
      ]
};

// 发送请求获取素材列表
async function fetchMaterialList(pageNo = 1, pageSize = 20) {
    try {
        console.log(`正在获取第 ${pageNo} 页数据...`);
        
        const response = await axios.post(
            CONFIG.baseURL + CONFIG.endpoint,
            {
                ...requestParams,
                pageNo,
                pageSize
            },
            {
                headers: CONFIG.headers,
                timeout: 30000
            }
        );

        console.log('请求成功:', response.status);
        return response.data;
    } catch (error) {
        console.error('请求失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        throw error;
    }
}



// 处理素材数据
async function processMaterials(data) {
    console.log('\n=== API 返回的完整数据 ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (!data || !data.data || !Array.isArray(data.data.list)) {
        console.log('\n没有找到素材数据或数据格式不正确');
        return;
    }

    const materials = data.data.list;
    const totalCount = data.data.total;
    
    console.log(`\n=== 数据统计 ===`);
    console.log(`当前页素材数量: ${materials.length}`);
    console.log(`总素材数量: ${totalCount}`);
    console.log(`当前页/总页数: ${Math.ceil(totalCount / 20)} 页`);
    
    console.log('\n=== 提取的有用信息 ===');
    const usefulData = materials.map((material, index) => {
        const extracted = {
            index: index + 1,
            imageFormat: material.imageFormat,  // 图片后缀
            ossObjectName: material.ossObjectName  // 图片URL地址
        };
        
        console.log(`\n素材 ${index + 1}:`);
        console.log(JSON.stringify(extracted, null, 2));
        
        return extracted;
    });
    
    console.log(`\n=== 总计提取了 ${usefulData.length} 个素材的有用信息 ===`);
    
    return usefulData;
}

// 主函数
async function main() {
    try {
        console.log('开始爬取素材...');
        
        // 获取第一页数据
        const result = await fetchMaterialList(1, 20);
        console.log('请求成功，开始处理数据...');
        
        // 调试：打印完整的响应结构
        console.log('\n=== 调试信息 ===');
        console.log('API响应结构:', JSON.stringify(result, null, 2));
        
        // 处理素材数据
        const usefulData = await processMaterials(result);
        
        console.log('\n=== 爬取完成！===');
        console.log(`成功提取了 ${usefulData.length} 个素材的有用信息`);
        
    } catch (error) {
        console.error('程序执行失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 日志文件路径
const LOG_FILE = path.join(__dirname, 'crawl_log.json');
const PROGRESS_FILE = path.join(__dirname, 'progress.json');

// 读取进度
function readProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('读取进度文件失败:', error.message);
    }
    return { currentPage: 1, totalExtracted: 0, startTime: Date.now() };
}

// 保存进度
function saveProgress(progress) {
    try {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch (error) {
        console.error('保存进度文件失败:', error.message);
    }
}

// 读取日志
function readLog() {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const data = fs.readFileSync(LOG_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('读取日志文件失败:', error.message);
    }
    return { materials: [], totalCount: 0, lastUpdate: Date.now() };
}

// 保存日志
function saveLog(logData) {
    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(logData, null, 2));
    } catch (error) {
        console.error('保存日志文件失败:', error.message);
    }
}

// 批量爬取多页（支持断点续传）
async function batchCrawl(startPage = 1, endPage = null) {
    console.log('=== 开始批量爬取（支持断点续传）===');
    
    // 读取进度
    const progress = readProgress();
    const log = readLog();
    
    console.log(`当前进度: 第 ${progress.currentPage} 页，已提取 ${progress.totalExtracted} 个素材`);
    
    // 如果没有指定结束页，则获取总页数
    if (!endPage) {
        try {
            console.log('获取总页数...');
            const result = await fetchMaterialList(1, 20);
            
            // 调试：打印完整的响应结构
            console.log('API响应结构:', JSON.stringify(result, null, 2));
            
            if (!result || !result.data) {
                console.error('API响应格式错误: result.data 为空');
                console.log('完整响应:', result);
                return;
            }
            
            const totalCount = result.data.total;
            if (totalCount === undefined || totalCount === null) {
                console.error('无法获取总素材数量，API返回的total字段为空');
                console.log('data字段内容:', result.data);
                return;
            }
            
            endPage = Math.ceil(totalCount / 20);
            console.log(`总素材数量: ${totalCount}，总页数: ${endPage}`);
        } catch (error) {
            console.error('获取总页数失败:', error.message);
            if (error.response) {
                console.error('响应状态:', error.response.status);
                console.error('响应数据:', error.response.data);
            }
            return;
        }
    }
    
    const startTime = progress.startTime;
    let currentPage = progress.currentPage;
    let totalExtracted = progress.totalExtracted;
    
    console.log(`\n开始从第 ${currentPage} 页爬取到第 ${endPage} 页...`);
    
    for (let page = currentPage; page <= endPage; page++) {
        try {
            console.log(`\n=== 正在处理第 ${page} 页 (${page}/${endPage}) ===`);
            const result = await fetchMaterialList(page, 20);
            const usefulData = await processMaterials(result);
            
            // 添加到日志
            usefulData.forEach(material => {
                log.materials.push({
                    ...material,
                    page: page,
                    crawlTime: new Date().toISOString()
                });
            });
            
            totalExtracted += usefulData.length;
            log.totalCount = totalExtracted;
            log.lastUpdate = new Date().toISOString();
            
            // 保存进度和日志
            saveProgress({
                currentPage: page + 1,
                totalExtracted: totalExtracted,
                startTime: startTime
            });
            saveLog(log);
            
            console.log(`第 ${page} 页完成，累计提取: ${totalExtracted} 个素材`);
            
            // 添加延迟避免请求过快
            if (page < endPage) {
                console.log('等待 2 秒后继续...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`第 ${page} 页处理失败:`, error.message);
            // 保存当前进度，下次可以继续
            saveProgress({
                currentPage: page,
                totalExtracted: totalExtracted,
                startTime: startTime
            });
            // 继续处理下一页
        }
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n=== 批量爬取完成！===');
    console.log(`总共提取了 ${totalExtracted} 个素材的有用信息`);
    console.log(`总耗时: ${duration} 秒`);
    console.log(`日志文件: ${LOG_FILE}`);
    console.log(`进度文件: ${PROGRESS_FILE}`);
    
    // 清理进度文件
    if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
        console.log('进度文件已清理');
    }
}

/**
 * 测试API连接
 * 
 * 🔍 功能：
 * - 测试API连接是否正常
 * - 检查认证信息是否有效
 * - 分析API响应结构
 * 
 * 💡 如果返回401错误，说明需要更新认证信息
 */
async function testConnection() {
    try {
        console.log('🔍 === 测试API连接 ===');
        console.log('📡 请求URL:', CONFIG.baseURL + CONFIG.endpoint);
        
        // 显示当前认证信息（隐藏敏感部分）
        const auth = CONFIG.headers.Authorization;
        const cookie = CONFIG.headers.Cookie;
        console.log('🔑 当前认证信息:');
        console.log(`   Authorization: ${auth.substring(0, 20)}...`);
        console.log(`   Cookie: ${cookie.substring(0, 50)}...`);
        
        const result = await fetchMaterialList(1, 20);
        console.log('\n✅ === API连接成功 ===');
        console.log('📊 响应状态: 200');
        
        if (result && result.data) {
            console.log('\n📋 === 数据结构分析 ===');
            console.log('✅ data字段存在:', !!result.data);
            console.log('📊 data.total:', result.data.total);
            console.log('✅ data.list存在:', !!result.data.list);
            console.log('📈 data.list长度:', result.data.list ? result.data.list.length : 'N/A');
            
            if (result.data.total > 0) {
                console.log('🎉 认证信息有效，可以开始爬取！');
            }
        }
        
    } catch (error) {
        console.error('❌ === API连接失败 ===');
        console.error('💥 错误信息:', error.message);
        
        if (error.response) {
            console.error('📊 响应状态:', error.response.status);
            console.error('📄 响应数据:', error.response.data);
            
            // 针对401错误的特殊提示
            if (error.response.status === 401) {
                console.log('\n🔄 === 认证信息已过期 ===');
                console.log('💡 需要更新认证信息，请：');
                console.log('   1. 在浏览器中重新登录');
                console.log('   2. 从开发者工具复制新的Authorization和Cookie');
                console.log('   3. 使用 updateAuth() 函数更新');
                console.log('   4. 重新运行此测试');
            }
        }
    }
}

/**
 * 更新认证信息
 * 
 * 🔄 使用说明：
 * 当API返回401未授权错误时，需要更新认证信息
 * 
 * 获取新认证信息的方法：
 * 1. 在浏览器中重新登录网站
 * 2. 打开开发者工具 (F12)
 * 3. 在 Network 标签页中找到API请求
 * 4. 复制 Authorization 和 Cookie 头的值
 * 
 * 示例：
 * updateAuth(
 *     'Bearer YOUR_NEW_TOKEN',
 *     'YOUR_NEW_COOKIE_STRING'
 * );
 * 
 * @param {string} authorization - 新的Authorization头值
 * @param {string} cookie - 新的Cookie头值
 */
function updateAuth(authorization, cookie) {
    try {
        const configPath = path.join(__dirname, 'config.json');
        let config = {};
        
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configData);
        }
        
        // 更新认证信息
        config.auth = {
            authorization: authorization,
            cookie: cookie
        };
        
        // 保存到配置文件
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ 认证信息已更新到 config.json');
        console.log('📝 更新内容:');
        console.log(`   Authorization: ${authorization}`);
        console.log(`   Cookie: ${cookie.substring(0, 50)}...`);
        
        // 重新加载配置
        Object.assign(CONFIG, loadConfig());
        console.log('🔄 配置已重新加载');
        console.log('💡 建议运行 npm run hengyouxin:test 测试连接');
        
    } catch (error) {
        console.error('❌ 更新认证信息失败:', error.message);
    }
}

// 查看日志
function viewLog() {
    const log = readLog();
    console.log('\n=== 爬取日志 ===');
    console.log(`总素材数量: ${log.totalCount}`);
    console.log(`最后更新时间: ${log.lastUpdate}`);
    console.log(`日志文件: ${LOG_FILE}`);
    
    if (log.materials.length > 0) {
        console.log(`\n最近 5 个素材:`);
        log.materials.slice(-5).forEach((material, index) => {
            console.log(`${index + 1}. 第${material.page}页 - ${material.imageFormat} - ${material.ossObjectName}`);
        });
    }
}

// 导出函数供其他模块使用
module.exports = {
    fetchMaterialList,
    processMaterials,
    batchCrawl,
    viewLog,
    testConnection,
    updateAuth,
    main
};

// 如果直接运行此文件
if (require.main === module) {
    main();
}
