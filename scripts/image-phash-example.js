// image-phash-example.js
// 用法：node image-phash-example.js <image_url>
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const imghash = require('imghash');
const readline = require('readline');

async function downloadImage(url, outPath) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(outPath, res.data);
}

async function promptInput(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans); }));
}

async function main() {
  let url = process.argv[2];
  if (!url) {
    url = await promptInput('请输入图片链接: ');
    if (!url) {
      console.log('未输入图片链接，已退出。');
      process.exit(1);
    }
  }
  const ext = path.extname(url).split('?')[0] || '.jpg';
  const tempPath = path.join(__dirname, 'tmp_img' + ext);
  try {
    await downloadImage(url, tempPath);
    // 使用 imghash 计算感知哈希
    const start = Date.now();
    const hash = await imghash.hash(tempPath, 12, 'hex');
    const end = Date.now();
    console.log('图片URL:', url);
    console.log('感知哈希(pHash):', hash);
    console.log('计算哈希耗时:', (end - start), 'ms');
    fs.unlinkSync(tempPath);
  } catch (e) {
    console.error('处理失败:', e.message);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

main(); 