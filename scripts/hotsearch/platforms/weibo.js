module.exports = {
    name: '微博',
    url: 'https://weibo.com/ajax/side/hotSearch',
    headers: {},
    parser: function(data) {
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
};