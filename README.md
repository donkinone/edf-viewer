# EDF文件解析器

基于Java后端（Spring Boot + EDF4j）和Web前端的EDF文件解析应用

## 项目结构

```
project/
├── backend/                    # Java后端
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/edfapp/
│   │       │       ├── controller/     # REST API控制器
│   │       │       ├── service/        # 业务逻辑服务
│   │       │       └── util/           # EDF4j解析工具
│   │       └── resources/
│   │           └── application.properties
│   ├── pom.xml                # Maven配置
│   └── start.sh               # 启动脚本
├── public/                    # Web前端
│   ├── css/
│   │   └── styles.css         # 样式文件
│   ├── js/
│   │   └── script.js          # 前端逻辑
│   └── index.html             # 主页面
├── test.edf                   # 测试EDF文件
└── SR20C_2025-04-10_22-18-01.edf  # 大型测试文件
```

## 技术栈

### 后端
- **Java 11+**
- **Spring Boot 2.7.0** - Web框架
- **EDF4j** - EDF文件解析库
- **Maven** - 项目管理

### 前端
- **HTML5/CSS3/JavaScript**
- **Canvas 2D API** - EEG波形渲染
- **原生JavaScript** - 无框架依赖，全局状态同步
- **响应式设计**

## 安装要求

### Java后端
- Java 11 或更高版本
- Maven 3.6+

### 前端
- 现代浏览器（支持ES6+和Canvas 2D）

## 快速开始

### 1. 启动Java后端

```bash
# 进入后端目录
cd backend

# 使用启动脚本（推荐）
./start.sh

# 或者手动启动
mvn clean compile
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 2. 打开前端页面

直接在浏览器中打开 `public/index.html` 文件，或者使用本地服务器：

```bash
# 使用Python简单服务器
cd public
python3 -m http.server 3000

# 或使用Node.js serve
npx serve public -p 3000
```

前端页面将在 `http://localhost:3000` 可用

### 3. 使用应用

1. 打开前端页面
2. 选择或拖拽EDF文件到上传区域
3. 点击"上传文件"按钮
4. 查看解析结果和EEG波形
5. 使用鼠标与波形进行交互

## API接口

### 上传EDF文件
- **URL**: `POST /api/upload`
- **参数**: `files` (multipart/form-data)
- **限制**: 最多3个文件，每个文件最大100MB
- **返回**: JSON格式的解析结果（包含智能采样信息）

### 健康检查
- **URL**: `GET /api/health`
- **返回**: 服务状态信息

## 配置说明

### 后端配置 (application.properties)
```properties
server.port=8080
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=300MB
```

### 前端配置
前端通过 `script.js` 中的API地址连接后端：
```javascript
xhr.open('POST', 'http://localhost:8080/api/upload');
```

## 许可证

本项目使用 MIT 许可证。EDF4j库也使用MIT许可证。

## 参考资料

- [EDF4j GitHub](https://github.com/MIOB/EDF4j)
- [Spring Boot文档](https://spring.io/projects/spring-boot)
- [EDF格式规范](https://www.edfplus.info/)
- [Canvas 2D API文档](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) 