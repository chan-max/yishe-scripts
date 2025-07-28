const cheerio = require('cheerio');

module.exports = {
    name: '酷狗音乐',
    url: 'https://www.kugou.com/yy/html/rank.html',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.kugou.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    },
    parser: function(html) {
        try {
            const $ = cheerio.load(html);
            const songs = [];

            // 解析酷狗飙升榜的歌曲列表
            $('.pc_temp_songlist li').each((index, element) => {
                const $li = $(element);

                // 获取排名
                const rankText = $li.find('.pc_temp_num strong, .pc_temp_num').first().text().trim();
                const rank = parseInt(rankText) || index + 1;

                // 获取歌曲名称和歌手
                const songNameElement = $li.find('.pc_temp_songname');
                const fullTitle = songNameElement.text().trim();

                // 分离歌曲名和歌手名
                let songName = fullTitle;
                let artist = '';

                if (fullTitle.includes(' - ')) {
                    const parts = fullTitle.split(' - ');
                    songName = parts[0].trim();
                    artist = parts[1].trim();
                }

                // 获取时长
                const duration = $li.find('.pc_temp_time').text().trim();

                // 获取歌曲链接
                const songUrl = songNameElement.attr('href') || '';

                // 检查是否为新入榜
                const isNew = $li.find('.pc_temp_icon_new').length > 0;

                if (songName) {
                    songs.push({
                        title: `${songName} - ${artist}`,
                        songName: songName,
                        artist: artist,
                        rank: rank,
                        duration: duration,
                        url: songUrl,
                        isNew: isNew,
                        hot: isNew ? '新入榜' : ''
                    });
                }
            });

            // 只返回前10条
            return songs.slice(0, 10);
        } catch (error) {
            console.error('酷狗音乐解析失败:', error.message);
            return [];
        }
    },
    enabled: true
};