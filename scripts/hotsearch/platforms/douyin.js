/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-26 18:11:24
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-28 08:26:59
 * @FilePath: /yishe-scripts/scripts/hotsearch/platforms/douyin.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
module.exports = {
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
    parser: function(data) {
        if (!data || !data.data) return [];
        const wordList = Array.isArray(data.data.word_list) ? data.data.word_list : [];
        const trendingList = Array.isArray(data.data.trending_list) ? data.data.trending_list : [];
        const allList = wordList.concat(trendingList);
        return allList.slice(0, 10).map(item => ({
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
            word_cover: item.word_cover && item.word_cover.url_list ? item.word_cover.url_list[0] : ''
        }));
    },
    enabled: true
};