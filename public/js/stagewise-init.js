(function() {
  // 仅在开发环境中加载
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 创建script标签动态加载，避免ES模块兼容性问题
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@stagewise/toolbar@latest/dist/index.js';
    script.onload = function() {
      if (window.stagewise && window.stagewise.initToolbar) {
        window.stagewise.initToolbar({
          plugins: []
        });
        console.log('Stagewise开发工具栏已初始化');
      }
    };
    script.onerror = function(err) {
      console.error('Stagewise工具栏加载失败:', err);
    };
    document.body.appendChild(script);
  }
})();
