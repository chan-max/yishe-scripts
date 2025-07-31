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
 * 当前状态：认证信息已过期，需要更新
 * 
 * 🚨 401错误处理机制：
 * - 支持检测API响应数据中的401错误（code/status/error字段）
 * - 同时支持HTTP状态码401错误检测（备用机制）
 * - 当遇到401未授权错误时，脚本会自动退出
 * - 提供详细的更新指导和当前认证信息
 * - 使用 process.exit(1) 优雅退出
 * - 脚本会在开始前自动检查认证信息
 * - 批量爬取时会保存进度，下次可继续
 * - 提供详细的错误提示和更新指导
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
                'Authorization': config.auth?.authorization || null,
                'Cookie': config.auth?.cookie || null
            };
            
            return {
                baseURL: 'https://www.erp.iuufu.com',
                endpoint: '/api/admin-api/asset/material-management/page',
                headers: headers,
                refreshToken: config.auth?.refreshToken || null
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
            // 当前值: Bearer 9246e01d22f2418aa1fe25d264c1f80f (已过期)
            'Authorization': 'Bearer 492cfde11140468fadb5d6f67d50439e',  // 🔄 需要更新
            
            // 更新日期: 2025-01-31  
            // 旧值: ...Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753937977...

            // 'Cookie': '_ga=GA1.1.884180217.1752652946; _ga_MRBW1BE7X4=GS2.1.s1752656046$o2$g0$t1752656046$j60$l0$h0; Hm_lvt_a1ff8825baa73c3a78eb96aa40325abc=1751534604,1753927964,1753937977; HMACCOUNT=0C80E26C5FDA120B; Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753943040'  // 🔄 需要更新
        },
        refreshToken: '21caf4bb57e145c390e228164e71bbb4'  // 🔄 初始refreshToken
    };
}

// 配置信息
const CONFIG = loadConfig();

/**
 * 刷新访问令牌
 * @param {string} refreshToken 刷新令牌
 * @returns {Promise<Object>} 新的token信息
 */
async function refreshAccessToken(refreshToken) {
    try {
        console.log('🔄 正在刷新访问令牌...');
        
        const response = await axios.post(
            `${CONFIG.baseURL}/api/admin-api/system/auth/refresh-token?refreshToken=${refreshToken}`,
            {},
            {
                headers: {
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
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0'
                }
            }
        );

        if (response.data.code === 0) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            // 更新配置中的token
            CONFIG.headers.Authorization = `Bearer ${accessToken}`;
            CONFIG.refreshToken = newRefreshToken;
            
            // 保存到配置文件
            saveTokensToConfig(accessToken, newRefreshToken);
            
            console.log('✅ 访问令牌刷新成功');
            console.log(`📅 新accessToken: ${accessToken.substring(0, 20)}...`);
            console.log(`📅 新refreshToken: ${newRefreshToken.substring(0, 20)}...`);
            
            return response.data.data;
        } else {
            throw new Error(`刷新令牌失败: ${response.data.msg}`);
        }
    } catch (error) {
        console.error('❌ 刷新访问令牌失败:', error.message);
        throw error;
    }
}

/**
 * 保存新的token到配置文件
 * @param {string} accessToken 新的访问令牌
 * @param {string} refreshToken 新的刷新令牌
 */
function saveTokensToConfig(accessToken, refreshToken) {
    try {
        const configPath = path.join(__dirname, 'config.json');
        let config = {};
        
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configData);
        }
        
        // 确保auth对象存在
        if (!config.auth) {
            config.auth = {};
        }
        
        // 更新token
        config.auth.authorization = `Bearer ${accessToken}`;
        config.auth.refreshToken = refreshToken;
        
        // 保存到文件
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log('💾 新的token已保存到配置文件');
    } catch (error) {
        console.error('❌ 保存token到配置文件失败:', error.message);
    }
}

/**
 * 检查认证信息是否有效
 * @returns {Promise<boolean>} 认证是否有效
 */
