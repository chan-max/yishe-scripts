# 恒优信素材爬取脚本

## 🔄 自动Token刷新机制

### 概述
脚本已实现自动刷新访问令牌的功能，当检测到401未授权错误时，会自动使用refreshToken刷新访问令牌，无需手动更新认证信息。

### 功能特性

#### 1. 自动Token刷新
- 检测到401错误时自动尝试刷新token
- 支持API响应数据和HTTP状态码双重检测
- 刷新成功后自动重试请求
- 新的token自动保存到配置文件

#### 2. 初始Token配置
- 预设初始accessToken和refreshToken
- 支持从config.json文件读取token配置
- 自动保存刷新后的新token

#### 3. 刷新Token API
- 使用POST方法请求刷新接口
- 接口地址：`/api/admin-api/system/auth/refresh-token`
- 返回新的accessToken和refreshToken

### 刷新流程
```
1. 检测到401错误
2. 检查是否有refreshToken
3. 调用刷新接口获取新token
4. 更新配置中的token
5. 保存新token到配置文件
6. 重新尝试原始请求
7. 如果刷新失败，提示手动更新
```

## 🚨 401错误处理机制

### 概述
脚本已完善401未授权错误的处理机制，支持检测API响应数据中的401错误，当遇到认证错误时会自动尝试刷新token，如果刷新失败则退出程序并提供详细的更新指导。

### 功能特性

#### 1. 自动认证检查
- 脚本启动前会自动检查认证信息是否有效
- 如果认证无效，会立即退出并提示更新

#### 2. 401错误检测（双重检测）
- **API响应数据检测**：检查响应数据中的 `code`、`status`、`error` 字段
- **HTTP状态码检测**：检查HTTP响应状态码（备用机制）
- 提供详细的错误信息和更新指导
- 自动退出程序避免无效请求

#### 3. 批量爬取保护
- 批量爬取时遇到401错误会保存当前进度
- 下次运行时可从断点继续
- 避免重复爬取已处理的数据

#### 4. 详细错误提示
```
🔄 === 认证信息已过期 ===
💡 需要更新认证信息，请按以下步骤操作：
   1. 在浏览器中重新登录网站
   2. 打开开发者工具 (F12)
   3. 在 Network 标签页中找到API请求
   4. 复制 Authorization 和 Cookie 头的值
   5. 使用以下命令更新认证信息：
      npm run hengyouxin:update
   6. 或者直接编辑 config.json 文件

📋 当前认证信息：
   Authorization: Bearer 9246e01d22f2418aa1fe25d264c1f80f...
   Cookie: _ga=GA1.1.884180217.1752652946; _ga_MRBW1BE7X4=GS2.1...

📄 API响应数据：
   {"code": 401, "message": "认证失败"}

❌ 程序将退出，请更新认证信息后重新运行
```

### 使用方法

#### 基本爬取
```bash
npm run hengyouxin
```

#### 批量爬取
```bash
npm run hengyouxin:batch
```

#### 测试连接
```bash
npm run hengyouxin:test
```

#### 更新认证信息
```bash
npm run hengyouxin:update
```

#### 测试401错误处理
```bash
npm run hengyouxin:test-401
```

#### 模拟401错误测试
```bash
npm run hengyouxin:test-401-mock
```

#### 测试自动刷新token功能
```bash
npm run hengyouxin:test-token-refresh
```

#### 爬取前一天的素材
```bash
npm run hengyouxin:yesterday
```

#### 按时间范围爬取素材
```bash
# 使用时间戳格式
npm run hengyouxin:timerange <startTime> <endTime> [description]

# 示例：爬取2024年1月1日的素材
npm run hengyouxin:timerange 1704067200000 1704153599999 "2024年1月1日"
```

## 📅 时间范围爬取功能

### 功能概述
脚本新增了按时间范围爬取素材的功能，支持指定开始和结束时间戳，可以精确爬取特定时间段内的所有素材。

### 功能特性

#### 1. 前一天素材爬取
- 自动计算前一天的开始时间（00:00:00）和结束时间（23:59:59）
- 使用时间戳格式确保精确的时间范围
- 自动处理分页，爬取所有符合条件的素材

#### 2. 自定义时间范围爬取
- 支持自定义开始和结束时间戳
- 时间戳格式：毫秒级时间戳
- 可选的描述参数，便于识别不同的爬取任务

#### 3. 时间范围信息记录
- 在日志中记录时间范围信息
- 包含开始时间、结束时间和描述
- 便于后续分析和追踪

### 时间戳转换工具

#### JavaScript 时间戳转换
```javascript
// 获取指定日期的时间戳
const date = new Date('2024-01-01');
const timestamp = date.getTime(); // 1704067200000

// 获取前一天的开始时间戳
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(0, 0, 0, 0);
const startTime = yesterday.getTime();

// 获取前一天的结束时间戳
const endTime = new Date(yesterday);
endTime.setHours(23, 59, 59, 999);
const endTimestamp = endTime.getTime();
```

#### 在线时间戳转换工具
- [Unix Timestamp Converter](https://www.unixtimestamp.com/)
- [Epoch Converter](https://www.epochconverter.com/)

### 认证信息更新

#### 方法1：交互式更新
```bash
npm run hengyouxin:update
```

#### 方法2：手动更新
1. 在浏览器中重新登录网站
2. 打开开发者工具 (F12)
3. 在 Network 标签页中找到API请求
4. 复制 Authorization 和 Cookie 头的值
5. 使用 `updateAuth()` 函数更新

#### 方法3：编辑配置文件
直接编辑 `config.json` 文件中的认证信息

### 错误处理流程

1. **启动检查**：脚本启动时自动检查认证信息
2. **API请求**：每次请求时检测401错误
3. **响应数据检测**：检查API响应数据中的401错误（code/status/error字段）
4. **HTTP状态码检测**：检查HTTP响应状态码（备用机制）
5. **错误处理**：遇到401错误时立即退出
6. **进度保存**：批量爬取时保存当前进度
7. **用户指导**：提供详细的更新指导

### 401错误检测机制

脚本支持检测以下格式的401错误：

#### API响应数据格式
```json
{
  "code": 401,
  "message": "认证失败",
  "data": null
}
```

```json
{
  "status": 401,
  "message": "认证失败"
}
```

```json
{
  "error": 401,
  "message": "认证失败"
}
```

#### 检测逻辑
```javascript
// 检查响应数据中的401错误
if (responseData && (
    responseData.code === 401 || 
    responseData.status === 401 || 
    responseData.error === 401
)) {
    // 触发401错误处理
}
```

### 配置文件

认证信息存储在 `config.json` 文件中：
```json
{
  "auth": {
    "authorization": "Bearer YOUR_TOKEN",
    "cookie": "YOUR_COOKIE_STRING"
  },
  "headers": {
    // 其他请求头配置
  }
}
```

### 注意事项

1. **认证信息有效期**：Bearer token 和 Cookie 都有有效期，需要定期更新
2. **错误恢复**：遇到401错误后，更新认证信息即可继续使用
3. **进度保护**：批量爬取时会自动保存进度，支持断点续传
4. **测试建议**：建议先运行测试命令确认认证信息有效

### 更新日志

- **2025-01-31**：完善401错误处理机制
  - 添加自动认证检查
  - 添加详细的错误提示
  - 添加批量爬取进度保护
  - 添加测试脚本
- **2025-01-31**：新增时间范围爬取功能
  - 添加前一天素材爬取功能
  - 添加自定义时间范围爬取功能
  - 支持时间戳格式参数
  - 在日志中记录时间范围信息 