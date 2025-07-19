@echo off
chcp 65001 >nul

echo 🚀 启动易舍爬虫工具...

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
)

REM 启动程序
echo 🎯 启动交互式界面...
node cli.js

pause 