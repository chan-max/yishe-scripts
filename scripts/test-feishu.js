const axios = require('axios');
const {
    config
} = require('./utils');

async function main() {
    const webhook = config.FEISHU_WEBHOOK_URL;
    const imageUrl = 'https://lf-douyin-pc-web.douyinstatic.com/obj/douyin-pc-web/ies/douyin_web/media/logo-horizontal-small-dark.04fa81ed0b1d6d5e.svg';
    const msg = {
        msg_type: 'post',
        content: {
            post: {
                zh_cn: {
                    title: '图片测试',
                    content: [
                        [{
                                tag: 'text',
                                text: '这是图片：'
                            },
                            {
                                tag: 'img',
                                image_key: '',
                                src: imageUrl
                            }
                        ]
                    ]
                }
            }
        }
    };
    try {
        const res = await axios.post(webhook, msg, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('消息发送成功:', res.data);
    } catch (err) {
        console.error('消息发送失败:', err.message || err);
        if (err.response) {
            console.error('飞书返回:', err.response.data);
        }
    }
}

main();