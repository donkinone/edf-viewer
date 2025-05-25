#!/bin/bash

echo "🚀 启动EDF文件查看器前端服务..."

# 检查是否安装了Python3
if command -v python3 &> /dev/null; then
    echo "✅ 使用Python3启动HTTP服务器..."
    cd public
    echo "📂 服务目录: $(pwd)"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📝 测试页面: http://localhost:3000/test-drag.html"
    echo ""
    echo "💡 提示: 请确保Java后端已在8080端口启动"
    echo "   后端启动命令: cd backend && ./start.sh"
    echo ""
    python3 -m http.server 3000
elif command -v python &> /dev/null; then
    echo "✅ 使用Python启动HTTP服务器..."
    cd public
    echo "📂 服务目录: $(pwd)"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📝 测试页面: http://localhost:3000/test-drag.html"
    echo ""
    echo "💡 提示: 请确保Java后端已在8080端口启动"
    echo "   后端启动命令: cd backend && ./start.sh"
    echo ""
    python -m SimpleHTTPServer 3000
elif command -v npx &> /dev/null; then
    echo "✅ 使用npx serve启动HTTP服务器..."
    echo "📂 服务目录: public"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📝 测试页面: http://localhost:3000/test-drag.html"
    echo ""
    echo "💡 提示: 请确保Java后端已在8080端口启动"
    echo "   后端启动命令: cd backend && ./start.sh"
    echo ""
    npx serve public -p 3000
else
    echo "❌ 错误: 未找到Python或Node.js"
    echo "请安装以下任一工具："
    echo "  - Python 3: https://www.python.org/"
    echo "  - Node.js: https://nodejs.org/"
    echo ""
    echo "或者直接在浏览器中打开 public/index.html 文件"
    exit 1
fi 