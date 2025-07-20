# 自动化部署配置指南

## 概述

这个GitHub Actions工作流会在每次代码提交时自动将代码部署到Windows服务器。

## 功能特性

- ✅ 自动触发：推送到main/master/develop分支时自动部署
- ✅ 手动触发：可以在GitHub Actions页面手动触发部署
- ✅ 文件过滤：自动排除不需要的文件（node_modules、.git等）
- ✅ 版本备份：自动备份当前版本，支持回滚
- ✅ 多种部署方式：支持SSH和PowerShell两种方式
- ✅ 部署通知：部署完成后显示详细信息

## 配置步骤

### 1. 在GitHub仓库中设置Secrets

进入你的GitHub仓库 → Settings → Secrets and variables → Actions，添加以下Secrets：

#### 必需配置
```
WINDOWS_SERVER_HOST          # Windows服务器IP地址或域名
WINDOWS_SERVER_USER          # 服务器用户名
WINDOWS_SERVER_PATH          # 服务器上的目标路径，如：C:\deploy\yishe-scripts
```

#### 必需配置
```
WINDOWS_SERVER_PASSWORD      # 服务器密码
WINDOWS_SERVER_PORT          # SSH端口（可选，默认22）
```

### 2. Windows服务器准备

1. 在Windows服务器上安装OpenSSH Server：
   ```powershell
   # 以管理员身份运行PowerShell
   Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
   Start-Service sshd
   Set-Service -Name sshd -StartupType 'Automatic'
   ```

2. 启用PowerShell远程执行：
   ```powershell
   # 以管理员身份运行PowerShell
   Set-ExecutionPolicy RemoteSigned
   Enable-PSRemoting -Force
   ```

3. 配置防火墙允许SSH连接（端口22）

### 3. 创建目标目录

在Windows服务器上创建部署目标目录：
```powershell
mkdir C:\deploy\yishe-scripts
```

## 部署流程

1. **触发条件**：
   - 推送到main/master/develop分支
   - 手动在GitHub Actions页面触发

2. **部署步骤**：
   - 检出最新代码
   - 创建部署包（排除不需要的文件）
   - 压缩部署包
   - 上传到Windows服务器
   - 备份当前版本
   - 解压新版本
   - 清理旧备份

3. **文件过滤**：
   自动排除以下文件和目录：
   - `node_modules`
   - `.git`
   - `.github`
   - `screenshots`
   - `temp`
   - `db_backups`
   - `*.log`
   - `.DS_Store`

## 目录结构

部署后的目录结构：
```
C:\deploy\yishe-scripts\
├── current\              # 当前版本
│   ├── scripts\
│   ├── package.json
│   ├── README.md
│   └── deploy-info.txt   # 部署信息
├── backup-20241201-143022\  # 备份版本
├── backup-20241201-142015\
└── ...
```

## 故障排除

### 常见问题

1. **SSH连接失败**
   - 检查服务器IP和端口是否正确
   - 确认SSH服务已启动
   - 验证用户名和密码是否正确

2. **权限问题**
   - 确保目标目录有写入权限
   - 检查用户权限

3. **文件传输失败**
   - 检查网络连接
   - 确认目标路径存在
   - 验证磁盘空间

### 查看日志

1. 在GitHub仓库页面点击 "Actions" 标签
2. 找到对应的部署工作流
3. 点击查看详细日志

### 手动部署

如果自动部署失败，可以手动触发：
1. 进入GitHub仓库的Actions页面
2. 选择 "部署到Windows服务器" 工作流
3. 点击 "Run workflow" 按钮

## 安全建议

1. **使用强密码**：确保服务器密码足够复杂
2. **限制访问**：只允许必要的IP地址访问服务器
3. **定期更新**：保持服务器系统和软件更新
4. **监控日志**：定期检查部署日志和服务器日志

## 自定义配置

### 修改触发分支

编辑 `.github/workflows/deploy-windows.yml` 文件中的 `branches` 配置：
```yaml
on:
  push:
    branches: [ main, master, develop, your-branch ]
```

### 修改文件过滤

在部署脚本中修改 `rsync` 命令的 `--exclude` 参数：
```bash
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='your-custom-exclude' \
          ./ deploy-package/
```

### 修改备份数量

在部署脚本中修改保留的备份数量：
```bash
# 保留最近10个备份
ls -dt backup-* | tail -n +11 | xargs -r rm -rf
```

## 联系支持

如果遇到问题，请：
1. 查看GitHub Actions日志
2. 检查服务器配置
3. 参考本文档的故障排除部分 