async function checkAuth() {
    try {
        console.log('🔍 检查认证信息...');
        const result = await fetchMaterialList(1, 1); // 只请求1条数据来测试
        
        // 🔄 额外检查响应数据中的401错误
        if (result && (result.code === 401 || result.status === 401 || result.error === 401)) {
            console.error('❌ 认证信息无效 (响应数据中检测到401)');
            return false;
        }
        
        return true;
    } catch (error) {
        if (error.isAuthError && error.status === 401) {
            console.error('❌ 认证信息无效');
            return false;
        }
        throw error;
    }
}

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
async function fetchMaterialList(pageNo = 1, pageSize = 20, startTime = null, endTime = null) {
    try {
        console.log(`正在获取第 ${pageNo} 页数据...`);
        
        // 构建请求参数
        const requestData = {
            ...requestParams,
            pageNo,
            pageSize
        };
        
        // 如果提供了时间范围，添加到请求参数中
        if (startTime && endTime) {
            requestData.startTime = startTime;
            requestData.endTime = endTime;
            console.log(`📅 时间范围: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`);
        }
        
        const response = await axios.post(
            CONFIG.baseURL + CONFIG.endpoint,
            requestData,
            {
                headers: CONFIG.headers,
                timeout: 30000
            }
        );


        
        // 🔄 检查API响应数据中的401错误
        const responseData = response.data;
        if (responseData && (responseData.code === 401 || responseData.status === 401 || responseData.error === 401)) {
            console.log('\n🔄 === 检测到401错误，尝试自动刷新token ===');
            
            // 如果有refreshToken，尝试刷新
            if (CONFIG.refreshToken) {
                try {
                    console.log('🔄 正在使用refreshToken刷新访问令牌...');
                    await refreshAccessToken(CONFIG.refreshToken);
                    
                    // 刷新成功后，重新尝试请求
                    console.log('🔄 重新尝试请求...');
                    const retryResponse = await axios.post(
                        CONFIG.baseURL + CONFIG.endpoint,
                        requestData,
                        {
                            headers: CONFIG.headers,
                            timeout: 30000
                        }
                    );
                    
                    return retryResponse.data;
                    
                } catch (refreshError) {
                    console.error('❌ 刷新token失败:', refreshError.message);
                    console.log('\n🔄 === 认证信息已过期 ===');
                    console.log('💡 需要更新认证信息，请按以下步骤操作：');
                    console.log('   1. 在浏览器中重新登录网站');
                    console.log('   2. 打开开发者工具 (F12)');
                    console.log('   3. 在 Network 标签页中找到API请求');
                    console.log('   4. 复制 Authorization 和 Cookie 头的值');
                    console.log('   5. 使用以下命令更新认证信息：');
                    console.log('      npm run hengyouxin:update');
                    console.log('   6. 或者直接编辑 config.json 文件');
                    console.log('\n📋 当前认证信息：');
                    console.log(`   Authorization: ${CONFIG.headers.Authorization ? CONFIG.headers.Authorization.substring(0, 30) + '...' : '未设置'}`);
                    console.log(`   Cookie: ${CONFIG.headers.Cookie ? CONFIG.headers.Cookie.substring(0, 50) + '...' : '未设置'}`);
                    console.log('\n❌ 程序将退出，请更新认证信息后重新运行');
                    
                    // 创建401错误对象
                    const authError = new Error('401 Unauthorized - 认证信息已过期');
                    authError.status = 401;
                    authError.isAuthError = true;
                    authError.responseData = responseData;
                    throw authError;
                }
            } else {
                console.log('\n🔄 === 认证信息已过期 ===');
                console.log('💡 需要更新认证信息，请按以下步骤操作：');
                console.log('   1. 在浏览器中重新登录网站');
                console.log('   2. 打开开发者工具 (F12)');
                console.log('   3. 在 Network 标签页中找到API请求');
                console.log('   4. 复制 Authorization 和 Cookie 头的值');
                console.log('   5. 使用以下命令更新认证信息：');
                console.log('      npm run hengyouxin:update');
                console.log('   6. 或者直接编辑 config.json 文件');
                console.log('\n📋 当前认证信息：');
                console.log(`   Authorization: ${CONFIG.headers.Authorization ? CONFIG.headers.Authorization.substring(0, 30) + '...' : '未设置'}`);
                console.log(`   Cookie: ${CONFIG.headers.Cookie ? CONFIG.headers.Cookie.substring(0, 50) + '...' : '未设置'}`);
                console.log('\n❌ 程序将退出，请更新认证信息后重新运行');
                
                // 创建401错误对象
                const authError = new Error('401 Unauthorized - 认证信息已过期');
                authError.status = 401;
                authError.isAuthError = true;
                authError.responseData = responseData;
                throw authError;
            }
        }
        
        return responseData;
    } catch (error) {
        console.error('请求失败:', error.message);
        
        // 如果已经是401错误，直接抛出
        if (error.isAuthError && error.status === 401) {
            throw error;
        }
        
        if (error.response) {
            
            // 🔄 HTTP状态码401错误处理（备用）
            if (error.response.status === 401) {
                console.log('\n🔄 === 检测到401错误 (HTTP状态码)，尝试自动刷新token ===');
                
                // 如果有refreshToken，尝试刷新
                if (CONFIG.refreshToken) {
                    try {
                        console.log('🔄 正在使用refreshToken刷新访问令牌...');
                        await refreshAccessToken(CONFIG.refreshToken);
                        
                        // 刷新成功后，重新尝试请求
                        console.log('🔄 重新尝试请求...');
                        const retryResponse = await axios.post(
                            CONFIG.baseURL + CONFIG.endpoint,
                            requestData,
                            {
                                headers: CONFIG.headers,
                                timeout: 30000
                            }
                        );
                        
                        return retryResponse.data;
                        
                    } catch (refreshError) {
                        console.error('❌ 刷新token失败:', refreshError.message);
                        console.log('\n🔄 === 认证信息已过期 (HTTP状态码) ===');
                        console.log('💡 需要更新认证信息，请按以下步骤操作：');
                        console.log('   1. 在浏览器中重新登录网站');
                        console.log('   2. 打开开发者工具 (F12)');
                        console.log('   3. 在 Network 标签页中找到API请求');
                        console.log('   4. 复制 Authorization 和 Cookie 头的值');
                        console.log('   5. 使用以下命令更新认证信息：');
                        console.log('      npm run hengyouxin:update');
                        console.log('   6. 或者直接编辑 config.json 文件');
                        console.log('\n📋 当前认证信息：');
                        console.log(`   Authorization: ${CONFIG.headers.Authorization ? CONFIG.headers.Authorization.substring(0, 30) + '...' : '未设置'}`);
                        console.log(`   Cookie: ${CONFIG.headers.Cookie ? CONFIG.headers.Cookie.substring(0, 50) + '...' : '未设置'}`);
                        console.log('\n❌ 程序将退出，请更新认证信息后重新运行');
                        
                        // 创建401错误对象
                        const authError = new Error('401 Unauthorized - 认证信息已过期');
                        authError.status = 401;
                        authError.isAuthError = true;
                        authError.responseData = error.response.data;
                        throw authError;
                    }
                } else {
                    console.log('\n🔄 === 认证信息已过期 (HTTP状态码) ===');
                    console.log('💡 需要更新认证信息，请按以下步骤操作：');
                    console.log('   1. 在浏览器中重新登录网站');
                    console.log('   2. 打开开发者工具 (F12)');
                    console.log('   3. 在 Network 标签页中找到API请求');
                    console.log('   4. 复制 Authorization 和 Cookie 头的值');
                    console.log('   5. 使用以下命令更新认证信息：');
                    console.log('      npm run hengyouxin:update');
                    console.log('   6. 或者直接编辑 config.json 文件');
                    console.log('\n📋 当前认证信息：');
                    console.log(`   Authorization: ${CONFIG.headers.Authorization ? CONFIG.headers.Authorization.substring(0, 30) + '...' : '未设置'}`);
                    console.log(`   Cookie: ${CONFIG.headers.Cookie ? CONFIG.headers.Cookie.substring(0, 50) + '...' : '未设置'}`);
                    console.log('\n❌ 程序将退出，请更新认证信息后重新运行');
                    
                    // 创建401错误对象
                    const authError = new Error('401 Unauthorized - 认证信息已过期');
                    authError.status = 401;
                    authError.isAuthError = true;
                    authError.responseData = error.response.data;
                    throw authError;
                }
            }
        }
        throw error;
    }
}



