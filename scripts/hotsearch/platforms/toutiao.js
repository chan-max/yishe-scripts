module.exports = {
    name: '今日头条',
    url: 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc&_signature=_02B4Z6wo00d01uZ8GWAAAIDDz3iHH3KJrErmWB3AANEo4eBSpe-2Jfe9R-.N8hsm2L3TJLUZ0SWUoOwDqNk3r3Kdk4SHDvLuX9UB8I.YXoCkKBDJl9GGqFQRg1CtjnvMjNw0q1W2jBz4V3JF48',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.toutiao.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    },
    parser: function(data) {
        if (!data || !data.data || !Array.isArray(data.data)) return [];

        return data.data.map((item, index) => ({
            title: item.Title || '未知标题',
            hot: item.HotValue || '',
            rank: index + 1,
            tag: item.Label || '',
            cover: item.Image ? item.Image.url : null,
            icon: item.LabelUri ? item.LabelUri.url : null,
            url: item.Url || '',
            clusterId: item.ClusterId || '',
            clusterType: item.ClusterType || '',
            queryWord: item.QueryWord || '',
            interestCategory: item.InterestCategory || []
        }));
    },
    enabled: true
};