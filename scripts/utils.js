// utils.js
// 通用工具：飞书消息推送、腾讯云COS上传

const axios = require('axios');
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

// 默认配置
let config = {
    FEISHU_WEBHOOK_URL: 'https://open.feishu.cn/open-apis/bot/v2/hook/4040ef7e-9776-4010-bf53-c30e4451b449',
    COS: {
        SecretId: 'AKIDMdmaMD0uiNwkVH0gTJFKXaXJyV4hHmAL',
        SecretKey: 'HPdigqyzpgTNICCQnK0ZF6zrrpkbL4un',
        Bucket: '1s-1257307499',
        Region: 'ap-beijing',
    }
};

let cos = new COS({
    SecretId: config.COS.SecretId,
    SecretKey: config.COS.SecretKey,
});

/**
 * 设置全局配置
 * @param {object} newConfig
 */
function setConfig(newConfig = {}) {
    if (newConfig.FEISHU_WEBHOOK_URL) config.FEISHU_WEBHOOK_URL = newConfig.FEISHU_WEBHOOK_URL;
    if (newConfig.COS) {
        config.COS = {
            ...config.COS,
            ...newConfig.COS
        };
        cos = new COS({
            SecretId: config.COS.SecretId,
            SecretKey: config.COS.SecretKey,
        });
    }
}

/**
 * 发送文本消息到飞书
 * @param {string} message
 * @param {string} [webhook] 可选，覆盖全局 webhook
 */
async function sendToFeishu(message, webhook) {
    const url = webhook || config.FEISHU_WEBHOOK_URL;
    if (!url) {
        console.log('飞书webhook URL未配置，跳过发送消息');
        return;
    }
    try {
        const response = await axios.post(url, {
            msg_type: 'text',
            content: {
                text: message
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('飞书消息发送成功:', response.data);
    } catch (error) {
        console.error('发送消息到飞书失败:', error.message);
        if (error.response) {
            console.error('飞书返回:', error.response.data);
        }
    }
}

/**
 * 上传本地文件到 COS
 * @param {string} filePath 本地文件路径
 * @param {string} [key] COS存储路径（可选）
 * @param {object} [cosConfig] 可选，覆盖全局 COS 配置
 * @returns {Promise<{url: string, key: string}>}
 */
async function uploadLocalFileToCOS(filePath, key, cosConfig) {
    const fileName = path.basename(filePath);
    const fileKey = key || `${Date.now()}_1s_${fileName}`;
    const fileBuffer = fs.readFileSync(filePath);
    let useCos = cos;
    if (cosConfig) {
        useCos = new COS({
            SecretId: cosConfig.SecretId,
            SecretKey: cosConfig.SecretKey,
        });
    }
    const bucket = (cosConfig && cosConfig.Bucket) || config.COS.Bucket;
    const region = (cosConfig && cosConfig.Region) || config.COS.Region;
    return new Promise((resolve, reject) => {
        useCos.putObject({
            Bucket: bucket,
            Region: region,
            Key: fileKey,
            Body: fileBuffer,
        }, (err, data) => {
            if (err) {
                reject(new Error('上传文件失败: ' + err.message));
            } else {
                resolve({
                    url: `https://${data.Location}`,
                    key: fileKey,
                });
            }
        });
    });
}

module.exports = {
    setConfig,
    sendToFeishu,
    uploadLocalFileToCOS,
    config,
};