// 处理素材数据
async function processMaterials(data) {

    
    // 🔄 检查响应数据中的401错误
    if (data && (data.code === 401 || data.status === 401 || data.error === 401)) {
        console.log('\n🔄 === 认证信息已过期 ===');
        console.log('💡 需要更新认证信息，请按以下步骤操作：');
        console.log('   1. 在浏览器中重新登录网站');
        console.log('   2. 打开开发者工具 (F12)');
        console.log('   3. 在 Network 标签页中找到API请求');
        console.log('   4. 复制 Authorization 和 Cookie 头的值');
        console.log('   5. 使用以下命令更新认证信息：');
        console.log('      npm run hengyouxin:update');
        console.log('   6. 或者直接编辑 config.json 文件');
        console.log('\n📋 当前认证信息：');
        console.log(`   Authorization: ${CONFIG.headers.Authorization ? CONFIG.headers.Authorization.substring(0, 30) + '...' : '未设置'}`);
        console.log(`   Cookie: ${CONFIG.headers.Cookie ? CONFIG.headers.Cookie.substring(0, 50) + '...' : '未设置'}`);
        console.log('\n❌ 程序将退出，请更新认证信息后重新运行');
        
        // 创建401错误对象
        const authError = new Error('401 Unauthorized - 认证信息已过期');
        authError.status = 401;
        authError.isAuthError = true;
        authError.responseData = data;
        throw authError;
    }
    
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
        
        // console.log(`\n素材 ${index + 1}:`);
        // console.log(JSON.stringify(extracted, null, 2));
        
        return extracted;
    });
    
    console.log(`\n=== 总计提取了 ${usefulData.length} 个素材的有用信息 ===`);
    
    return usefulData;
}

