const fs = require('fs');
const path = require('path');

module.exports = {
    name: '快手',
    url: 'https://www.kuaishou.com/?isHome=1',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.kuaishou.com/'
    },
    parser: function(html) {
        console.log('=== 快手HTML内容调试 ===');
        console.log('HTML长度:', html.length);

        // 检查是否包含VisionHotRankItem
        const hasVisionHotRankItem = html.includes('VisionHotRankItem');
        console.log('是否包含VisionHotRankItem:', hasVisionHotRankItem);

        if (hasVisionHotRankItem) {
            const matches = html.match(/"VisionHotRankItem:[^"]+"/g);
            console.log('找到的VisionHotRankItem数量:', matches ? matches.length : 0);
            if (matches && matches.length > 0) {
                console.log('前3个标题:', matches.slice(0, 3).map(m => m.replace('"VisionHotRankItem:', '').replace('"', '')));
            }
        }

        // 提取所有 VisionHotRankItem: 后的 json 对象
        const items = [];

        // 使用更简单的正则，先找到所有VisionHotRankItem的位置
        const itemRegex = /"VisionHotRankItem:([^"]+)":\s*({[^}]*"rank":[^}]*"id":[^}]*"name":[^}]*"hotValue":[^}]*})/g;
        let match;
        let matchCount = 0;

        while ((match = itemRegex.exec(html))) {
            matchCount++;
            console.log(`\n=== 匹配项 ${matchCount} ===`);
            console.log('标题:', match[1]);
            console.log('JSON长度:', match[2].length);

            try {
                const jsonStr = match[2];
                // 处理转义字符和属性名
                const cleanJson = jsonStr
                    .replace(/\\u002F/g, '/')
                    .replace(/([a-zA-Z_][a-zA-Z0-9_]*):/g, '"$1":')
                    .replace(/,\s*}/g, '}'); // 移除末尾多余的逗号

                const obj = JSON.parse(cleanJson);
                console.log('解析成功，rank:', obj.rank, 'hotValue:', obj.hotValue);

                items.push({
                    title: obj.name || obj.id,
                    hot: obj.hotValue,
                    rank: obj.rank + 1,
                    tag: null,
                    cover: null,
                    icon: null,
                });
            } catch (e) {
                console.log('JSON解析失败:', e.message);
                // 尝试更简单的解析方式
                try {
                    const rankMatch = match[2].match(/"rank":\s*(\d+)/);
                    const nameMatch = match[2].match(/"name":\s*"([^"]+)"/);
                    const hotMatch = match[2].match(/"hotValue":\s*"([^"]+)"/);

                    if (rankMatch && nameMatch) {
                        items.push({
                            title: nameMatch[1],
                            hot: hotMatch ? hotMatch[1] : null,
                            rank: parseInt(rankMatch[1]) + 1,
                            tag: null,
                            cover: null,
                            icon: null,
                        });
                        console.log('简单解析成功');
                    }
                } catch (e2) {
                    console.log('简单解析也失败:', e2.message);
                }
            }
        }

        console.log(`\n=== 解析结果 ===`);
        console.log('总匹配数:', matchCount);
        console.log('成功解析数:', items.length);
        if (items.length > 0) {
            console.log('解析出的热搜项:', items.slice(0, 3));
        }

        // 按rank排序
        items.sort((a, b) => a.rank - b.rank);
        return items;
    },
    enabled: true
};