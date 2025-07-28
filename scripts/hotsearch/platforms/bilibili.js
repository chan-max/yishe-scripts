module.exports = {
    name: 'Bilibili',
    url: 'https://api.bilibili.com/x/web-interface/wbi/search/square?limit=50',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Accept': 'application/json, text/plain, */*'
    },
    parser: function(data) {
        if (!data || !data.data || !data.data.trending || !Array.isArray(data.data.trending.list)) return [];
        return data.data.trending.list.slice(0, 10).map((item, idx) => ({
            title: item.show_name || item.keyword || '未知',
            hot: item.heat_score || '',
            rank: idx + 1,
            icon: item.icon || '',
            keyword: item.keyword || '',
            url: item.uri || '',
        }));
    },
    enabled: true
};