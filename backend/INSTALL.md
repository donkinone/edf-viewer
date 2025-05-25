# 后端安装指南

## 系统要求

- macOS 10.14+ / Windows 10+ / Linux
- Java 11 或更高版本
- Maven 3.6+

## 安装步骤

### 1. 安装Java

#### macOS (推荐使用Homebrew)
```bash
# 安装Homebrew (如果未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Java 11
brew install openjdk@17

# 设置环境变量
echo 'export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### 或者下载Oracle JDK
1. 访问 https://www.oracle.com/java/technologies/downloads/
2. 下载Java 11或更高版本
3. 按照安装向导完成安装

### 2. 安装Maven

#### macOS (使用Homebrew)
```bash
brew install maven
```

#### 或者手动安装
1. 访问 https://maven.apache.org/download.cgi
2. 下载最新版本的Maven
3. 解压到合适的目录
4. 设置环境变量：
   ```bash
   export MAVEN_HOME=/path/to/maven
   export PATH=$MAVEN_HOME/bin:$PATH
   ```

### 3. 验证安装

```bash
# 检查Java版本
java -version

# 检查Maven版本
mvn -version
```

### 4. 启动后端服务

```bash
# 进入backend目录
cd backend

# 运行启动脚本
./start.sh
```

## 故障排除

### 常见问题

1. **"command not found: java"**
   - Java未正确安装或环境变量未设置
   - 重新安装Java并设置JAVA_HOME

2. **"command not found: mvn"**
   - Maven未正确安装或环境变量未设置
   - 重新安装Maven并设置PATH

3. **编译错误**
   - 检查Java版本是否为11+
   - 确保网络连接正常（Maven需要下载依赖）