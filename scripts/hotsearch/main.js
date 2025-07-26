const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    // 输出目录
    outputDir: path.join(__dirname, '..', '..', 'data', 'hotsearch'),
    // 是否输出到控制台
    consoleOutput: true,
    // 是否保存到文件
    saveToFile: false,
    // 输出格式: 'json', 'markdown', 'csv'
    outputFormat: 'json',
    // 请求超时时间
    timeout: 10000,
    // 重试次数
    retryTimes: 3,
    // 重试间隔（毫秒）
    retryDelay: 1000
};

// 用户代理池
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0'
];

// 平台配置（后续由你提供接口和数据结构）
const PLATFORMS = {
    weibo: {
        name: '微博',
        url: 'https://weibo.com/ajax/side/hotSearch',
        headers: {},
        parser: function (data) {
            // 解析微博热搜返回结构
            if (!data || !data.data || !Array.isArray(data.data.realtime)) return [];
            return data.data.realtime.map(item => ({
                title: item.word,
                hot: item.num,
                note: item.note,
                label: item.label_name,
                icon: item.icon,
                icon_desc: item.icon_desc,
                rank: item.rank + 1,
                topic_flag: item.topic_flag,
                flag: item.flag,
                word_scheme: item.word_scheme
            }));
        },
        enabled: true
    },
    zhihu: {
        name: '知乎',
        url: '',
        headers: {},
        parser: null,
        enabled: false
    },
    douyin: {
        name: '抖音',
        url: 'https://www.douyin.com/aweme/v1/web/hot/search/list/',
        headers: {
            'Referer': 'https://www.douyin.com/',
            'Origin': 'https://www.douyin.com',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        },
        parser: function (data) {
            if (!data || !data.data || !Array.isArray(data.data.word_list)) return [];
            return data.data.word_list.map(item => ({
                title: item.word,
                hot: item.hot_value,
                rank: item.position,
                video_count: item.video_count,
                discuss_video_count: item.discuss_video_count,
                label: item.label,
                label_url: item.label_url,
                word_type: item.word_type,
                event_time: item.event_time,
                group_id: item.group_id,
                sentence_id: item.sentence_id,
                sentence_tag: item.sentence_tag,
                word_cover: item.word_cover
            }));
        },
        enabled: true
    },
    xiaohongshu: {
        name: '小红书',
        url: '',
        headers: {},
        parser: null,
        enabled: false
    },
    kuaishou: {
        name: '快手',
        url: '',
        headers: {},
        parser: null,
        enabled: false
    }
};

// 飞书Webhook地址（可根据需要改为配置文件或环境变量）
const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/77213058-0955-487d-8376-863ca5845ab4';

/**
 * 发送消息到飞书机器人
 * @param {string} content - 纯文本或markdown内容
 * @param {string} [msgType='text'] - 消息类型：'text' 或 'post'
 */
async function sendToFeishu(content, msgType = 'text') {
    try {
        let body;
        if (msgType === 'text') {
            body = {
                msg_type: 'text',
                content: { text: content }
            };
        } else if (msgType === 'post') {
            body = {
                msg_type: 'post',
                content: {
                    post: {
                        zh_cn: {
                            title: '热搜榜单',
                            content: [
                                [ { tag: 'text', text: content } ]
                            ]
                        }
                    }
                }
            };
        } else {
            throw new Error('不支持的消息类型');
        }
        const res = await axios.post(FEISHU_WEBHOOK, body, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.data && res.data.code === 0) {
            console.log(chalk.green('✅ 飞书推送成功'));
        } else {
            console.log(chalk.red('❌ 飞书推送失败：'), res.data);
        }
    } catch (err) {
        console.log(chalk.red('❌ 飞书推送异常：'), err.message);
    }
}

// 工具函数
class HotSearchCrawler {
    constructor() {
        this.results = {};
        this.errors = [];
        this.startTime = Date.now();
    }

    // 随机获取用户代理
    getRandomUserAgent() {
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }

