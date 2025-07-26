const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { sendToFeishu } = require('./utils');

// 用户代理配置
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
];

// 随机获取用户代理
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 创建axios实例
function createAxiosInstance() {
    return axios.create({
        timeout: 10000,
        headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    });
}

// 微博热搜
async function getWeiboHotSearch() {
    try {
        console.log(chalk.blue('正在获取微博热搜...'));
        const response = await createAxiosInstance().get('https://s.weibo.com/top/summary');
        const $ = cheerio.load(response.data);
        const hotItems = [];
        
        $('.data tr').each((index, element) => {
            if (index === 0) return; // 跳过表头
            
            const title = $(element).find('td.td-02 a').text().trim();
            const hot = $(element).find('td.td-02 span').text().trim();
            const rank = $(element).find('td.td-01').text().trim();
            
            if (title && rank) {
                hotItems.push({
                    rank: rank,
                    title: title,
                    hot: hot,
                    platform: '微博'
                });
            }
        });
        
        return hotItems.slice(0, 20); // 返回前20条
    } catch (error) {
        console.error(chalk.red('获取微博热搜失败:'), error.message);
        return [];
    }
}

// 知乎热榜
async function getZhihuHotList() {
    try {
        console.log(chalk.blue('正在获取知乎热榜...'));
        const response = await createAxiosInstance().get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true');
        
        if (response.data && response.data.data) {
            return response.data.data.map((item, index) => ({
                rank: index + 1,
                title: item.target.title,
                hot: item.detail_text,
                platform: '知乎'
            })).slice(0, 20);
        }
        return [];
    } catch (error) {
        console.error(chalk.red('获取知乎热榜失败:'), error.message);
        return [];
    }
}

// 百度热搜
async function getBaiduHotSearch() {
    try {
        console.log(chalk.blue('正在获取百度热搜...'));
        const response = await createAxiosInstance().get('https://top.baidu.com/api/board?platform=wise&tab=realtime');
        
        if (response.data && response.data.data && response.data.data.cards) {
            const hotItems = [];
            response.data.data.cards.forEach((card, cardIndex) => {
                if (card.content && card.content.length > 0) {
                    card.content.forEach((item, index) => {
                        hotItems.push({
                            rank: hotItems.length + 1,
                            title: item.word,
                            hot: item.heat || '',
                            platform: '百度'
                        });
                    });
                }
            });
            return hotItems.slice(0, 20);
        }
        return [];
    } catch (error) {
        console.error(chalk.red('获取百度热搜失败:'), error.message);
        return [];
    }
}

// 今日头条热榜
async function getToutiaoHotSearch() {
    try {
        console.log(chalk.blue('正在获取今日头条热榜...'));
        const response = await createAxiosInstance().get('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc');
        
        if (response.data && response.data.data) {
            return response.data.data.map((item, index) => ({
                rank: index + 1,
                title: item.Title,
                hot: item.hotValue || '',
                platform: '今日头条'
            })).slice(0, 20);
        }
        return [];
    } catch (error) {
        console.error(chalk.red('获取今日头条热榜失败:'), error.message);
        return [];
    }
}

// 抖音热点
async function getDouyinHotSearch() {
    try {
        console.log(chalk.blue('正在获取抖音热点...'));
        // 抖音API需要特殊处理，这里使用模拟数据
        // 实际使用时可能需要更复杂的API调用
        return [
            { rank: 1, title: '抖音热点内容1', hot: '1000w', platform: '抖音' },
            { rank: 2, title: '抖音热点内容2', hot: '800w', platform: '抖音' },
            { rank: 3, title: '抖音热点内容3', hot: '600w', platform: '抖音' }
        ];
    } catch (error) {
        console.error(chalk.red('获取抖音热点失败:'), error.message);
        return [];
    }
}

