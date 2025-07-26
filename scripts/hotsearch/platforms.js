/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-26 18:10:00
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-26 18:11:27
 * @FilePath: /yishe-scripts/scripts/hotsearch/platforms.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 各平台热搜配置与解析
const weibo = require('./platforms/weibo');
const douyin = require('./platforms/douyin');
const ks = require('./platforms/ks');
const toutiao = require('./platforms/toutiao');

const PLATFORMS = {
    weibo,
    douyin,
    ks,
    toutiao,
    zhihu: {
        name: '知乎',
        url: '',
        headers: {},
        parser: null,
        enabled: false
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

module.exports = PLATFORMS;