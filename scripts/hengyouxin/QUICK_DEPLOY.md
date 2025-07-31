# 🚀 一键部署到服务器

## 完整流程（只需3步）

### 1. 服务器环境准备
```bash
# 安装 Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 2. 克隆并配置
```bash
# 克隆代码
git clone <your-repo-url> yishe-scripts
cd yishe-scripts/scripts/hengyouxin

# 配置认证信息
nano config.json
# 填入正确的 authorization 和 baseUrl
```

### 3. 一键部署
```bash
# 方式1: 使用JS脚本（推荐）
node start.js

# 方式2: 使用shell脚本
./deploy.sh
```

## 完成！✅

部署成功后：
- 📅 **每天凌晨2点** 自动执行
- 📱 **飞书通知** 执行结果
- 🔄 **开机自启** 自动启动
- 📊 **日志记录** 完整记录

## 管理命令

### 使用JS管理脚本（推荐）
```bash
node manage.js start     # 启动服务
node manage.js status    # 查看状态
node manage.js logs      # 查看日志
node manage.js restart   # 重启服务
node manage.js stop      # 停止服务
node manage.js test      # 启动测试模式（每5分钟）
node manage.js prod      # 启动生产模式（每天凌晨2点）
```

### 使用PM2直接命令
```bash
pm2 status                    # 查看状态
pm2 logs hengyouxin-yesterday # 查看日志
pm2 restart hengyouxin-yesterday # 重启
pm2 stop hengyouxin-yesterday    # 停止
```

## 配置文件示例
```json
{
    "auth": {
        "authorization": "Bearer your-token-here"
    },
    "api": {
        "baseUrl": "https://your-api-server.com"
    }
}
``` 