/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-19 15:24:51
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-19 16:02:41
 * @FilePath: /design-server/Users/jackie/workspace/yishe-scripts/clean-scripts.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  console.log('scripts 目录不存在，无需清理。');
  process.exit(0);
}

const files = fs.readdirSync(scriptsDir);
let deleted = 0;
files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(scriptsDir, file);
    fs.unlinkSync(filePath);
    console.log('已删除:', filePath);
    deleted++;
  }
});
if (deleted === 0) {
  console.log('没有需要删除的 JS 脚本。');
} else {
  console.log(`共删除 ${deleted} 个脚本。`);
} 