// 主函数
async function main() {
    try {
        console.log('开始爬取素材...');
        
        // 🔍 首先检查认证信息
        const isAuthValid = await checkAuth();
        if (!isAuthValid) {
            console.error('\n🔄 === 程序因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行脚本');
            process.exit(1);
        }
        console.log('✅ 认证信息有效，开始爬取...');
        
        // 获取第一页数据
        const result = await fetchMaterialList(1, 20);
        console.log('请求成功，开始处理数据...');
        

        
        // 处理素材数据
        const usefulData = await processMaterials(result);
        
        console.log('\n=== 爬取完成！===');
        console.log(`成功提取了 ${usefulData.length} 个素材的有用信息`);
        
    } catch (error) {
        console.error('程序执行失败:', error.message);
        
        // 🔄 401认证错误处理
        if (error.isAuthError && error.status === 401) {
            console.error('\n🔄 === 程序因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行脚本');
            process.exit(1); // 退出程序
        }
        
        if (error.response) {
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
    
    // 🔍 首先检查认证信息
    try {
        const isAuthValid = await checkAuth();
        if (!isAuthValid) {
            console.error('\n🔄 === 批量爬取因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行脚本');
            process.exit(1);
        }
        console.log('✅ 认证信息有效，开始批量爬取...');
    } catch (error) {
        console.error('认证检查失败:', error.message);
        process.exit(1);
    }
    
    // 读取进度
    const progress = readProgress();
    const log = readLog();
    
    console.log(`当前进度: 第 ${progress.currentPage} 页，已提取 ${progress.totalExtracted} 个素材`);
    
    // 如果没有指定结束页，则获取总页数
    if (!endPage) {
        try {
            console.log('获取总页数...');
            const result = await fetchMaterialList(1, 20);
            

            
            if (!result || !result.data) {
                console.error('API响应格式错误: result.data 为空');
    
                return;
            }
            
            const totalCount = result.data.total;
            if (totalCount === undefined || totalCount === null) {
                console.error('无法获取总素材数量，API返回的total字段为空');

                return;
            }
            
            endPage = Math.ceil(totalCount / 20);
            console.log(`总素材数量: ${totalCount}，总页数: ${endPage}`);
        } catch (error) {
            console.error('获取总页数失败:', error.message);
            
            // 🔄 401认证错误处理
            if (error.isAuthError && error.status === 401) {
                console.error('\n🔄 === 批量爬取因认证错误退出 ===');
                console.error('💡 请更新认证信息后重新运行脚本');
                process.exit(1); // 退出程序
            }
            
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
            
            // 🔄 401认证错误处理
            if (error.isAuthError && error.status === 401) {
                console.error('\n🔄 === 批量爬取因认证错误退出 ===');
                console.error('💡 请更新认证信息后重新运行脚本');
                console.error(`📊 已保存进度到第 ${page} 页，共提取 ${totalExtracted} 个素材`);
                process.exit(1); // 退出程序
            }
            
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
        console.log(`   Authorization: ${auth ? auth.substring(0, 20) + '...' : '未设置'}`);
        console.log(`   Cookie: ${cookie ? cookie.substring(0, 50) + '...' : '未设置'}`);
        
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
        
        // 🔄 401认证错误处理
        if (error.isAuthError && error.status === 401) {
            console.error('\n🔄 === 测试连接因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行测试');
            process.exit(1); // 退出程序
        }
        
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
        console.log(`   Cookie: ${cookie ? cookie.substring(0, 50) + '...' : '未设置'}`);
        
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

/**
 * 交互式更新认证信息
 * 
 * 🔄 功能：
 * - 引导用户输入新的认证信息
 * - 验证输入格式
 * - 自动更新配置文件
 * - 测试新认证信息
 */
function interactiveUpdateAuth() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('🔄 === 交互式更新认证信息 ===');
    console.log('💡 请按照以下步骤获取新的认证信息：');
    console.log('   1. 在浏览器中重新登录网站');
    console.log('   2. 打开开发者工具 (F12)');
    console.log('   3. 在 Network 标签页中找到API请求');
    console.log('   4. 复制 Authorization 和 Cookie 头的值');
    console.log('');
    
    rl.question('请输入新的 Authorization (Bearer token): ', (authorization) => {
        if (!authorization.trim()) {
            console.log('❌ Authorization 不能为空');
            rl.close();
            return;
        }
        
        rl.question('请输入新的 Cookie: ', (cookie) => {
            if (!cookie.trim()) {
                console.log('❌ Cookie 不能为空');
                rl.close();
                return;
            }
            
            // 验证格式
            if (!authorization.startsWith('Bearer ')) {
                console.log('⚠️  警告: Authorization 应该以 "Bearer " 开头');
                console.log('   当前输入:', authorization);
                rl.question('是否继续? (y/n): ', (confirm) => {
                    if (confirm.toLowerCase() !== 'y') {
                        console.log('❌ 更新已取消');
                        rl.close();
                        return;
                    }
                    updateAuthAndTest(authorization, cookie, rl);
                });
            } else {
                updateAuthAndTest(authorization, cookie, rl);
            }
        });
    });
}

/**
 * 按时间范围爬取素材
 * 
 * 📅 功能：
 * - 爬取指定时间范围内的所有素材
 * - 支持自定义开始和结束时间戳
 * - 自动分页处理所有数据
 * - 保存进度和日志
 * 
 * @param {number} startTime - 开始时间戳（毫秒）
 * @param {number} endTime - 结束时间戳（毫秒）
 * @param {string} description - 时间范围描述（可选）
 */
async function crawlByTimeRange(startTime, endTime, description = '') {
    console.log('=== 开始按时间范围爬取素材 ===');
    
    if (description) {
        console.log(`📅 时间范围描述: ${description}`);
    }
    console.log(`📅 开始时间: ${new Date(startTime).toLocaleString()}`);
    console.log(`📅 结束时间: ${new Date(endTime).toLocaleString()}`);
    
    // 🔍 首先检查认证信息
    try {
        const isAuthValid = await checkAuth();
        if (!isAuthValid) {
            console.error('\n🔄 === 时间范围爬取因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行脚本');
            process.exit(1);
        }
        console.log('✅ 认证信息有效，开始时间范围爬取...');
    } catch (error) {
        console.error('认证检查失败:', error.message);
        process.exit(1);
    }
    
    // 读取日志
    const log = readLog();
    let totalExtracted = 0;
    let currentPage = 1;
    const startTimeMs = Date.now();
    
    console.log(`\n开始爬取时间范围内的所有素材...`);
    
    try {
        while (true) {
            console.log(`\n=== 正在处理第 ${currentPage} 页 ===`);
            
            const result = await fetchMaterialList(currentPage, 20, startTime, endTime);
            
            // 检查是否有数据
            if (!result || !result.data || !result.data.list || result.data.list.length === 0) {
                console.log('📄 没有更多数据，爬取完成');
                break;
            }
            
            const usefulData = await processMaterials(result);
            
            if (!usefulData || usefulData.length === 0) {
                console.log('📄 当前页没有有效数据，继续下一页');
                currentPage++;
                continue;
            }
            
            // 添加到日志
            usefulData.forEach(material => {
                log.materials.push({
                    ...material,
                    page: currentPage,
                    crawlTime: new Date().toISOString(),
                    timeRange: {
                        startTime: startTime,
                        endTime: endTime,
                        description: description
                    }
                });
            });
            
            totalExtracted += usefulData.length;
            log.totalCount = totalExtracted;
            log.lastUpdate = new Date().toISOString();
            
            // 保存日志
            saveLog(log);
            
            console.log(`第 ${currentPage} 页完成，累计提取: ${totalExtracted} 个素材`);
            
            // 检查是否还有更多页
            const totalCount = result.data.total;
            const totalPages = Math.ceil(totalCount / 20);
            
            if (currentPage >= totalPages) {
                console.log('📄 已到达最后一页，爬取完成');
                break;
            }
            
            currentPage++;
            
            // 添加延迟避免请求过快
            console.log('等待 2 秒后继续...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const endTimeMs = Date.now();
        const duration = Math.round((endTimeMs - startTimeMs) / 1000);
        
        console.log('\n=== 时间范围爬取完成！===');
        console.log(`📅 时间范围: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`);
        console.log(`📊 总共提取了 ${totalExtracted} 个素材的有用信息`);
        console.log(`⏱️  总耗时: ${duration} 秒`);
        console.log(`📄 日志文件: ${LOG_FILE}`);
        
    } catch (error) {
        console.error(`时间范围爬取失败:`, error.message);
        
        // 🔄 401认证错误处理
        if (error.isAuthError && error.status === 401) {
            console.error('\n🔄 === 时间范围爬取因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行脚本');
            console.error(`📊 已保存进度，共提取 ${totalExtracted} 个素材`);
            process.exit(1);
        }
        
        if (error.response) {
        }
    }
}

/**
 * 爬取前一天的素材
 * 
 * 📅 功能：
 * - 自动计算前一天的开始和结束时间
 * - 爬取前一天创建的所有素材
 * - 使用时间戳格式
 */
async function crawlYesterday() {
    console.log('📅 === 开始爬取前一天的素材 ===');
    
    // 计算前一天的开始和结束时间
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 设置前一天的开始时间（00:00:00）
    const startTime = new Date(yesterday);
    startTime.setHours(0, 0, 0, 0);
    
    // 设置前一天的结束时间（23:59:59）
    const endTime = new Date(yesterday);
    endTime.setHours(23, 59, 59, 999);
    
    const startTimeMs = startTime.getTime();
    const endTimeMs = endTime.getTime();
    
    console.log(`📅 前一天日期: ${yesterday.toLocaleDateString()}`);
    console.log(`📅 时间范围: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`);
    console.log(`📅 时间戳: ${startTimeMs} - ${endTimeMs}`);
    
    await crawlByTimeRange(startTimeMs, endTimeMs, '前一天素材');
}

// 更新认证信息并测试
async function updateAuthAndTest(authorization, cookie, rl) {
    try {
        console.log('\n🔄 正在更新认证信息...');
        updateAuth(authorization, cookie);
        
        console.log('\n🧪 正在测试新的认证信息...');
        await testConnection();
        
        console.log('\n✅ 认证信息更新成功！');
        console.log('💡 现在可以运行以下命令开始爬取：');
        console.log('   npm run hengyouxin');
        console.log('   npm run hengyouxin:batch');
        
    } catch (error) {
        console.log('\n❌ 认证信息更新失败或测试失败');
        console.log('💡 请检查输入的认证信息是否正确');
    } finally {
        rl.close();
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
    checkAuth,
    interactiveUpdateAuth,
    crawlByTimeRange,
    crawlYesterday,
    refreshAccessToken,
    saveTokensToConfig,
    main
};

// 如果直接运行此文件
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'test':
            testConnection();
            break;
        case 'update':
            interactiveUpdateAuth();
            break;
        case 'batch':
            batchCrawl();
            break;
        case 'log':
            viewLog();
            break;
        case 'yesterday':
            crawlYesterday();
            break;
        case 'timerange':
            // 时间范围爬取: node index.js timerange <startTime> <endTime> [description]
            const startTime = parseInt(args[1]);
            const endTime = parseInt(args[2]);
            const description = args[3] || '';
            
            if (!startTime || !endTime) {
                console.log('❌ 使用方法: node index.js timerange <startTime> <endTime> [description]');
                console.log('💡 示例: node index.js timerange 1704067200000 1704153599999 "2024年1月1日"');
                console.log('💡 时间戳格式: 毫秒级时间戳');
                process.exit(1);
            }
            
            crawlByTimeRange(startTime, endTime, description);
            break;
        default:
            main();
            break;
    }
}