    // 随机延迟0
    async randomDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // 创建axios实例
    createAxiosInstance() {
        return axios.create({
            timeout: CONFIG.timeout,
            headers: {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
    }

    // 带重试的请求
    async requestWithRetry(url, options = {}, retryTimes = CONFIG.retryTimes) {
        const axiosInstance = this.createAxiosInstance();
        
        for (let i = 0; i <= retryTimes; i++) {
            try {
                const response = await axiosInstance.get(url, options);
                return response.data;
            } catch (error) {
                if (i === retryTimes) {
                    throw error;
                }
                console.log(chalk.yellow(`请求失败，${CONFIG.retryDelay}ms后重试 (${i + 1}/${retryTimes + 1})`));
                await this.randomDelay(CONFIG.retryDelay, CONFIG.retryDelay * 2);
            }
        }
    }

    // 获取单个平台的热搜数据
    async fetchPlatformData(platformKey, platformConfig) {
        if (!platformConfig.enabled || !platformConfig.url) {
            return null;
        }

        try {
            console.log(chalk.blue(`正在获取 ${platformConfig.name} 热搜数据...`));
            
            const data = await this.requestWithRetry(platformConfig.url, {
                headers: platformConfig.headers
            });

            // 使用你提供的解析函数处理数据
            if (platformConfig.parser && typeof platformConfig.parser === 'function') {
                const parsedData = platformConfig.parser(data);
                return {
                    platform: platformKey,
                    name: platformConfig.name,
                    data: parsedData,
                    timestamp: new Date().toISOString(),
                    success: true
                };
            } else {
                // 如果没有解析函数，返回原始数据
                return {
                    platform: platformKey,
                    name: platformConfig.name,
                    data: data,
                    timestamp: new Date().toISOString(),
                    success: true
                };
            }
        } catch (error) {
            const errorInfo = {
                platform: platformKey,
                name: platformConfig.name,
                error: error.message,
                timestamp: new Date().toISOString(),
                success: false
            };
            this.errors.push(errorInfo);
            console.log(chalk.red(`获取 ${platformConfig.name} 数据失败: ${error.message}`));
            return errorInfo;
        }
    }

    // 获取所有平台的热搜数据
    async fetchAllPlatforms() {
        console.log(chalk.green('开始获取热搜数据...'));
        
        const promises = Object.entries(PLATFORMS).map(([key, config]) => 
            this.fetchPlatformData(key, config)
        );

        const results = await Promise.all(promises);
        
        // 过滤掉null结果
        this.results = results.filter(result => result !== null);
        
        return this.results;
    }

    // 输出到控制台
    outputToConsole() {
        if (!CONFIG.consoleOutput) return;

        console.log(chalk.green('\n=== 热搜数据汇总 ==='));
        console.log(chalk.gray(`获取时间: ${new Date().toLocaleString('zh-CN')}`));
        console.log(chalk.gray(`总耗时: ${Date.now() - this.startTime}ms`));
        console.log(chalk.gray(`成功: ${this.results.filter(r => r.success).length} 个平台`));
        console.log(chalk.gray(`失败: ${this.errors.length} 个平台`));
        console.log('');

        this.results.forEach(result => {
            if (result.success) {
                console.log(chalk.blue(`📱 ${result.name}`));
                if (Array.isArray(result.data)) {
                    result.data.slice(0, 10).forEach((item, index) => {
                        const rank = chalk.yellow(`#${index + 1}`);
                        const title = chalk.white(item.title || item.name || '未知标题');
                        const hot = item.hot ? chalk.gray(`(${item.hot})`) : '';
                        console.log(`  ${rank} ${title} ${hot}`);
                    });
                } else {
                    console.log(chalk.gray('  数据结构需要自定义解析'));
                }
                console.log('');
            } else {
                console.log(chalk.red(`❌ ${result.name}: ${result.error}`));
            }
        });
    }

    // 保存到文件
    saveToFile() {
        if (!CONFIG.saveToFile) return;

        // 确保输出目录存在
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `hotsearch-${timestamp}`;

        // 保存JSON格式
        const jsonData = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            success: this.results.filter(r => r.success).length,
            failed: this.errors.length,
            results: this.results,
            errors: this.errors
        };

        const jsonPath = path.join(CONFIG.outputDir, `${filename}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        console.log(chalk.green(`数据已保存到: ${jsonPath}`));

        // 保存Markdown格式
        if (CONFIG.outputFormat === 'markdown') {
            const mdPath = path.join(CONFIG.outputDir, `${filename}.md`);
            const markdown = this.generateMarkdown(jsonData);
            fs.writeFileSync(mdPath, markdown);
            console.log(chalk.green(`Markdown已保存到: ${mdPath}`));
        }
    }

    // 生成Markdown格式
    generateMarkdown(data) {
        let markdown = `# 热搜数据汇总\n\n`;
        markdown += `- **获取时间**: ${new Date(data.timestamp).toLocaleString('zh-CN')}\n`;
        markdown += `- **总耗时**: ${data.duration}ms\n`;
        markdown += `- **成功平台**: ${data.success} 个\n`;
        markdown += `- **失败平台**: ${data.failed} 个\n\n`;

        data.results.forEach(result => {
            if (result.success) {
                markdown += `## 📱 ${result.name}\n\n`;
                if (Array.isArray(result.data)) {
                    result.data.slice(0, 10).forEach((item, index) => {
                        const title = item.title || item.name || '未知标题';
                        const hot = item.hot ? ` (${item.hot})` : '';
                        markdown += `${index + 1}. **${title}**${hot}\n`;
                    });
                } else {
                    markdown += `数据结构需要自定义解析\n`;
                }
                markdown += '\n';
            } else {
                markdown += `## ❌ ${result.name}\n\n错误: ${result.error}\n\n`;
            }
        });

        return markdown;
    }

    // 主运行函数
    async run() {
        try {
            await this.fetchAllPlatforms();
            this.outputToConsole();
            this.saveToFile();

            // 检查命令行参数 --feishu
            if (process.argv.includes('--feishu')) {
                let msg = '';
                
                // 推送微博热搜前10条
                const weibo = this.results.find(r => r.platform === 'weibo' && r.success);
                if (weibo && Array.isArray(weibo.data)) {
                    msg += '【微博热搜前10】\n';
                    weibo.data.slice(0, 10).forEach((item, idx) => {
                        msg += `${idx + 1}. ${item.title} (${item.hot})\n`;
                    });
                    msg += '\n';
                }
                
                // 推送抖音热搜前10条
                const douyin = this.results.find(r => r.platform === 'douyin' && r.success);
                if (douyin && Array.isArray(douyin.data)) {
                    msg += '【抖音热搜前10】\n';
                    douyin.data.slice(0, 10).forEach((item, idx) => {
                        msg += `${idx + 1}. ${item.title} (${item.hot})\n`;
                    });
                }
                
                if (msg) {
                    await sendToFeishu(msg, 'text');
                } else {
                    await sendToFeishu('获取热搜数据失败或无数据', 'text');
                }
            }

            console.log(chalk.green('\n✅ 热搜数据获取完成！'));
        } catch (error) {
            console.error(chalk.red('❌ 运行失败:', error.message));
            process.exit(1);
        }
    }
}

// 导出类，方便后续扩展
module.exports = {
    HotSearchCrawler,
    PLATFORMS,
    CONFIG
};

// 如果直接运行此文件
if (require.main === module) {
    const crawler = new HotSearchCrawler();
    crawler.run();
}
