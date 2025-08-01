/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-31 21:48:38
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-08-01 05:51:22
 * @FilePath: /yishe-scripts/scripts/hengyouxin/index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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

// 跳过 SSL 证书验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const {
    uploadLocalFileToCOS,
    sendToFeishu
} = require('../utils');

// 服务器上传配置
const DESIGN_SERVER_API = 'https://1s.design:1520/api/crawler/material/add';

// 日志文件配置
const SUCCESS_LOG = path.join(__dirname, 'success.log');
const FAIL_LOG = path.join(__dirname, 'fail.log');
const COS_LOG = path.join(__dirname, 'cos-upload.log');
const SERVER_LOG = path.join(__dirname, 'server-upload.log');

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
                'Authorization': (config.auth && config.auth.authorization) || null,
                'Cookie': (config.auth && config.auth.cookie) || null
            };

            return {
                baseURL: 'https://www.erp.iuufu.com',
                endpoint: '/api/admin-api/asset/material-management/page',
                headers: headers,
                refreshToken: (config.auth && config.auth.refreshToken) || null
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
            'Authorization': 'Bearer 492cfde11140468fadb5d6f67d50439e', // 🔄 需要更新

            // 更新日期: 2025-01-31  
            // 旧值: ...Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753937977...

            // 'Cookie': '_ga=GA1.1.884180217.1752652946; _ga_MRBW1BE7X4=GS2.1.s1752656046$o2$g0$t1752656046$j60$l0$h0; Hm_lvt_a1ff8825baa73c3a78eb96aa40325abc=1751534604,1753927964,1753937977; HMACCOUNT=0C80E26C5FDA120B; Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753943040'  // 🔄 需要更新
        },
        refreshToken: '21caf4bb57e145c390e228164e71bbb4' // �� 初始refreshToken
    };
}

// 配置信息
const CONFIG = loadConfig();

// 日志文件路径
const LOG_FILE = path.join(__dirname, 'crawl_log.json');
const PROGRESS_FILE = path.join(__dirname, 'progress.json');
const YESTERDAY_LOGS_DIR = path.join(__dirname, 'yesterday_logs');

// 确保 yesterday_logs 目录存在
if (!fs.existsSync(YESTERDAY_LOGS_DIR)) {
    fs.mkdirSync(YESTERDAY_LOGS_DIR, {
        recursive: true
    });
}

// 生成昨天爬取的日志文件名
function getYesterdayLogFileName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
    return path.join(YESTERDAY_LOGS_DIR, `yesterday_${timestamp}.json`);
}

/**
 * 刷新访问令牌
 * @param {string} refreshToken 刷新令牌
 * @returns {Promise<Object>} 新的token信息
 */
