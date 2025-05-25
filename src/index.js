const express = require('express');
const path = require('path');
const multer = require('multer');
const edfParser = require('./utils/edfParser');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置EJS模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// 配置静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 配置multer以处理文件上传（使用内存存储）
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制文件大小为100MB
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型，仅允许.edf文件
    if (file.originalname.toLowerCase().endsWith('.edf')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传EDF文件!'), false);
    }
  }
});

// 主页路由
app.get('/', (req, res) => {
  res.render('index');
});

// 文件上传路由
app.post('/upload', upload.array('edfFiles', 3), async (req, res) => {
  try {
    console.log(`收到${req.files.length}个文件上传请求`);
    
    // 处理上传的文件
    const results = [];
    
    for (const file of req.files) {
      console.log(`处理文件: ${file.originalname}, 大小: ${file.size} bytes`);
      
      try {
        // 使用EDF解析器处理文件
        const parsedData = await edfParser.parseEDFFile(file.buffer);
        
        // 将解析结果添加到结果数组
        results.push({
          success: true,
          fileName: file.originalname,
          fileSize: file.size,
          data: parsedData
        });
        
      } catch (error) {
        console.error(`解析文件${file.originalname}时出错:`, error);
        
        // 添加错误信息到结果数组
        results.push({
          success: false,
          fileName: file.originalname,
          fileSize: file.size,
          error: `解析文件时出错: ${error.message || '未知错误'}`
        });
      }
    }
    
    res.json({ results });
    
  } catch (error) {
    console.error('处理上传请求时出错:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器处理文件时出错' 
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  if (err instanceof multer.MulterError) {
    // 处理Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: '文件大小超过限制 (最大100MB)' 
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        error: '文件数量超过限制 (最多3个)' 
      });
    }
  }
  
  res.status(500).json({ 
    success: false, 
    error: err.message || '服务器内部错误' 
  });
});

// 开发环境特定处理
if (process.env.NODE_ENV === 'development') {
  console.log('开发模式下运行');
  // 可以在这里添加开发环境特定的配置
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在: http://localhost:${PORT}`);
}); 