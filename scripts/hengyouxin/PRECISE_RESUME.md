# 🎯 精确到素材的断点续传

## 功能概述

现在 `hengyouxin:batch` 支持**精确到单个素材**的断点续传，避免重复处理已上传的素材。

## 断点续传机制

### 1. 进度信息结构

```json
{
  "currentPage": 5,           // 当前页面
  "currentIndex": 3,          // 当前页面中的素材索引（从0开始）
  "totalExtracted": 80,       // 已提取的素材总数
  "uploadedMaterials": [      // 已上传的素材ID列表
    "material_001",
    "http://iuufu-erp-material.oss-cn-beijing.aliyuncs.com/dev/material/1746527196227/SY6.jpg"
  ],
  "startTime": 1704067200000  // 开始时间
}
```

### 2. 断点续传逻辑

**启动时：**
- 读取进度文件
- 从指定页面的指定素材开始
- 跳过已上传的素材

**处理过程中：**
- 每处理完一个素材就保存进度
- 记录已上传的素材ID
- 实时更新当前索引

**中断恢复：**
- 精确恢复到中断的素材
- 不会重复处理已上传的素材

## 使用示例

### 正常启动
```bash
npm run hengyouxin:batch
# 从第1页第1个素材开始
```

### 中断后恢复
```bash
# 如果程序在第5页第4个素材中断
npm run hengyouxin:batch
# 会从第5页第4个素材继续，跳过已上传的素材
```

### 查看进度
```bash
npm run hengyouxin:log
# 显示当前进度和已处理素材
```

## 优势

### 1. 精确恢复
- ✅ 精确到单个素材级别
- ✅ 不会重复处理已上传的素材
- ✅ 避免重复上传到COS和服务器

### 2. 实时保存
- ✅ 每处理一个素材就保存进度
- ✅ 即使程序崩溃也不会丢失进度
- ✅ 支持任意中断点恢复

### 3. 智能跳过
- ✅ 自动识别已上传的素材
- ✅ 跳过重复处理
- ✅ 节省时间和资源

## 进度文件管理

### 进度文件位置
- `progress.json` - 当前进度信息
- `crawl_log.json` - 所有处理过的素材日志

### 自动清理
- 爬取完成后自动删除 `progress.json`
- 保留 `crawl_log.json` 作为历史记录

## 测试功能

### 创建测试进度
```bash
node test-resume.js create
# 创建模拟的进度文件进行测试
```

### 检查进度文件
```bash
node test-resume.js check
# 查看当前进度文件状态
```

### 清理测试文件
```bash
node test-resume.js cleanup
# 删除测试文件
```

## 注意事项

1. **素材ID识别**：使用素材的 `id` 或 `ossObjectName` 作为唯一标识
2. **内存使用**：已上传素材列表会保存在内存中，大量素材时注意内存使用
3. **文件大小**：进度文件会随着已上传素材增加而变大
4. **兼容性**：新版本兼容旧版本的进度文件格式

## 故障排查

### 进度文件损坏
```bash
# 删除进度文件重新开始
rm progress.json
npm run hengyouxin:batch
```

### 内存不足
```bash
# 清理已上传列表（谨慎使用）
# 编辑 progress.json，清空 uploadedMaterials 数组
```

### 重复处理
```bash
# 检查进度文件是否正确保存
node test-resume.js check
``` 