async function refreshAccessToken(refreshToken) {
    try {
        console.log('🔄 正在刷新访问令牌...');

        const response = await axios.post(
            `${CONFIG.baseURL}/api/admin-api/system/auth/refresh-token?refreshToken=${refreshToken}`, {}, {
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
            const {
                accessToken,
                refreshToken: newRefreshToken
            } = response.data.data;

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
    sortingFields: [{
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
            requestData, {
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
                        requestData, {
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
                            requestData, {
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
async function processMaterials(data, description = '', progress = null) {
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
        return [];
    }

    const materials = data.data.list;
    const totalCount = data.data.total;

    console.log(`\n=== 数据统计 ===`);
    console.log(`当前页素材数量: ${materials.length}`);
    console.log(`总素材数量: ${totalCount}`);
    console.log(`当前页/总页数: ${Math.ceil(totalCount / 20)} 页`);

    console.log('\n=== 处理素材并上传 ===');
    const usefulData = [];
    let successCount = 0;
    let failCount = 0;

    // 获取当前页面和索引
    const currentPage = progress ? progress.currentPage : 1;
    const currentIndex = progress ? progress.currentIndex : 0;
    const uploadedMaterials = progress ? progress.uploadedMaterials : [];

    console.log(`📊 从第 ${currentPage} 页第 ${currentIndex + 1} 个素材开始处理`);

    for (let i = currentIndex; i < materials.length; i++) {
        const material = materials[i];
        const index = i + 1;
        const materialId = material.id || material.ossObjectName; // 使用ID或URL作为唯一标识

        // 检查是否已经上传过
        if (uploadedMaterials.includes(materialId)) {
            console.log(`⏭️  [${index}/${materials.length}] 跳过已上传素材: ${material.ossObjectName}`);
            continue;
        }

        try {
            console.log(`\n[${index}/${materials.length}] 处理素材: ${material.ossObjectName}`);

            // 提取有用信息
            const extracted = {
                index: index,
                imageFormat: material.imageFormat, // 图片后缀
                ossObjectName: material.ossObjectName, // 图片URL地址
                materialName: material.materialName || `hengyouxin_${Date.now()}_${index}`, // 素材名称
                description: description || '恒优信素材'
            };

            // 下载并上传到COS
            const cosUrl = await downloadAndUploadToCOS(
                material.ossObjectName,
                extracted.materialName,
                description
            );

            // 保存到服务器
            await saveToServer({
                url: cosUrl,
                name: extracted.materialName,
                desc: description || '恒优信素材',
                source: 'hengyouxin',
                suffix: extracted.imageFormat || 'jpg'
            });

            // 记录成功日志
            appendLog(SERVER_LOG, JSON.stringify({
                name: extracted.materialName,
                cosUrl: cosUrl,
                originalUrl: material.ossObjectName,
                description: description,
                timestamp: new Date().toISOString(),
                status: 'server_upload_success'
            }));

            // 添加到结果数组
            usefulData.push({
                ...extracted,
                cosUrl: cosUrl,
                uploadStatus: 'success'
            });

            // 添加到已上传列表
            uploadedMaterials.push(materialId);

            successCount++;
            console.log(`✅ [${index}] 上传成功: ${extracted.materialName}`);

            // 实时保存进度（每处理一个素材就保存）
            if (progress) {
                progress.currentIndex = i + 1;
                progress.uploadedMaterials = uploadedMaterials;
                saveProgress(progress);
            }

        } catch (error) {
            failCount++;
            console.error(`❌ [${index}] 上传失败: ${error.message}`);

            // 记录失败日志
            appendLog(FAIL_LOG, JSON.stringify({
                name: material.materialName || `hengyouxin_${Date.now()}_${index}`,
                originalUrl: material.ossObjectName,
                description: description,
                timestamp: new Date().toISOString(),
                status: 'upload_fail',
                error: error.message
            }));

            // 添加到结果数组（失败状态）
            usefulData.push({
                index: index,
                imageFormat: material.imageFormat,
                ossObjectName: material.ossObjectName,
                materialName: material.materialName || `hengyouxin_${Date.now()}_${index}`,
                description: description || '恒优信素材',
                uploadStatus: 'fail',
                error: error.message
            });

            // 实时保存进度（即使失败也保存）
            if (progress) {
                progress.currentIndex = i + 1;
                progress.uploadedMaterials = uploadedMaterials;
                saveProgress(progress);
            }

            // 等待1秒后继续处理下一个
            if (i < materials.length - 1) {
                console.log('等待 1 秒后继续...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    console.log('\n=== 处理完成 ===');
    console.log(`成功上传: ${successCount} 个`);
    console.log(`上传失败: ${failCount} 个`);
    console.log(`总计处理: ${usefulData.length} 个素材`);

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
        const usefulData = await processMaterials(result, '恒优信素材');

        // 统计结果
        const successCount = usefulData.filter(item => item.uploadStatus === 'success').length;
        const failCount = usefulData.filter(item => item.uploadStatus === 'fail').length;

        console.log('\n=== 爬取完成！===');
        console.log(`成功上传: ${successCount} 个`);
        console.log(`上传失败: ${failCount} 个`);
        console.log(`总计处理: ${usefulData.length} 个素材`);

        // 发送飞书通知
        const feishuMessage = `🎯 素材爬取完成

📊 总共处理: ${usefulData.length} 个素材
✅ 成功上传: ${successCount} 个
❌ 上传失败: ${failCount} 个
📄 日志文件: crawl_log.json`;

        await sendToFeishu(feishuMessage);
        console.log('📱 飞书通知已发送');

    } catch (error) {
        console.error('程序执行失败:', error.message);

        // 🔄 401认证错误处理
        if (error.isAuthError && error.status === 401) {
            console.error('\n🔄 === 程序因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行脚本');

            // 发送错误通知
            await sendToFeishu('❌ 恒优信素材爬取失败\n\n❌ 错误原因: 认证信息已过期\n💡 请更新认证信息后重新运行');
            process.exit(1); // 退出程序
        }

        // 发送一般错误通知
        await sendToFeishu(`❌ 恒优信素材爬取失败\n\n❌ 错误原因: ${error.message}`);

        if (error.response) {}
    }
}

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
    return {
        currentPage: 1,
        currentIndex: 0, // 当前页面中的素材索引
        totalExtracted: 0,
        uploadedMaterials: [], // 已上传的素材ID列表
        startTime: Date.now()
    };
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
    return {
        materials: [],
        totalCount: 0,
        lastUpdate: Date.now()
    };
}

// 保存日志
function saveLog(logData) {
    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(logData, null, 2));
    } catch (error) {
        console.error('保存日志文件失败:', error.message);
    }
}

// 读取昨天爬取的日志
function readYesterdayLog(logFileName) {
    try {
        if (fs.existsSync(logFileName)) {
            const data = fs.readFileSync(logFileName, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('读取昨天日志文件失败:', error.message);
    }
    return {
        materials: [],
        totalCount: 0,
        lastUpdate: Date.now()
    };
}

// 保存昨天爬取的日志
function saveYesterdayLog(logData, logFileName) {
    try {
        fs.writeFileSync(logFileName, JSON.stringify(logData, null, 2));
    } catch (error) {
        console.error('保存昨天日志文件失败:', error.message);
    }
}

// 追加日志记录
function appendLog(file, data) {
    try {
        fs.appendFileSync(file, data + '\n');
    } catch (error) {
        console.error('追加日志失败:', error.message);
    }
}

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

        // 记录COS上传日志
        appendLog(COS_LOG, JSON.stringify({
            name,
            originalUrl: imgUrl,
            cosUrl: cosResult.url,
            cosKey: cosResult.key,
            description,
            timestamp: new Date().toISOString(),
            status: 'cos_upload_success'
        }));

        console.log(`[COS上传成功] ${cosResult.url}`);
        return cosResult.url;
    } catch (err) {
        // 记录失败日志
        appendLog(COS_LOG, JSON.stringify({
            name,
            originalUrl: imgUrl,
            description,
            timestamp: new Date().toISOString(),
            status: 'cos_upload_fail',
            error: err.message
        }));
        throw new Error('下载或上传COS失败: ' + err.message);
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
    let currentIndex = progress.currentIndex;
    let totalExtracted = progress.totalExtracted;
    let uploadedMaterials = progress.uploadedMaterials;

    console.log(`\n开始从第 ${currentPage} 页第 ${currentIndex + 1} 个素材爬取到第 ${endPage} 页...`);

    for (let page = currentPage; page <= endPage; page++) {
        try {
            console.log(`\n=== 正在处理第 ${page} 页 (${page}/${endPage}) ===`);
            const result = await fetchMaterialList(page, 20);

            // 传递进度信息给processMaterials
            const usefulData = await processMaterials(result, '恒优信素材', {
                currentPage: page,
                currentIndex: page === currentPage ? currentIndex : 0,
                uploadedMaterials: uploadedMaterials
            });

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

            // 更新进度信息
            currentIndex = 0; // 下一页从第1个素材开始
            uploadedMaterials = progress.uploadedMaterials; // 更新已上传列表

            // 保存进度和日志
            saveProgress({
                currentPage: page + 1,
                currentIndex: 0,
                totalExtracted: totalExtracted,
                uploadedMaterials: uploadedMaterials,
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
                currentIndex: currentIndex,
                totalExtracted: totalExtracted,
                uploadedMaterials: uploadedMaterials,
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
 * 查看昨天的日志文件
 */
function viewYesterdayLogs() {
    console.log('\n=== 昨天爬取日志文件 ===');
    console.log(`日志目录: ${YESTERDAY_LOGS_DIR}`);

    try {
        if (!fs.existsSync(YESTERDAY_LOGS_DIR)) {
            console.log('📁 昨天日志目录不存在');
            return;
        }

        const files = fs.readdirSync(YESTERDAY_LOGS_DIR);
        const logFiles = files.filter(file => file.endsWith('.json')).sort().reverse();

        if (logFiles.length === 0) {
            console.log('📄 没有找到昨天爬取的日志文件');
            return;
        }

        console.log(`📄 找到 ${logFiles.length} 个昨天爬取的日志文件:`);

        logFiles.forEach((file, index) => {
            const filePath = path.join(YESTERDAY_LOGS_DIR, file);
            const stats = fs.statSync(filePath);
            const log = readYesterdayLog(filePath);

            console.log(`\n${index + 1}. ${file}`);
            console.log(`   创建时间: ${stats.birthtime.toLocaleString()}`);
            console.log(`   文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   素材数量: ${log.totalCount || 0}`);
            console.log(`   最后更新: ${log.lastUpdate || '未知'}`);

            if (log.materials && log.materials.length > 0) {
                console.log(`   最近 3 个素材:`);
                log.materials.slice(-3).forEach((material, idx) => {
                    console.log(`     ${idx + 1}. 第${material.page}页 - ${material.imageFormat} - ${material.ossObjectName}`);
                });
            }
        });

    } catch (error) {
        console.error('读取昨天日志文件失败:', error.message);
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
async function crawlByTimeRange(startTime, endTime, description = '', useSeparateLog = false) {
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

    // 根据参数决定使用哪个日志文件
    let logFileName;
    let log;

    if (useSeparateLog) {
        logFileName = getYesterdayLogFileName();
        log = readYesterdayLog(logFileName);
        console.log(`📄 使用单独日志文件: ${logFileName}`);
    } else {
        logFileName = LOG_FILE;
        log = readLog();
        console.log(`📄 使用主日志文件: ${logFileName}`);
    }

    let totalExtracted = 0;
    let currentPage = 1;
    const startTimeMs = Date.now();
    let totalSuccess = 0;
    let totalFail = 0;

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

            const usefulData = await processMaterials(result, description);

            if (!usefulData || usefulData.length === 0) {
                console.log('📄 当前页没有有效数据，继续下一页');
                currentPage++;
                continue;
            }

            // 统计成功和失败数量
            const pageSuccess = usefulData.filter(item => item.uploadStatus === 'success').length;
            const pageFail = usefulData.filter(item => item.uploadStatus === 'fail').length;
            totalSuccess += pageSuccess;
            totalFail += pageFail;

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

            // 根据参数决定保存到哪个日志文件
            if (useSeparateLog) {
                saveYesterdayLog(log, logFileName);
            } else {
                saveLog(log);
            }

            console.log(`第 ${currentPage} 页完成，累计提取: ${totalExtracted} 个素材 (成功: ${totalSuccess}, 失败: ${totalFail})`);

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
        console.log(`📊 总共处理: ${totalExtracted} 个素材`);
        console.log(`✅ 成功上传: ${totalSuccess} 个`);
        console.log(`❌ 上传失败: ${totalFail} 个`);
        console.log(`⏱️  总耗时: ${duration} 秒`);
        console.log(`📄 日志文件: ${logFileName}`);

        // 发送飞书通知（只在最后发送一次）
        const feishuMessage = `🎯 素材爬取完成

📅 时间范围: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}
📊 总共处理: ${totalExtracted} 个素材
✅ 成功上传: ${totalSuccess} 个
❌ 上传失败: ${totalFail} 个
⏱️ 总耗时: ${duration} 秒
📄 日志文件: ${path.basename(logFileName)}

${description ? `📝 描述: ${description}` : ''}`;

        await sendToFeishu(feishuMessage);
        console.log('📱 飞书通知已发送');

    } catch (error) {
        console.error(`时间范围爬取失败:`, error.message);

        // 🔄 401认证错误处理
        if (error.isAuthError && error.status === 401) {
            console.error('\n🔄 === 时间范围爬取因认证错误退出 ===');
            console.error('💡 请更新认证信息后重新运行脚本');
            console.error(`📊 已保存进度到第 ${currentPage} 页，共提取 ${totalExtracted} 个素材 (成功: ${totalSuccess}, 失败: ${totalFail})`);

            // 发送错误通知
            const errorMessage = `❌ 恒优信素材爬取失败

📅 时间范围: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}
📊 已处理: ${totalExtracted} 个素材 (成功: ${totalSuccess}, 失败: ${totalFail})
❌ 错误原因: 认证信息已过期
💡 请更新认证信息后重新运行`;

            await sendToFeishu(errorMessage);
            process.exit(1);
        }

        // 发送一般错误通知
        const errorMessage = `❌ 恒优信素材爬取失败

📅 时间范围: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}
📊 已处理: ${totalExtracted} 个素材 (成功: ${totalSuccess}, 失败: ${totalFail})
❌ 错误原因: ${error.message}`;

        await sendToFeishu(errorMessage);

        if (error.response) {}
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

    // 使用单独的日志文件
    await crawlByTimeRange(startTimeMs, endTimeMs, '前一天素材', true);
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
    viewYesterdayLogs,
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
        case 'yesterday-log':
            viewYesterdayLogs();
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