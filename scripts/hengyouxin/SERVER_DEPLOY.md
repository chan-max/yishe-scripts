# 服务器快速部署指南

## 前提条件

确保服务器已安装 Node.js 18+：
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
```

## 快速部署步骤

### 1. 克隆代码
```bash
git clone <your-repo-url> yishe-scripts
cd yishe-scripts/scripts/hengyouxin
```

### 2. 配置认证信息
编辑 `config.json` 文件，填入正确的认证信息：
```json
{
    "auth": {
        "authorization": "your-actual-token-here"
    },
    "api": {
        "baseUrl": "https://your-actual-api-server.com"
    }
}
```

### 3. 一键部署
```bash
./deploy.sh
```

## 部署完成！

部署成功后，脚本将：
- ✅ 自动安装 PM2
- ✅ 创建必要目录
- ✅ 启动定时任务
- ✅ 设置开机自启
- ✅ 每天凌晨2点自动执行

## 常用管理命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs hengyouxin-yesterday

# 重启服务
pm2 restart hengyouxin-yesterday

# 停止服务
pm2 stop hengyouxin-yesterday

# 删除服务
pm2 delete hengyouxin-yesterday
```

## 查看执行结果

- 📱 **飞书通知**: 每次执行完成后会收到通知
- 📄 **日志文件**: 在 `yesterday_logs/` 目录下
- 🔍 **PM2日志**: 使用 `pm2 logs` 查看

## 故障排查

如果部署失败，请检查：
1. Node.js 是否正确安装
2. 网络连接是否正常
3. 配置文件中的认证信息是否正确
4. 服务器时间是否正确

## 更新代码

```bash
# 拉取最新代码
git pull

# 重启服务
pm2 restart hengyouxin-yesterday
``` 