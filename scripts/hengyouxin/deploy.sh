#!/bin/bash
###
 # @Author: chan-max jackieontheway666@gmail.com
 # @Date: 2025-07-31 23:00:50
 # @LastEditors: chan-max jackieontheway666@gmail.com
 # @LastEditTime: 2025-07-31 23:13:07
 # @FilePath: /yishe-scripts/scripts/hengyouxin/deploy.sh
 # @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
### 

# 恒优信脚本一键部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署恒优信脚本..."

# 检查是否在正确的目录
if [ ! -f "index.js" ]; then
    echo "❌ 错误: 请在 hengyouxin 目录下运行此脚本"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 请先安装 Node.js"
    echo "安装命令: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "然后运行: nvm install 18 && nvm use 18"
    exit 1
fi

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "📦 正在安装 PM2..."
    npm install -g pm2
fi

# 检查配置文件是否存在
if [ ! -f "config.json" ]; then
    echo "📝 创建配置文件..."
    cat > config.json << EOF
{
    "auth": {
        "authorization": "your-authorization-token-here"
    },
    "api": {
        "baseUrl": "https://your-api-server.com"
    }
}
EOF
    echo "⚠️  请编辑 config.json 文件，填入正确的认证信息"
    echo "然后重新运行此脚本"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p logs
mkdir -p yesterday_logs

# 给脚本添加执行权限
chmod +x start-pm2.sh

# 安装依赖（如果 package.json 存在）
if [ -f "../../package.json" ]; then
    echo "📦 检查项目依赖..."
    echo "⚠️  如果遇到权限问题，请手动运行: npm install"
    # 注释掉自动安装，避免权限问题
    # cd ../..
    # npm install
    # cd scripts/hengyouxin
fi

# 启动 PM2 服务
echo "🚀 启动 PM2 服务..."
./start-pm2.sh start-prod

# 设置开机自启
echo "🔧 设置开机自启..."
pm2 save

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs hengyouxin-yesterday"
echo "  重启服务: pm2 restart hengyouxin-yesterday"
echo "  停止服务: pm2 stop hengyouxin-yesterday"
echo ""
echo "📅 脚本将在每天凌晨2点自动执行"
echo "📱 执行结果会通过飞书通知"
echo ""
echo "🔍 查看当前状态:"
pm2 status 