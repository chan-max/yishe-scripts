# 🔥 热搜数据收集脚本

一个用于获取各大媒体和电商平台热搜数据的Node.js项目，支持微博、抖音、小红书、快手、淘宝、京东等平台。

## ✨ 功能特性

- 🔍 **多平台支持**: 微博、抖音、小红书、快手、淘宝、京东
- 💾 **数据存储**: 自动保存热搜数据到JSON文件
- 🛡️ **错误处理**: 完善的错误处理和重试机制
- 📊 **数据格式化**: 统一的数据格式，包含排名、标题、热度等信息
- 🌐 **真实API**: 使用各平台的真实API接口

## 📦 安装依赖

```bash
npm install
```

## 🚀 快速开始

### 命令行使用

```bash
# 获取所有平台热搜
node scripts/hot-search.js
```

## 📊 数据格式

每个平台返回的数据格式如下：

```json
{
  "platform": "微博",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": [
    {
      "rank": 1,
      "title": "热搜标题",
      "hot": "热度值",
      "category": "分类",
      "url": "搜索链接"
    }
  ]
}
```

## 🛠️ 项目结构

```
yishe-scripts/
├── package.json              # 项目配置
├── README.md                 # 项目说明
├── scripts/
│   └── hot-search.js         # 热搜获取脚本
└── data/                     # 数据存储目录（自动创建）
    └── *.json               # 热搜数据文件
```

## 🔧 配置说明

### 支持的平台

| 平台 | 键值 | 状态 | 说明 |
|------|------|------|------|
| 微博 | weibo | ✅ | 实时热搜榜 |
| 抖音 | douyin | ✅ | 热门搜索 |
| 小红书 | xiaohongshu | ✅ | 热门话题 |
| 快手 | kuaishou | ✅ | 热门内容 |
| 淘宝 | taobao | ⚠️ | 模拟数据 |
| 京东 | jd | ⚠️ | 模拟数据 |

> ⚠️ 注意：淘宝和京东由于反爬机制，目前使用模拟数据

## 📝 使用示例

### JavaScript代码示例

```javascript
const HotSearchCollector = require('./scripts/hot-search');

async function getHotSearch() {
    const collector = new HotSearchCollector();
    
    // 获取所有平台热搜
    const allResults = await collector.getAllHotSearch();
    console.log('所有平台热搜:', allResults);
    
    // 保存数据
    await collector.saveToFile(allResults, 'my-hot-search.json');
    
    // 打印摘要
    collector.printSummary();
}
```

## ⚠️ 注意事项

1. **反爬机制**: 部分平台有反爬虫机制，可能需要配置代理或Cookie
2. **API限制**: 某些平台的API可能有访问频率限制
3. **数据准确性**: 模拟数据仅供参考，实际数据以平台官方为准
4. **网络环境**: 确保网络环境能够访问目标平台

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！