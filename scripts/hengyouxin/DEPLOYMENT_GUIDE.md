# 恒优信脚本 Linux 服务器部署指南

## 1. 服务器环境准备

### 1.1 安装 Node.js
```bash
# 使用 nvm 安装 Node.js (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 或者使用包管理器
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm
```

### 1.2 安装 PM2
```bash
npm install -g pm2
```

### 1.3 验证安装
```bash
node --version
npm --version
pm2 --version
```

## 2. 项目部署

### 2.1 上传项目文件
```bash
# 方式1: 使用 scp 上传
scp -r /path/to/yishe-scripts user@your-server:/home/user/

# 方式2: 使用 git clone
git clone <your-repo-url> /home/user/yishe-scripts
```

### 2.2 安装依赖
```bash
cd /home/user/yishe-scripts
npm install
```

### 2.3 配置环境变量
```bash
# 创建环境配置文件
cp scripts/hengyouxin/config.json scripts/hengyouxin/config.json.backup
# 编辑配置文件，填入正确的服务器地址和认证信息
nano scripts/hengyouxin/config.json
```

## 3. PM2 配置和启动

### 3.1 检查配置文件
确保 `hengyouxin-pm2-scheduler.config.js` 配置正确：
- 生产环境：每天凌晨2点执行
- 测试环境：每5分钟执行（可选）

### 3.2 启动 PM2 服务
```bash
cd /home/user/yishe-scripts/scripts/hengyouxin

# 启动生产环境
./start-pm2.sh start-prod

# 或者启动测试环境
./start-pm2.sh start-test
```

### 3.3 设置开机自启
```bash
# 保存当前 PM2 进程列表
pm2 save

# 生成开机自启脚本
pm2 startup

# 按照提示执行生成的命令
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u user --hp /home/user
```

## 4. 监控和管理

### 4.1 查看状态
```bash
# 查看所有进程状态
pm2 status

# 查看特定进程状态
pm2 status hengyouxin-yesterday

# 查看日志
pm2 logs hengyouxin-yesterday
```

### 4.2 管理命令
```bash
# 重启服务
pm2 restart hengyouxin-yesterday

# 停止服务
pm2 stop hengyouxin-yesterday

# 删除服务
pm2 delete hengyouxin-yesterday

# 重新加载配置
pm2 reload hengyouxin-yesterday
```

## 5. 日志管理

### 5.1 查看日志
```bash
# 实时查看日志
pm2 logs hengyouxin-yesterday --lines 100

# 查看错误日志
pm2 logs hengyouxin-yesterday --err

# 清空日志
pm2 flush hengyouxin-yesterday
```

### 5.2 日志轮转
```bash
# 安装 PM2 日志轮转模块
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 6. 故障排查

### 6.1 常见问题
1. **权限问题**: 确保脚本有执行权限
   ```bash
   chmod +x start-pm2.sh
   ```

2. **路径问题**: 确保所有路径都是绝对路径或正确的相对路径

3. **环境变量**: 确保配置文件中的环境变量正确

4. **网络问题**: 确保服务器能访问外部API

### 6.2 调试模式
```bash
# 直接运行脚本进行调试
node index.js yesterday

# 查看详细错误信息
pm2 logs hengyouxin-yesterday --lines 200
```

## 7. 备份和恢复

### 7.1 备份配置
```bash
# 备份 PM2 配置
pm2 save
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup

# 备份项目文件
tar -czf hengyouxin-backup-$(date +%Y%m%d).tar.gz /home/user/yishe-scripts
```

### 7.2 恢复配置
```bash
# 恢复 PM2 配置
pm2 resurrect

# 恢复项目文件
tar -xzf hengyouxin-backup-20250101.tar.gz
```

## 8. 安全建议

1. **防火墙配置**: 只开放必要的端口
2. **用户权限**: 使用非root用户运行服务
3. **定期更新**: 定期更新Node.js和PM2
4. **监控告警**: 配置日志监控和告警
5. **备份策略**: 定期备份配置和数据

## 9. 性能优化

1. **内存监控**: 设置合理的内存限制
2. **CPU监控**: 监控CPU使用率
3. **日志优化**: 定期清理和压缩日志
4. **网络优化**: 优化网络请求频率 