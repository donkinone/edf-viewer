#!/bin/bash

echo "正在启动EDF解析后端服务..."

# 添加Homebrew路径到PATH
export PATH="/opt/homebrew/bin:$PATH"

# 检查Java是否安装
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java，请先安装Java 11或更高版本"
    exit 1
fi

# 检查Maven是否安装
if ! command -v mvn &> /dev/null; then
    echo "错误: 未找到Maven，请先安装Maven"
    echo "提示: 如果使用Homebrew安装，请运行: brew install maven"
    exit 1
fi

# 显示版本信息
echo "Java版本:"
java -version
echo ""
echo "Maven版本:"
mvn -version
echo ""

# 编译并运行Spring Boot应用
echo "正在编译项目..."
mvn clean compile

if [ $? -eq 0 ]; then
    echo "编译成功，正在启动服务..."
    echo "服务将在 http://localhost:8080 启动"
    echo "健康检查: http://localhost:8080/api/health"
    echo "按 Ctrl+C 停止服务"
    echo ""
    mvn spring-boot:run
else
    echo "编译失败，请检查错误信息"
    exit 1
fi 