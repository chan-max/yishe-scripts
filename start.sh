#!/bin/bash

# 易舍爬虫工具启动脚本

echo "🚀 启动易舍爬虫工具..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 启动程序
echo "🎯 启动交互式界面..."
node cli.js 