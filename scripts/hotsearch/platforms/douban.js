module.exports = {
    name: '豆瓣',
    url: 'https://m.douban.com/rexxar/api/v2/search/hots?ck=',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://m.douban.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
    },
    parser: function(data) {
        if (!data || !data.gallery_topics || !Array.isArray(data.gallery_topics)) return [];
        return data.gallery_topics.map((item, idx) => ({
            title: item.title || item.name || '未知',
            hot: item.read_count ? `${(item.read_count / 10000).toFixed(1)}万` : '',
            rank: idx + 1,
            subtitle: item.card_subtitle || '',
            type: item.type || '',
            url: item.url || '',
            id: item.id || '',
        }));
    },
    enabled: true
};