// 小红书热点
async function getXiaohongshuHotSearch() {
    try {
        console.log(chalk.blue('正在获取小红书热点...'));
        // 小红书API需要特殊处理，这里使用模拟数据
        return [
            { rank: 1, title: '小红书热点内容1', hot: '500w', platform: '小红书' },
            { rank: 2, title: '小红书热点内容2', hot: '400w', platform: '小红书' },
            { rank: 3, title: '小红书热点内容3', hot: '300w', platform: '小红书' }
        ];
    } catch (error) {
        console.error(chalk.red('获取小红书热点失败:'), error.message);
        return [];
    }
}

// 快手热点
async function getKuaishouHotSearch() {
    try {
        console.log(chalk.blue('正在获取快手热点...'));
        // 快手API需要特殊处理，这里使用模拟数据
        return [
            { rank: 1, title: '快手热点内容1', hot: '800w', platform: '快手' },
            { rank: 2, title: '快手热点内容2', hot: '600w', platform: '快手' },
            { rank: 3, title: '快手热点内容3', hot: '400w', platform: '快手' }
        ];
    } catch (error) {
        console.error(chalk.red('获取快手热点失败:'), error.message);
        return [];
    }
}

// 格式化输出
function formatHotSearchData(allData) {
    let output = '🔥 实时热搜榜 🔥\n';
    output += `📅 更新时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    
    allData.forEach((platformData, index) => {
        if (platformData.length > 0) {
            output += `📱 ${platformData[0].platform}热搜榜:\n`;
            output += '─'.repeat(30) + '\n';
            
            platformData.forEach(item => {
                const rankEmoji = item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `${item.rank}.`;
                output += `${rankEmoji} ${item.title}`;
                if (item.hot) {
                    output += ` (${item.hot})`;
                }
                output += '\n';
            });
            output += '\n';
        }
    });
    
    return output;
}

// 保存到文件
function saveToFile(data, filename = 'hot-search-data.json') {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const saveData = {
        timestamp: new Date().toISOString(),
        data: data
    };
    
    fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), 'utf8');
    console.log(chalk.green(`数据已保存到: ${filePath}`));
}

// 主函数
async function main() {
    console.log(chalk.yellow('🚀 开始获取各大平台热搜数据...\n'));
    
    try {
        // 并行获取所有平台数据
        const [
            weiboData,
            zhihuData,
            baiduData,
            toutiaoData,
            douyinData,
            xiaohongshuData,
            kuaishouData
        ] = await Promise.allSettled([
            getWeiboHotSearch(),
            getZhihuHotList(),
            getBaiduHotSearch(),
            getToutiaoHotSearch(),
            getDouyinHotSearch(),
            getXiaohongshuHotSearch(),
            getKuaishouHotSearch()
        ]);
        
        // 处理结果
        const allData = [
            weiboData.status === 'fulfilled' ? weiboData.value : [],
            zhihuData.status === 'fulfilled' ? zhihuData.value : [],
            baiduData.status === 'fulfilled' ? baiduData.value : [],
            toutiaoData.status === 'fulfilled' ? toutiaoData.value : [],
            douyinData.status === 'fulfilled' ? douyinData.value : [],
            xiaohongshuData.status === 'fulfilled' ? xiaohongshuData.value : [],
            kuaishouData.status === 'fulfilled' ? kuaishouData.value : []
        ];
        
        // 格式化输出
        const formattedOutput = formatHotSearchData(allData);
        console.log(formattedOutput);
        
        // 保存数据
        saveToFile(allData);
        
        // 发送到飞书（可选）
        const shouldSendToFeishu = process.argv.includes('--feishu');
        if (shouldSendToFeishu) {
            await sendToFeishu(formattedOutput);
        }
        
        console.log(chalk.green('✅ 热搜数据获取完成！'));
        
    } catch (error) {
        console.error(chalk.red('❌ 获取热搜数据失败:'), error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    getWeiboHotSearch,
    getZhihuHotList,
    getBaiduHotSearch,
    getToutiaoHotSearch,
    getDouyinHotSearch,
    getXiaohongshuHotSearch,
    getKuaishouHotSearch,
    formatHotSearchData,
    saveToFile
}; 