#!/bin/bash

# PM2 定时任务启动脚本
# 用于快速启动和管理 hengyouxin 定时任务

echo "=== hengyouxin PM2 定时任务管理 ==="

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 检查配置文件是否存在
if [ ! -f "hengyouxin-pm2-scheduler.config.js" ]; then
    echo "❌ hengyouxin-pm2-scheduler.config.js 配置文件不存在"
    exit 1
fi

# 检查日志目录是否存在
if [ ! -d "logs" ]; then
    echo "📁 创建日志目录..."
    mkdir -p logs
fi

# 函数：启动生产环境任务
start_production() {
    echo "🚀 启动生产环境定时任务（每天凌晨 2 点执行）..."
    pm2 start hengyouxin-pm2-scheduler.config.js --only hengyouxin-yesterday
    echo "✅ 生产环境任务已启动"
}

# 函数：启动测试环境任务
start_test() {
    echo "🧪 启动测试环境定时任务（每 5 分钟执行一次）..."
    pm2 start hengyouxin-pm2-scheduler.config.js --only hengyouxin-yesterday-test
    echo "✅ 测试环境任务已启动"
}

# 函数：启动所有任务
start_all() {
    echo "🚀 启动所有定时任务..."
    pm2 start hengyouxin-pm2-scheduler.config.js
    echo "✅ 所有任务已启动"
}

# 函数：停止任务
stop_tasks() {
    echo "⏹️  停止所有 hengyouxin 任务..."
    pm2 stop hengyouxin-yesterday hengyouxin-yesterday-test 2>/dev/null || true
    echo "✅ 任务已停止"
}

# 函数：重启任务
restart_tasks() {
    echo "🔄 重启所有 hengyouxin 任务..."
    pm2 restart hengyouxin-yesterday hengyouxin-yesterday-test 2>/dev/null || true
    echo "✅ 任务已重启"
}

# 函数：查看状态
show_status() {
    echo "📊 当前 PM2 任务状态："
    pm2 list
}

# 函数：查看日志
show_logs() {
    echo "📄 查看 hengyouxin-yesterday 日志（最近 50 行）："
    pm2 logs hengyouxin-yesterday --lines 50
}

# 函数：设置开机自启动
setup_autostart() {
    echo "🔧 设置 PM2 开机自启动..."
    pm2 startup
    pm2 save
    echo "✅ 开机自启动已设置"
}

# 函数：显示帮助信息
show_help() {
    echo "使用方法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  start-prod    启动生产环境定时任务（每天凌晨 2 点执行）"
    echo "  start-test    启动测试环境定时任务（每 5 分钟执行一次）"
    echo "  start-all     启动所有定时任务"
    echo "  stop          停止所有 hengyouxin 任务"
    echo "  restart       重启所有 hengyouxin 任务"
    echo "  status        查看任务状态"
    echo "  logs          查看日志"
    echo "  autostart     设置开机自启动"
    echo "  help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start-prod    # 启动生产环境任务"
    echo "  $0 status        # 查看任务状态"
    echo "  $0 logs          # 查看日志"
}

# 主逻辑
case "${1:-help}" in
    "start-prod")
        start_production
        ;;
    "start-test")
        start_test
        ;;
    "start-all")
        start_all
        ;;
    "stop")
        stop_tasks
        ;;
    "restart")
        restart_tasks
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "autostart")
        setup_autostart
        ;;
    "help"|*)
        show_help
        ;;
esac 