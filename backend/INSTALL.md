# Java后端安装指南

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

# 编译项目
mvn clean compile

# 启动服务
mvn spring-boot:run
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

## 替代方案

如果无法安装Java/Maven，可以：

1. 使用Docker运行Java应用
2. 使用在线IDE（如GitPod、CodeSandbox）
3. 仅使用前端部分，手动创建测试数据

## 快速测试

如果只想测试前端功能，可以：

1. 直接打开 `public/index.html`
2. 修改 `script.js` 中的API地址为模拟数据
3. 或使用提供的测试数据

## 联系支持

如果遇到安装问题，请：
1. 检查系统版本兼容性
2. 查看错误日志
3. 搜索相关错误信息 