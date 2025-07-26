/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-26 19:56:54
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-27 05:18:07
 * @FilePath: /yishe-scripts/scripts/hotsearch/platforms/zhihu.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
module.exports = {
    name: '知乎',
    url: 'https://www.zhihu.com/api/v4/search/recommend_query/v2',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.zhihu.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
    },
    parser: function(data) {
        if (!data || !data.recommend_queries || !Array.isArray(data.recommend_queries.queries)) return [];
        return data.recommend_queries.queries.map((item, idx) => ({
            title: item.query_display || item.query || '未知',
            hot: item.label || '',
            rank: idx + 1,
            icon: item.image_item && item.image_item.icon_url ? item.image_item.icon_url : '',
            type: item.type || '',
            uuid: item.uuid || '',
        }));
    },
    enabled: true
};