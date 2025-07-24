g# Google Arts & Culture 批量下载工具

这个工具可以批量下载 Google Arts & Culture 上的高清艺术作品图片。

## 文件说明

- `dezoomify-rs-mac`: 核心下载工具（Mac 版本）
- `batch-download.js`: Node.js 批量下载脚本
- `urls.txt`: URL 列表文件
- `README.md`: 使用说明

## 使用方法

### 方法1: 直接运行批量下载脚本

```bash
# 确保 Node.js 已安装
node batch-download.js
```

### 方法2: 自定义 URL 列表

1. 编辑 `urls.txt` 文件，添加你想下载的 URL
2. 运行脚本：

```bash
node batch-download.js
```

### 方法3: 在其他脚本中使用

```javascript
const BatchDownloader = require('./batch-download.js');

async function downloadArtworks() {
  const downloader = new BatchDownloader();
  
  const urls = [
    'https://artsandculture.google.com/asset/sunflowers-文森特·梵高/hwEGmsM-FoHAwA',
    'https://artsandculture.google.com/asset/the-starry-night/bgEuwDxel93-Uw'
  ];
  
  // 下载最高清版本 (级别4)，并发数为1
  await downloader.downloadBatch(urls, 4, 1);
}

downloadArtworks();
```

## 参数说明

- **zoomLevel**: 缩放级别 (0-4)
  - 0: 最小 (约 250px)
  - 1: 小 (约 500px)
  - 2: 中 (约 1000px)
  - 3: 大 (约 2000px)
  - 4: 最大 (约 4000px+) **推荐**

- **concurrent**: 并发下载数量
  - 建议设为 1，避免对服务器造成过大压力

## 功能特点

✅ **批量下载**: 支持一次下载多个艺术作品
✅ **自动化**: 无需手动输入，脚本自动处理所有交互
✅ **进度显示**: 实时显示下载进度和状态
✅ **错误处理**: 自动重试和错误记录
✅ **结果保存**: 下载结果保存为 JSON 文件
✅ **超时保护**: 防止单个下载任务卡死

## 注意事项

1. 确保有足够的磁盘空间（高清图片通常 5-20MB）
2. 网络连接稳定，下载大文件需要时间
3. 遵守 Google Arts & Culture 的使用条款
4. 建议设置适当的下载间隔，避免频繁请求

## 输出文件

- 图片文件：保存在当前目录，文件名格式为 `作者, 作品名; 年代.jpg`
- 结果日志：`download-results-[时间戳].json`

## 故障排除

如果遇到 "dezoomer error"，可能的原因：
1. URL 格式不正确
2. 网络连接问题
3. 该作品不支持高清下载

建议先用单个 URL 测试，确认工具正常工作后再批量下载。