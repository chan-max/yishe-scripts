# 恒优信素材爬取脚本

这个脚本用于爬取恒优信平台的素材图片，支持断点续传和日志记录。

## 功能特性

- ✅ 支持分页爬取素材列表
- ✅ 打印API返回的完整数据
- ✅ **断点续传** - 支持中断后继续执行
- ✅ **日志记录** - 记录所有爬取的素材信息
- ✅ **进度保存** - 自动保存爬取进度
- ✅ **批量爬取** - 支持爬取所有页面

## 使用方法

### 1. 爬取单页数据

```bash
npm run hengyouxin
```

### 2. 批量爬取所有页面（支持断点续传）

```bash
npm run hengyouxin:batch
```

### 3. 查看爬取日志

```bash
npm run hengyouxin:log
```

### 4. 在代码中使用

```javascript
const { fetchMaterialList, batchCrawl, viewLog } = require('./scripts/hengyouxin/index.js');

// 获取单页数据
const result = await fetchMaterialList(1, 20);

// 批量爬取（支持断点续传）
await batchCrawl();

// 查看日志
viewLog();
```

## 文件说明

### 生成的文件

- `crawl_log.json` - 爬取日志文件，包含所有素材信息
- `progress.json` - 进度文件，记录当前爬取进度（完成后自动删除）

### 日志文件格式

```json
{
  "materials": [
    {
      "index": 1,
      "imageFormat": "jpg",
      "ossObjectName": "https://...",
      "page": 1,
      "crawlTime": "2025-01-31T..."
    }
  ],
  "totalCount": 100,
  "lastUpdate": "2025-01-31T..."
}
```

## 断点续传功能

### 工作原理

1. **进度保存** - 每爬取完一页就保存进度到 `progress.json`
2. **中断恢复** - 重新运行时会从上次中断的地方继续
3. **日志累积** - 新的素材会追加到现有的日志文件中
4. **自动清理** - 爬取完成后自动删除进度文件

### 使用场景

- **网络中断** - 网络断开后重新运行即可继续
- **程序崩溃** - 程序异常退出后重新运行即可继续
- **手动停止** - Ctrl+C 停止后重新运行即可继续

## 输出内容

脚本会打印以下内容：
- API返回的完整JSON数据
- 提取的有用信息（imageFormat 和 ossObjectName）
- 爬取进度和统计信息
- 日志文件位置

## 注意事项

1. **认证信息** - 脚本中包含了Bearer token和Cookie信息，这些可能会过期，需要定期更新
2. **请求频率** - 脚本内置了2秒延迟，避免请求过快被限制
3. **存储空间** - 日志文件会随着爬取进度增长，注意磁盘空间
4. **数据格式** - 根据实际API响应格式，可能需要调整数据处理逻辑

## 文件结构

```
scripts/hengyouxin/
├── index.js              # 主脚本文件
├── config.json           # 配置文件（认证信息）
├── README.md             # 说明文档
├── crawl_log.json        # 爬取日志（自动生成）
└── progress.json         # 进度文件（自动生成，完成后删除）
```

## 认证信息管理

### 易变的认证信息

以下认证信息会定期过期，需要更新：

1. **Authorization** - Bearer token
2. **Cookie** - 会话Cookie

### 更新认证信息

#### 方法1：使用更新函数
```javascript
const { updateAuth } = require('./scripts/hengyouxin/index.js');

// 更新认证信息
updateAuth(
    'Bearer YOUR_NEW_TOKEN',
    'YOUR_NEW_COOKIE_STRING'
);
```

#### 方法2：直接编辑配置文件
编辑 `config.json` 文件中的 `auth` 部分：
```json
{
  "auth": {
    "authorization": "Bearer YOUR_NEW_TOKEN",
    "cookie": "YOUR_NEW_COOKIE_STRING"
  }
}
```

### 获取新的认证信息

1. 在浏览器中重新登录网站
2. 打开开发者工具 (F12)
3. 在 Network 标签页中找到API请求
4. 复制 `Authorization` 和 `Cookie` 头的值
5. 使用上述方法更新认证信息

### 变化对比

**旧认证信息：**
- Authorization: `Bearer f371a314422941149fc4e5c6ab5b1576`
- Cookie: `...Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753937977...`

**新认证信息：**
- Authorization: `Bearer 9509c0fdf01c4eb19e0285b919190f87`
- Cookie: `...Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753941047...`

主要变化：
- Bearer token 完全更换
- Cookie 中的时间戳更新

## 📋 快速更新参考

### 当前认证信息（2025-01-31）
```javascript
// Authorization
'Bearer 9509c0fdf01c4eb19e0285b919190f87'

// Cookie
'_ga=GA1.1.884180217.1752652946; _ga_MRBW1BE7X4=GS2.1.s1752656046$o2$g0$t1752656046$j60$l0$h0; Hm_lvt_a1ff8825baa73c3a78eb96aa40325abc=1751534604,1753927964,1753937977; HMACCOUNT=0C80E26C5FDA120B; Hm_lpvt_a1ff8825baa73c3a78eb96aa40325abc=1753941047'
```

### 下次更新时只需要替换：
1. **Authorization** - 整个Bearer token
2. **Cookie** - 整个Cookie字符串

### 其他标头保持不变：
- Accept, Accept-Encoding, Accept-Language
- Cache-Control, Connection, Content-Type
- Host, Origin, Pragma, Referer
- Sec-Ch-Ua, Sec-Ch-Ua-Mobile, Sec-Ch-Ua-Platform
- Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site
- Tenant-Id, User-Agent 