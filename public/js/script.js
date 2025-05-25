document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const uploadForm = document.getElementById('uploadForm');
  const uploadButton = document.getElementById('uploadButton');
  const clearButton = document.getElementById('clearButton');
  const selectedFilesList = document.getElementById('selectedFilesList');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const progressContainer = document.querySelector('.upload-progress-container');
  const resultsSection = document.getElementById('resultsSection');
  const resultsContainer = document.getElementById('resultsContainer');

  const selectedFilesContainer = document.getElementById('selectedFiles');

  // 存储选择的文件
  let selectedFiles = [];

  // 文件大小格式化函数
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * 格式化持续时间
   */
  const formatDuration = (seconds) => {
    if (seconds === 0) return '0秒';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // 添加文件到选择列表
  const addFilesToList = (files) => {
    // 检查是否已达到最大文件数量
    if (selectedFiles.length >= 3) {
      displayError('最多只能上传3个文件');
      return;
    }

    // 过滤出新的有效文件
    const newFiles = Array.from(files).filter(file => {
      // 检查文件是否为EDF格式
      if (!file.name.toLowerCase().endsWith('.edf')) {
        displayError(`文件 ${file.name} 不是有效的EDF文件`);
        return false;
      }

      // 检查文件大小
      if (file.size > 100 * 1024 * 1024) {
        displayError(`文件 ${file.name} 超过最大大小限制(100MB)`);
        return false;
      }

      // 检查是否已存在
      if (selectedFiles.some(existingFile => existingFile.name === file.name)) {
        displayError(`文件 ${file.name} 已经添加过了`);
        return false;
      }

      return true;
    });

    // 限制总文件数量
    const availableSlots = 3 - selectedFiles.length;
    const filesToAdd = newFiles.slice(0, availableSlots);

    if (filesToAdd.length === 0) return;

    // 添加文件到已选择列表
    selectedFiles = [...selectedFiles, ...filesToAdd];
    updateFilesList();
    updateButtons();
  };

  // 更新文件列表显示
  const updateFilesList = () => {
    selectedFilesList.innerHTML = '';
    
    if (selectedFiles.length > 0) {
      selectedFilesContainer.style.display = 'block';
    } else {
      selectedFilesContainer.style.display = 'none';
      return;
    }
    
    selectedFiles.forEach((file, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'selected-file-item';
      
      listItem.innerHTML = `
        <div class="selected-file-info">
          <div class="file-icon">📄</div>
          <div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
          </div>
        </div>
        <button class="remove-file" data-index="${index}">&times;</button>
      `;
      
      selectedFilesList.appendChild(listItem);
    });
    
    // 为移除按钮添加点击事件
    document.querySelectorAll('.remove-file').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        selectedFiles.splice(index, 1);
        updateFilesList();
        updateButtons();
      });
    });
  };

  // 清空已选文件
  const clearSelectedFiles = () => {
    selectedFiles = [];
    updateFilesList();
    updateButtons();
  };

  // 更新按钮状态
  const updateButtons = () => {
    uploadButton.disabled = selectedFiles.length === 0;
    clearButton.disabled = selectedFiles.length === 0;
  };

  // 显示错误信息
  const displayError = (message) => {
    console.error('错误:', message);
    alert(message); // 使用简单的alert替代模态框
  };

  // 上传文件函数
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      displayError('请先选择文件');
      return;
    }
    
    try {
      // 显示进度条
      progressContainer.style.display = 'block';
      uploadButton.disabled = true;
      clearButton.disabled = true;
      
      // 创建FormData对象
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file); // 改为 'files' 以匹配Java后端
      });
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:8080/api/upload'); // 修改为Java后端API地址
      
      // 监听上传进度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          progressBar.style.width = `${percentCompleted}%`;
          progressText.textContent = `上传中... ${percentCompleted}%`;
        }
      };
      
      // 设置完成回调
      xhr.onload = function() {
        progressBar.style.width = '100%';
        
        if (xhr.status >= 200 && xhr.status < 300) {
          progressText.textContent = '处理完成!';
          
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('服务器响应:', response); // 添加调试日志
            
            // Java后端返回包含success字段的对象
            if (response.success === true && response.data && Array.isArray(response.data)) {
              displayResults(response.data);
              clearSelectedFiles();
            } else if (response.success === false) {
              displayError(response.message || '处理失败');
            } else if (Array.isArray(response)) {
              // 如果直接返回数组（备用处理）
              displayResults(response);
              clearSelectedFiles();
            } else {
              console.error('意外的响应格式:', response);
              displayError('服务器返回了意外的数据格式');
            }
          } catch (error) {
            console.error('解析响应时出错:', error);
            console.error('原始响应:', xhr.responseText);
            displayError('解析服务器响应时出错: ' + error.message);
          }
        } else {
          let errorMsg = '上传失败';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.message || errorMsg;
          } catch (e) {
            errorMsg = `HTTP ${xhr.status}: ${xhr.statusText}`;
          }
          displayError(errorMsg);
        }
        
        // 重置上传按钮状态
        uploadButton.disabled = false;
        clearButton.disabled = false;
        
        // 延迟后隐藏进度条
        setTimeout(() => {
          progressContainer.style.display = 'none';
          progressBar.style.width = '0';
          progressText.textContent = '';
        }, 2000);
      };
      
      // 设置错误回调
      xhr.onerror = function() {
        displayError('网络错误，请检查Java后端服务是否启动');
        uploadButton.disabled = false;
        clearButton.disabled = false;
        progressContainer.style.display = 'none';
        progressBar.style.width = '0';
        progressText.textContent = '';
      };
      
      // 发送请求
      xhr.send(formData);
      
    } catch (error) {
      console.error('上传过程中出错:', error);
      displayError('上传过程中出错: ' + error.message);
      uploadButton.disabled = false;
      clearButton.disabled = false;
      progressContainer.style.display = 'none';
    }
  };

  /**
   * 显示分析结果
   */
  const displayResults = (results) => {
    resultsSection.style.display = 'block';
    resultsContainer.innerHTML = ''; // 清空之前的结果
    
    results.forEach((fileData, fileIndex) => {
      // Java后端直接返回文件数据，不需要检查success字段
      const resultCard = document.createElement('div');
      resultCard.className = 'result-card';
      
      const infoPanel = document.createElement('div');
      infoPanel.className = 'info-panel';
      
      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      fileInfo.innerHTML = `<h3>${fileData.fileName}</h3><p>文件大小: ${formatFileSize(fileData.fileSize)}</p>`;
      infoPanel.appendChild(fileInfo);
      
      const basicInfoTable = document.createElement('table');
      basicInfoTable.className = 'info-table';
      basicInfoTable.innerHTML = `
        <tr><th>患者ID:</th><td>${fileData.patientId || 'N/A'}</td></tr>
        <tr><th>记录ID:</th><td>${fileData.recordId || 'N/A'}</td></tr>
        <tr><th>开始日期:</th><td>${fileData.startDate || 'N/A'}</td></tr>
        <tr><th>开始时间:</th><td>${fileData.startTime || 'N/A'}</td></tr>
        <tr><th>持续时间:</th><td>${fileData.duration ? fileData.duration + '秒' : 'N/A'}</td></tr>
        <tr><th>总持续时间:</th><td>${fileData.totalDuration ? formatDuration(fileData.totalDuration) : 'N/A'}</td></tr>
        <tr><th>记录数:</th><td>${fileData.numberOfRecords || 'N/A'}</td></tr>
        <tr><th>通道数量:</th><td>${fileData.channelCount}</td></tr>
      `;
      infoPanel.appendChild(basicInfoTable);
      
      resultCard.appendChild(infoPanel);
      
      const chartPanel = document.createElement('div');
      chartPanel.className = 'chart-panel';
      
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartPanel.appendChild(chartContainer);
      
      resultCard.appendChild(chartPanel);
      resultsContainer.appendChild(resultCard);
      
      // 存储文件数据供后续使用
      if (!window.fileDataStore) window.fileDataStore = [];
      window.fileDataStore[fileIndex] = fileData;
      
      // 显示所有通道的波形图
      if (fileData.channels && fileData.channels.length > 0) {
        showEEGChannels(fileData, chartContainer);
      }
    });
    
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  };
  
  /**
   * 显示EEG通道波形图（只显示前10分钟数据）
   */
  const showEEGChannels = (data, chartContainer) => {
    chartContainer.innerHTML = '';
    
    if (!data.channels || data.channels.length === 0) {
      chartContainer.innerHTML = '<div class="no-data-message">没有可显示的通道数据</div>';
      return;
    }
    
    // 创建波形显示容器
    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'eeg-waveform-container';
    chartContainer.appendChild(waveformContainer);
    
    // 获取有效的通道数据
    const validChannels = data.channels.filter(channel => 
      channel.allDataPoints && channel.allDataPoints.length > 0
    );
    
    // 检查是否有采样信息
    const hasSamplingInfo = validChannels.length > 0 && validChannels[0].samplingStep;
    if (hasSamplingInfo) {
      console.log('检测到采样数据，采样步长:', validChannels[0].samplingStep);
    }
    
    if (validChannels.length === 0) {
      chartContainer.innerHTML = '<div class="no-data-message">没有有效的波形数据</div>';
      return;
    }
    
    // 从第一个通道获取信号信息
    const firstChannel = validChannels[0];
    const signalStartTime = firstChannel.signalStartTime || 0;
    const totalDuration = firstChannel.signalDuration || 0;
    const totalDataPoints = firstChannel.allDataPoints.length;
    const sampleRate = firstChannel.sampleRate || 256;
    const allTimeStamps = firstChannel.allTimeStamps || [];
    
    // 计算初始最小视图的数据范围
    const initialWindowSize = Math.max(50, Math.floor(totalDataPoints * 0.005)); // 最小0.5%的数据
    
    // 设置初始索引范围
    let startIndex = 0;
    let endIndex = Math.min(startIndex + initialWindowSize - 1, totalDataPoints - 1);
    
    // 确保索引有效
    endIndex = Math.max(startIndex, Math.min(endIndex, totalDataPoints - 1));
    const displayDataPoints = endIndex - startIndex + 1;
    
    // 计算实际显示的时间范围
    const actualStartTime = allTimeStamps.length > 0 ? allTimeStamps[startIndex] : signalStartTime;
    const actualEndTime = allTimeStamps.length > 0 ? allTimeStamps[endIndex] : signalStartTime + (displayDataPoints / sampleRate);
    const actualDisplayDuration = actualEndTime - actualStartTime;
    const actualDisplayMinutes = actualDisplayDuration / 60;
    
    console.log('EEG显示参数（初始最小视图）:', {
      fileName: data.fileName,
      totalDataPoints,
      sampledDataPoints: firstChannel.sampledDataPoints || totalDataPoints,
      samplingStep: firstChannel.samplingStep || 1,
      totalDurationMinutes: (totalDuration / 60).toFixed(2),
      displayDurationMinutes: actualDisplayMinutes.toFixed(2),
      startIndex,
      endIndex,
      displayDataPoints,
      initialWindowSize,
      sampleRate: `${sampleRate}Hz`,
      actualStartTime: formatTimeFromSeconds(actualStartTime),
      actualEndTime: formatTimeFromSeconds(actualEndTime),
      channelCount: validChannels.length
    });
    


    // 添加通道信息表格
    const channelInfoSection = document.createElement('div');
    channelInfoSection.className = 'channel-info-section';
    channelInfoSection.innerHTML = `
      <h4 style="margin: 20px 0 10px 0; color: #333;">📋 通道详细信息</h4>
    `;
    
    const channelTable = document.createElement('table');
    channelTable.className = 'channel-table';
    channelTable.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>通道标签</th>
          <th>物理维度</th>
          <th>采样率</th>
          <th>数据点数</th>
          <th>最小值</th>
          <th>最大值</th>
          <th>平均值</th>
        </tr>
      </thead>
      <tbody>
        ${validChannels.map((channel, index) => {
          const dataPoints = channel.allDataPoints || [];
          const minValue = dataPoints.length > 0 ? Math.min(...dataPoints).toFixed(2) : 'N/A';
          const maxValue = dataPoints.length > 0 ? Math.max(...dataPoints).toFixed(2) : 'N/A';
          const avgValue = dataPoints.length > 0 ? (dataPoints.reduce((sum, val) => sum + val, 0) / dataPoints.length).toFixed(2) : 'N/A';
          
          // 显示采样信息
          const totalPoints = channel.totalDataPoints || dataPoints.length;
          const sampledPoints = channel.sampledDataPoints || dataPoints.length;
          const samplingStep = channel.samplingStep || 1;
          const dataPointsDisplay = samplingStep > 1 ? 
            `${sampledPoints.toLocaleString()} / ${totalPoints.toLocaleString()} (1:${samplingStep})` : 
            totalPoints.toLocaleString();
          
          return `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${channel.label || `通道${index + 1}`}</strong></td>
              <td>${channel.physicalDimension || 'μV'}</td>
              <td>${channel.sampleRate || sampleRate}Hz</td>
              <td>${dataPointsDisplay}</td>
              <td>${minValue}</td>
              <td>${maxValue}</td>
              <td>${avgValue}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;
    
    channelInfoSection.appendChild(channelTable);
    waveformContainer.appendChild(channelInfoSection);

    // 添加交互提示信息
    const interactionHints = document.createElement('div');
    interactionHints.className = 'interaction-hints';
    // 构建采样提示
    const samplingHint = firstChannel.samplingStep > 1 ? 
      `<li><strong>数据采样：</strong>为避免传输过大数据，已对原始数据进行 1:${firstChannel.samplingStep} 采样，保留关键特征</li>` : '';
    
    interactionHints.innerHTML = `
      <strong>💡 交互操作指南：</strong>
      <ul>
        <li><strong>拖动平移：</strong>在任意波形图上按住鼠标左键并拖动，所有通道同步左右移动查看不同时间段</li>
        <li><strong>滚轮缩放：</strong>在任意波形图上滚动鼠标滚轮，所有通道同步放大或缩小时间窗口（以鼠标位置为中心）</li>
        <li><strong>双击重置：</strong>双击任意波形图，所有通道同步重置到初始的最小视图</li>
        ${samplingHint}
      </ul>
    `;
    waveformContainer.appendChild(interactionHints);
    
    // 创建全局同步状态管理器
    const syncState = {
      windowStartIndex: startIndex,
      windowSize: initialWindowSize,
      maxStartIndex: Math.max(0, totalDataPoints - initialWindowSize),
      isDragging: false,
      lastX: 0,
      canvases: []
    };
    
    // 为每个通道创建波形显示
    validChannels.forEach((channel, index) => {
      const channelContainer = document.createElement('div');
      channelContainer.className = 'eeg-channel-container';
      
      // 通道标签
      const channelLabel = document.createElement('div');
      channelLabel.className = 'eeg-channel-label';
      channelLabel.textContent = channel.label;
      channelContainer.appendChild(channelLabel);
      
      // 波形画布
      const canvas = document.createElement('canvas');
      canvas.className = 'eeg-channel-canvas';
      canvas.width = 1200;
      canvas.height = 120;
      channelContainer.appendChild(canvas);
      
      waveformContainer.appendChild(channelContainer);
      
      // 将canvas添加到同步状态管理器
      syncState.canvases.push({canvas, channel});
      
      // 绘制初始最小视图的波形数据
      drawFirst10MinutesEEGWaveform(canvas, channel, startIndex, endIndex, actualStartTime, actualEndTime, syncState);
    });
    
    // 初始化全局同步交互
    initGlobalSyncInteraction(syncState, validChannels);
  };
  
  /**
   * 将秒数转换为时间格式 HH:MM:SS
   */
  const formatTimeFromSeconds = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * 绘制前10分钟的EEG通道波形 - 增强版本，支持拖动平移和全局同步
   */
  const drawFirst10MinutesEEGWaveform = (canvas, channelData, startIndex, endIndex, startTime, endTime, syncState = null) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const allDataPoints = channelData.allDataPoints;
    const allTimeStamps = channelData.allTimeStamps;
    
    if (!allDataPoints || allDataPoints.length === 0) return;
    
    // 使用同步状态或传入的参数
    const actualStartIndex = syncState ? syncState.windowStartIndex : startIndex;
    const actualWindowSize = syncState ? syncState.windowSize : (endIndex - startIndex + 1);
    const actualEndIndex = Math.min(actualStartIndex + actualWindowSize - 1, allDataPoints.length - 1);
    
    // 提取当前窗口的数据
    const displayDataPoints = allDataPoints.slice(actualStartIndex, actualEndIndex + 1);
    const displayTimeStamps = allTimeStamps.slice(actualStartIndex, actualEndIndex + 1);
    
    // 计算实际时间范围
    const actualStartTime = displayTimeStamps[0] || startTime;
    const actualEndTime = displayTimeStamps[displayTimeStamps.length - 1] || endTime;
    
    console.log('绘制EEG波形 (支持拖动):', {
      channelLabel: channelData.label,
      totalDataPoints: allDataPoints.length,
      displayDataPoints: displayDataPoints.length,
      windowStartIndex: actualStartIndex,
      windowEndIndex: actualEndIndex,
      timeRange: `${formatTimeFromSeconds(actualStartTime)} - ${formatTimeFromSeconds(actualEndTime)}`,
      canvasWidth: width,
      dataPointsPerPixel: (displayDataPoints.length / width).toFixed(2)
    });
    
    // 计算缩放参数
    const minValue = Math.min(...displayDataPoints);
    const maxValue = Math.max(...displayDataPoints);
    const range = maxValue - minValue;
    const padding = range * 0.1 || 10;
    
    const yMin = minValue - padding;
    const yMax = maxValue + padding;
    const yRange = yMax - yMin || 20;
    
    const xScale = width / displayDataPoints.length;
    const yScale = height / yRange;
    
    // 绘制网格线
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    
    // 垂直网格线（时间）
    for (let i = 0; i <= 10; i++) {
      const x = (width * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 水平网格线（幅度）
    for (let i = 0; i <= 4; i++) {
      const y = (height * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // 绘制中心线
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // 绘制波形 - 优化绘制大量数据点
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    if (displayDataPoints.length > width * 2) {
      // 如果数据点太多，进行视觉优化采样
      const step = Math.ceil(displayDataPoints.length / (width * 2));
      for (let i = 0; i < displayDataPoints.length; i += step) {
        const x = i * xScale;
        const y = height - ((displayDataPoints[i] - yMin) * yScale);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      // 正常绘制所有数据点
      displayDataPoints.forEach((value, index) => {
        const x = index * xScale;
        const y = height - ((value - yMin) * yScale);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
    }
    
    ctx.stroke();
    
    // 绘制幅度标签
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${maxValue.toFixed(0)}${channelData.physicalDimension || 'μV'}`, 5, 12);
    ctx.fillText(`${minValue.toFixed(0)}${channelData.physicalDimension || 'μV'}`, 5, height - 5);
    
    // 绘制数据点统计信息
    ctx.fillStyle = '#999';
    ctx.font = '8px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${displayDataPoints.length.toLocaleString()} / ${allDataPoints.length.toLocaleString()} 点`, 5, height - 25);
    
    // 绘制时间信息
    ctx.textAlign = 'right';
    const duration = ((actualEndTime - actualStartTime) / 60).toFixed(2);
    ctx.fillText(`${formatTimeFromSeconds(actualStartTime)} - ${formatTimeFromSeconds(actualEndTime)} (${duration}分钟)`, width - 5, 12);
    
    // 绘制滚动条指示器（仅在最后一个通道显示）
    if (syncState && syncState.canvases && canvas === syncState.canvases[syncState.canvases.length - 1].canvas) {
      drawScrollIndicator(ctx, width, height, syncState, allDataPoints.length);
    }
  };

  /**
   * 初始化全局同步交互功能
   */
  const initGlobalSyncInteraction = (syncState, validChannels) => {
    if (!syncState.canvases || syncState.canvases.length === 0) return;
    
    const allDataPoints = validChannels[0].allDataPoints;
    if (!allDataPoints || allDataPoints.length === 0) return;
    
    // 创建缩放级别指示器（只创建一个）
    const firstCanvas = syncState.canvases[0].canvas;
    const zoomIndicator = document.createElement('div');
    zoomIndicator.className = 'zoom-level-indicator';
    zoomIndicator.style.position = 'absolute';
    zoomIndicator.style.top = '10px';
    zoomIndicator.style.right = '10px';
    
    const canvasContainer = firstCanvas.parentElement.parentElement; // 获取waveform容器
    canvasContainer.style.position = 'relative';
    canvasContainer.appendChild(zoomIndicator);
    
    // 更新缩放指示器
    const updateZoomIndicator = () => {
      const zoomPercentage = ((syncState.windowSize / allDataPoints.length) * 100).toFixed(1);
      const timeSpan = (syncState.windowSize / (validChannels[0].sampleRate || 256) / 60).toFixed(1);
      zoomIndicator.textContent = `缩放: ${zoomPercentage}% (${timeSpan}分钟)`;
      zoomIndicator.classList.add('visible');
      
      // 2秒后隐藏指示器
      setTimeout(() => {
        zoomIndicator.classList.remove('visible');
      }, 2000);
    };
    
    // 初始显示缩放级别
    updateZoomIndicator();
    
    // 重绘所有通道
    const redrawAllChannels = () => {
      syncState.canvases.forEach(({canvas, channel}) => {
        const endIndex = Math.min(syncState.windowStartIndex + syncState.windowSize - 1, allDataPoints.length - 1);
        const startTime = channel.allTimeStamps[syncState.windowStartIndex] || 0;
        const endTime = channel.allTimeStamps[endIndex] || 0;
        
        drawFirst10MinutesEEGWaveform(canvas, channel, syncState.windowStartIndex, endIndex, startTime, endTime, syncState);
      });
    };
    
    // 为所有canvas添加事件监听器
    syncState.canvases.forEach(({canvas, channel}) => {
      // 设置光标样式
      canvas.style.cursor = 'grab';
      
      // 鼠标按下事件
      canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        syncState.isDragging = true;
        syncState.lastX = e.clientX - rect.left;
        
        // 设置所有canvas的光标
        syncState.canvases.forEach(({canvas: c}) => {
          c.style.cursor = 'grabbing';
        });
        
        e.preventDefault();
      });
      
      // 鼠标移动事件
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        
        if (syncState.isDragging) {
          const deltaX = currentX - syncState.lastX;
          
          // 计算需要移动的数据点数量
          const sensitivity = 0.2; // 拖动敏感度
          const deltaDataPoints = Math.round(-deltaX / sensitivity);
          
          if (Math.abs(deltaDataPoints) >= 1) {
            const newStartIndex = Math.max(0, 
              Math.min(syncState.windowStartIndex + deltaDataPoints, 
                      syncState.maxStartIndex));
            
            if (newStartIndex !== syncState.windowStartIndex) {
              syncState.windowStartIndex = newStartIndex;
              syncState.lastX = currentX;
              
              // 重绘所有通道
              redrawAllChannels();
            }
          }
        } else {
          // 鼠标悬停时显示手型光标
          canvas.style.cursor = 'grab';
        }
      });
      
      // 鼠标抬起事件
      canvas.addEventListener('mouseup', () => {
        syncState.isDragging = false;
        
        // 恢复所有canvas的光标
        syncState.canvases.forEach(({canvas: c}) => {
          c.style.cursor = 'grab';
        });
      });
      
      // 鼠标离开canvas事件
      canvas.addEventListener('mouseleave', () => {
        syncState.isDragging = false;
        
        // 恢复所有canvas的光标
        syncState.canvases.forEach(({canvas: c}) => {
          c.style.cursor = 'default';
        });
      });
      
      // 鼠标滚轮事件 - 缩放功能
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
        const oldWindowSize = syncState.windowSize;
        const newWindowSize = Math.round(oldWindowSize * zoomFactor);
        
        // 限制窗口大小
        const minWindowSize = Math.max(50, Math.floor(allDataPoints.length * 0.005)); // 最小0.5%
        const maxWindowSize = allDataPoints.length;
        
        if (newWindowSize >= minWindowSize && newWindowSize <= maxWindowSize) {
          // 计算鼠标位置相对于canvas的比例
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseRatio = Math.max(0, Math.min(1, mouseX / canvas.width));
          
          // 计算当前鼠标位置对应的全局数据索引
          const currentMouseDataIndex = syncState.windowStartIndex + (oldWindowSize * mouseRatio);
          
          // 更新窗口大小
          syncState.windowSize = newWindowSize;
          syncState.maxStartIndex = Math.max(0, allDataPoints.length - newWindowSize);
          
          // 计算新的起始索引，保持鼠标位置的数据点相对不变
          let newStartIndex = Math.round(currentMouseDataIndex - (newWindowSize * mouseRatio));
          
          // 确保新的起始索引在有效范围内
          newStartIndex = Math.max(0, Math.min(newStartIndex, syncState.maxStartIndex));
          syncState.windowStartIndex = newStartIndex;
          
          // 更新缩放指示器
          updateZoomIndicator();
          
          // 重绘所有通道
          redrawAllChannels();
        }
      });
      
      // 双击重置视图
      canvas.addEventListener('dblclick', () => {
        // 重置到最小状态
        syncState.windowStartIndex = 0;
        syncState.windowSize = Math.max(50, Math.floor(allDataPoints.length * 0.005)); // 最小0.5%
        syncState.maxStartIndex = Math.max(0, allDataPoints.length - syncState.windowSize);
        
        // 更新缩放指示器
        updateZoomIndicator();
        
        // 重绘所有通道
        redrawAllChannels();
      });
    });
    
    console.log('全局同步交互功能已初始化:', {
      totalDataPoints: allDataPoints.length,
      initialWindowSize: syncState.windowSize,
      channelCount: syncState.canvases.length
    });
  };

  /**
   * 初始化Canvas拖动功能（已弃用，使用全局同步）
   */
  const initCanvasDragFeature = (canvas, channelData) => {
    const allDataPoints = channelData.allDataPoints;
    if (!allDataPoints || allDataPoints.length === 0) return;
    
    // 初始化拖动状态 - 设置为最小状态
    const initialWindowSize = Math.max(50, Math.floor(allDataPoints.length * 0.005)); // 最小0.5%的数据
    canvas.dragState = {
      isDragging: false,
      lastX: 0,
      windowStartIndex: 0,
      windowSize: initialWindowSize,
      maxStartIndex: Math.max(0, allDataPoints.length - initialWindowSize),
      pixelsPerDataPoint: 1, // 每个数据点占用的像素数，动态计算
      hasShownTip: false
    };
    
    // 计算每个数据点占用的像素数
    canvas.dragState.pixelsPerDataPoint = canvas.width / canvas.dragState.windowSize;
    
    // 创建缩放级别指示器
    const zoomIndicator = document.createElement('div');
    zoomIndicator.className = 'zoom-level-indicator';
    zoomIndicator.style.position = 'absolute';
    zoomIndicator.style.top = '10px';
    zoomIndicator.style.right = '10px';
    
    // 将指示器添加到canvas的父容器中
    const canvasContainer = canvas.parentElement;
    canvasContainer.style.position = 'relative';
    canvasContainer.appendChild(zoomIndicator);
    
    // 更新缩放指示器
    const updateZoomIndicator = () => {
      const zoomPercentage = ((canvas.dragState.windowSize / allDataPoints.length) * 100).toFixed(1);
      const timeSpan = (canvas.dragState.windowSize / (channelData.sampleRate || 256) / 60).toFixed(1);
      zoomIndicator.textContent = `缩放: ${zoomPercentage}% (${timeSpan}分钟)`;
      zoomIndicator.classList.add('visible');
      
      // 2秒后隐藏指示器
      setTimeout(() => {
        zoomIndicator.classList.remove('visible');
      }, 2000);
    };
    
    // 初始显示缩放级别
    updateZoomIndicator();
    
    // 鼠标按下事件
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      canvas.dragState.isDragging = true;
      canvas.dragState.lastX = e.clientX - rect.left;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    // 鼠标移动事件
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      
      if (canvas.dragState.isDragging) {
        const deltaX = currentX - canvas.dragState.lastX;
        
        // 计算需要移动的数据点数量
        // 负的deltaX表示向右拖动，应该显示更早的数据（减少startIndex）
        // 正的deltaX表示向左拖动，应该显示更晚的数据（增加startIndex）
        const sensitivity = 0.2; // 拖动敏感度，数值越小拖动越快
        const deltaDataPoints = Math.round(-deltaX / sensitivity);
        
        if (Math.abs(deltaDataPoints) >= 1) {
          const newStartIndex = Math.max(0, 
            Math.min(canvas.dragState.windowStartIndex + deltaDataPoints, 
                    canvas.dragState.maxStartIndex));
          
          if (newStartIndex !== canvas.dragState.windowStartIndex) {
            canvas.dragState.windowStartIndex = newStartIndex;
            canvas.dragState.lastX = currentX;
            
            // 重新绘制
            const endIndex = Math.min(newStartIndex + canvas.dragState.windowSize - 1, allDataPoints.length - 1);
            const startTime = channelData.allTimeStamps[newStartIndex] || 0;
            const endTime = channelData.allTimeStamps[endIndex] || 0;
            
            drawFirst10MinutesEEGWaveform(canvas, channelData, newStartIndex, endIndex, startTime, endTime);
          }
        }
      } else {
        // 鼠标悬停时显示手型光标
        canvas.style.cursor = 'grab';
      }
    });
    
    // 鼠标抬起事件
    canvas.addEventListener('mouseup', () => {
      canvas.dragState.isDragging = false;
      canvas.style.cursor = 'grab';
    });
    
    // 鼠标离开canvas事件
    canvas.addEventListener('mouseleave', () => {
      canvas.dragState.isDragging = false;
      canvas.style.cursor = 'default';
    });
    
    // 鼠标滚轮事件 - 缩放功能
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85; // 向下滚动放大，向上滚动缩小
      const oldWindowSize = canvas.dragState.windowSize;
      const newWindowSize = Math.round(oldWindowSize * zoomFactor);
      
      // 限制窗口大小
      const minWindowSize = Math.max(50, Math.floor(allDataPoints.length * 0.005)); // 最小0.5%
      const maxWindowSize = allDataPoints.length;
      
      if (newWindowSize >= minWindowSize && newWindowSize <= maxWindowSize) {
        // 计算鼠标位置相对于canvas的比例
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseRatio = Math.max(0, Math.min(1, mouseX / canvas.width));
        
        // 计算当前鼠标位置对应的全局数据索引
        const currentMouseDataIndex = canvas.dragState.windowStartIndex + (oldWindowSize * mouseRatio);
        
        // 更新窗口大小
        canvas.dragState.windowSize = newWindowSize;
        canvas.dragState.maxStartIndex = Math.max(0, allDataPoints.length - newWindowSize);
        
        // 计算新的起始索引，保持鼠标位置的数据点相对不变
        let newStartIndex = Math.round(currentMouseDataIndex - (newWindowSize * mouseRatio));
        
        // 确保新的起始索引在有效范围内
        newStartIndex = Math.max(0, Math.min(newStartIndex, canvas.dragState.maxStartIndex));
        canvas.dragState.windowStartIndex = newStartIndex;
        
        // 重新计算像素比例
        canvas.dragState.pixelsPerDataPoint = canvas.width / canvas.dragState.windowSize;
        
        // 更新缩放指示器
        updateZoomIndicator();
        
        // 重新绘制
        const endIndex = Math.min(canvas.dragState.windowStartIndex + canvas.dragState.windowSize - 1, allDataPoints.length - 1);
        const startTime = channelData.allTimeStamps[canvas.dragState.windowStartIndex] || (canvas.dragState.windowStartIndex / (channelData.sampleRate || 256));
        const endTime = channelData.allTimeStamps[endIndex] || (endIndex / (channelData.sampleRate || 256));
        
        drawFirst10MinutesEEGWaveform(canvas, channelData, canvas.dragState.windowStartIndex, endIndex, startTime, endTime);
      }
    });
    
    // 双击重置视图
    canvas.addEventListener('dblclick', () => {
      // 重置到最小状态
      canvas.dragState.windowStartIndex = 0;
      canvas.dragState.windowSize = Math.max(50, Math.floor(allDataPoints.length * 0.005)); // 最小0.5%
      canvas.dragState.maxStartIndex = Math.max(0, allDataPoints.length - canvas.dragState.windowSize);
      canvas.dragState.pixelsPerDataPoint = canvas.width / canvas.dragState.windowSize;
      
      // 更新缩放指示器
      updateZoomIndicator();
      
      // 计算正确的结束索引和时间
      const endIndex = Math.min(canvas.dragState.windowStartIndex + canvas.dragState.windowSize - 1, allDataPoints.length - 1);
      const startTime = channelData.allTimeStamps[canvas.dragState.windowStartIndex] || (canvas.dragState.windowStartIndex / (channelData.sampleRate || 256));
      const endTime = channelData.allTimeStamps[endIndex] || (endIndex / (channelData.sampleRate || 256));
      
      drawFirst10MinutesEEGWaveform(canvas, channelData, canvas.dragState.windowStartIndex, endIndex, startTime, endTime);
    });
    
    console.log('Canvas拖动功能已初始化:', {
      totalDataPoints: allDataPoints.length,
      initialWindowSize: canvas.dragState.windowSize,
      pixelsPerDataPoint: canvas.dragState.pixelsPerDataPoint
    });
  };

  /**
   * 绘制滚动条指示器
   */
  const drawScrollIndicator = (ctx, canvasWidth, canvasHeight, syncState, totalDataPoints) => {
    if (!syncState || totalDataPoints === 0) return;
    
    const indicatorHeight = 8;
    const indicatorY = canvasHeight - indicatorHeight - 2;
    const indicatorWidth = canvasWidth - 20;
    const indicatorX = 10;
    
    // 绘制滚动条背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
    
    // 计算当前窗口在总数据中的位置和大小
    const windowRatio = syncState.windowSize / totalDataPoints;
    const positionRatio = totalDataPoints > 0 ? syncState.windowStartIndex / (totalDataPoints - syncState.windowSize) : 0;
    
    // 确保比例在有效范围内
    const safePositionRatio = Math.max(0, Math.min(1, positionRatio));
    
    const thumbWidth = Math.max(10, indicatorWidth * windowRatio);
    const maxThumbX = indicatorX + indicatorWidth - thumbWidth;
    const thumbX = indicatorX + (maxThumbX - indicatorX) * safePositionRatio;
    
    // 绘制滚动条滑块
    ctx.fillStyle = 'rgba(33, 150, 243, 0.6)';
    ctx.fillRect(thumbX, indicatorY, thumbWidth, indicatorHeight);
    
    // 绘制边框
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(thumbX, indicatorY, thumbWidth, indicatorHeight);
  };

  // 监听文件输入变化
  fileInput.addEventListener('change', (e) => {
    addFilesToList(e.target.files);
    // 重置input以便可以再次选择相同的文件
    fileInput.value = '';
  });

  // 拖放功能
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  // 添加拖动效果
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener('drop', (e) => {
      addFilesToList(e.dataTransfer.files);
    }, false);
  });

  // 上传按钮点击
  uploadButton.addEventListener('click', uploadFiles);

  // 清除按钮点击
  clearButton.addEventListener('click', clearSelectedFiles);



  // 初始化按钮状态
  updateButtons();
}); 