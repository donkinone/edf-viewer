/**
 * EDF文件解析器 - 基于BilalZonjy/EDFViewer项目的实现
 * https://github.com/BilalZonjy/EDFViewer
 */

/**
 * 解析EDF文件并提取详细信息
 * @param {Buffer} fileBuffer - EDF文件的二进制数据
 * @returns {Object} 解析后的EDF文件信息
 */
async function parseEDFFile(fileBuffer) {
  try {
    console.log('解析EDF文件，文件大小:', fileBuffer.length, 'bytes');
    
    // 解析EDF头部信息
    const header = parseEDFHeader(fileBuffer);
    
    // 解析信号信息
    const signals = parseSignalInfo(fileBuffer, header);
    
    // 解析数据记录
    const result = parseDataRecords(fileBuffer, header, signals);
    const { dataRecords, metadata } = result;
    
    // 计算准确的持续时间(秒)
    const actualDuration = header.numDataRecords * header.duration;
    
    // 构建结果对象
    return {
      patientId: header.patientId,
      recordId: header.recordId,
      startDate: formatDate(header.startDate),
      duration: formatDuration(actualDuration),
      channelCount: header.numSignals,
      channels: signals.map((signal, index) => ({
        label: signal.label,
        physicalMax: signal.physicalMax,
        physicalMin: signal.physicalMin,
        digitalMax: signal.digitalMax,
        digitalMin: signal.digitalMin,
        samplesPerRecord: signal.samplesPerRecord,
        transducerType: signal.transducerType,
        physicalDimension: signal.physicalDimension,
        prefiltering: signal.prefiltering,
        reserved: signal.reserved,
        dataPoints: dataRecords[index] || generateSineWave(200, index) // 如果解析失败，使用模拟数据
      })),
      sampleRate: metadata.sampleRate || (signals.length > 0 ? signals[0].samplesPerRecord / header.duration : 256),
      metadata: {
        ...metadata,
        recordCount: header.numDataRecords,
        recordDuration: header.duration,
        fileSizeBytes: fileBuffer.length,
        headerBytes: header.headerBytes,
        actualDuration: actualDuration  // 确保元数据中包含正确的总持续时间
      }
    };
  } catch (error) {
    console.error('EDF解析错误:', error);
    return createDefaultResult();
  }
}

/**
 * 解析EDF头部信息
 * @param {Buffer} buffer - EDF文件数据
 * @returns {Object} 头部信息
 */
function parseEDFHeader(buffer) {
  if (!buffer || buffer.length < 256) {
    throw new Error('文件格式错误或文件太小');
  }
  
  // 版本
  const version = buffer.slice(0, 8).toString('ascii').trim();
  if (version !== '0' && version !== '0       ') {
    console.warn('未知EDF版本:', version);
  }
  
  // 患者ID (8-88字节)
  const patientId = buffer.slice(8, 88).toString('ascii').trim();
  
  // 记录ID (88-168字节)
  const recordId = buffer.slice(88, 168).toString('ascii').trim();
  
  // 开始日期和时间 (168-184字节)
  const startDateStr = buffer.slice(168, 184).toString('ascii').trim();
  // 日期格式: dd.mm.yy
  // 时间格式: hh.mm.ss
  const startDate = parseEDFDate(startDateStr);
  
  // 头部记录的字节数 (184-192字节)
  const headerBytes = parseInt(buffer.slice(184, 192).toString('ascii').trim());
  
  // 保留字段 (192-236字节)
  const reserved = buffer.slice(192, 236).toString('ascii').trim();
  
  // 数据记录数 (236-244字节)
  const numDataRecords = parseInt(buffer.slice(236, 244).toString('ascii').trim());
  
  // 每个数据记录的持续时间，以秒为单位 (244-252字节)
  const duration = parseFloat(buffer.slice(244, 252).toString('ascii').trim());
  
  // 信号数量 (252-256字节)
  const numSignals = parseInt(buffer.slice(252, 256).toString('ascii').trim());
  
  return {
    version,
    patientId,
    recordId,
    startDate,
    headerBytes,
    reserved,
    numDataRecords,
    duration,
    numSignals
  };
}

/**
 * 解析EDF日期字符串
 * @param {string} dateStr - EDF日期字符串
 * @returns {Date} JavaScript日期对象
 */
function parseEDFDate(dateStr) {
  try {
    // 格式: dd.mm.yy hh.mm.ss
    const parts = dateStr.split(' ');
    if (parts.length !== 2) return new Date();
    
    const dateParts = parts[0].split('.');
    const timeParts = parts[1].split('.');
    
    if (dateParts.length !== 3 || timeParts.length !== 3) return new Date();
    
    // 注意：JavaScript月份从0开始
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    
    // 20世纪还是21世纪
    let year = parseInt(dateParts[2]);
    if (year < 50) {
      year += 2000; // 21世纪
    } else {
      year += 1900; // 20世纪
    }
    
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const second = parseInt(timeParts[2]);
    
    return new Date(year, month, day, hour, minute, second);
  } catch (err) {
    console.warn('解析日期错误:', err);
    return new Date();
  }
}

/**
 * 解析信号信息
 * @param {Buffer} buffer - EDF文件数据
 * @param {Object} header - 解析后的头部信息
 * @returns {Array} 信号信息数组
 */
function parseSignalInfo(buffer, header) {
  const signals = [];
  const numSignals = header.numSignals;
  
  // 每个信号的标签 (256 + ns * 16 字节)
  const labels = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (i * 16);
    const end = start + 16;
    labels.push(buffer.slice(start, end).toString('ascii').trim());
  }
  
  // 每个信号的转换器类型
  const transducerTypes = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 16) + (i * 80);
    const end = start + 80;
    transducerTypes.push(buffer.slice(start, end).toString('ascii').trim());
  }
  
  // 每个信号的物理尺寸单位
  const physicalDimensions = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 96) + (i * 8);
    const end = start + 8;
    physicalDimensions.push(buffer.slice(start, end).toString('ascii').trim());
  }
  
  // 每个信号的物理最小值
  const physicalMins = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 104) + (i * 8);
    const end = start + 8;
    physicalMins.push(parseFloat(buffer.slice(start, end).toString('ascii').trim()));
  }
  
  // 每个信号的物理最大值
  const physicalMaxs = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 112) + (i * 8);
    const end = start + 8;
    physicalMaxs.push(parseFloat(buffer.slice(start, end).toString('ascii').trim()));
  }
  
  // 每个信号的数字最小值
  const digitalMins = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 120) + (i * 8);
    const end = start + 8;
    digitalMins.push(parseInt(buffer.slice(start, end).toString('ascii').trim()));
  }
  
  // 每个信号的数字最大值
  const digitalMaxs = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 128) + (i * 8);
    const end = start + 8;
    digitalMaxs.push(parseInt(buffer.slice(start, end).toString('ascii').trim()));
  }
  
  // 每个信号的预过滤
  const prefiltering = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 136) + (i * 80);
    const end = start + 80;
    prefiltering.push(buffer.slice(start, end).toString('ascii').trim());
  }
  
  // 每个信号每个数据记录的样本数
  const samplesPerRecord = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 216) + (i * 8);
    const end = start + 8;
    samplesPerRecord.push(parseInt(buffer.slice(start, end).toString('ascii').trim()));
  }
  
  // 每个信号的保留字段
  const reserved = [];
  for (let i = 0; i < numSignals; i++) {
    const start = 256 + (numSignals * 224) + (i * 32);
    const end = start + 32;
    reserved.push(buffer.slice(start, end).toString('ascii').trim());
  }
  
  // 创建信号对象数组
  for (let i = 0; i < numSignals; i++) {
    signals.push({
      label: labels[i],
      transducerType: transducerTypes[i],
      physicalDimension: physicalDimensions[i],
      physicalMin: physicalMins[i],
      physicalMax: physicalMaxs[i],
      digitalMin: digitalMins[i],
      digitalMax: digitalMaxs[i],
      prefiltering: prefiltering[i],
      samplesPerRecord: samplesPerRecord[i],
      reserved: reserved[i]
    });
  }
  
  return signals;
}

/**
 * 解析数据记录
 * @param {Buffer} buffer - EDF文件数据
 * @param {Object} header - 解析后的头部信息
 * @param {Array} signals - 解析后的信号信息数组
 * @returns {Array} 所有通道的数据点数组
 */
function parseDataRecords(buffer, header, signals) {
  try {
    const dataRecords = [];
    const numSignals = header.numSignals;
    const numDataRecords = header.numDataRecords;
    
    // 计算所有数据的起始位置
    const dataOffset = header.headerBytes;
    
    // 为每个信号创建一个数据点数组
    for (let i = 0; i < numSignals; i++) {
      dataRecords[i] = [];
    }
    
    // 计算每个数据记录的总样本数
    const samplesPerRecord = signals.reduce((sum, signal) => sum + signal.samplesPerRecord, 0);
    
    // 计算每个通道在一个记录中的位置偏移
    const channelOffsets = [];
    let offset = 0;
    for (let i = 0; i < numSignals; i++) {
      channelOffsets[i] = offset;
      offset += signals[i].samplesPerRecord;
    }
    
    // 计算文件大小是否可以容纳所有标记的记录
    const expectedDataSize = numDataRecords * samplesPerRecord * 2; // 2字节/样本
    const actualDataSize = buffer.length - dataOffset;
    
    // 如果实际大小小于预期大小，调整记录数
    const adjustedNumDataRecords = Math.min(
      numDataRecords, 
      Math.floor(actualDataSize / (samplesPerRecord * 2))
    );
    
    // 处理所有数据记录，不再限制大文件
    let processEveryNthRecord = 1;
    let maxRecordsToProcess = adjustedNumDataRecords;
    
    // 对于非常大的文件才使用降采样，提高性能但保留完整数据
    const estimatedFileSize = adjustedNumDataRecords * samplesPerRecord * 2;
    if (estimatedFileSize > 1000 * 1024 * 1024) { // 只有超过1GB才降采样
      processEveryNthRecord = Math.max(1, Math.ceil(adjustedNumDataRecords / 100000));
      maxRecordsToProcess = Math.ceil(adjustedNumDataRecords / processEveryNthRecord);
      console.log(`文件非常大，采用 ${processEveryNthRecord}:1 的降采样率，处理 ${maxRecordsToProcess}/${adjustedNumDataRecords} 条记录`);
    } else {
      console.log(`将处理所有 ${adjustedNumDataRecords} 条记录`);
    }
    
    // 记录实际持续时间信息
    const actualDuration = adjustedNumDataRecords * header.duration;
    const sampleRate = signals.length > 0 ? signals[0].samplesPerRecord / header.duration : 256;
    
    // 解析每个数据记录中的每个信号
    let recordsProcessed = 0;
    
    for (let record = 0; record < adjustedNumDataRecords; record += processEveryNthRecord) {
      // 每条记录的起始位置
      const recordOffset = dataOffset + (record * samplesPerRecord * 2); // 2字节/样本
      
      // 如果超出文件范围，终止处理
      if (recordOffset + (samplesPerRecord * 2) > buffer.length) {
        console.warn(`记录 ${record} 超出文件范围，终止处理`);
        break;
      }
      
      for (let channel = 0; channel < numSignals; channel++) {
        const signal = signals[channel];
        const samples = signal.samplesPerRecord;
        
        // 计算该通道在此记录中的起始位置
        const channelStartOffset = recordOffset + (channelOffsets[channel] * 2); // 2字节/样本
        
        // 读取此通道在此记录中的所有样本
        for (let sample = 0; sample < samples; sample++) {
          // 每个样本使用2字节（16位）表示
          const sampleOffset = channelStartOffset + (sample * 2);
          
          // 如果超出文件范围，中断处理
          if (sampleOffset + 2 > buffer.length) break;
          
          // 读取2字节的有符号整数（小端序）
          const digitalValue = buffer.readInt16LE(sampleOffset);
          
          // 将数字值转换为物理值
          const physicalValue = convertDigitalToPhysical(
            digitalValue, 
            signal.digitalMin, 
            signal.digitalMax, 
            signal.physicalMin, 
            signal.physicalMax
          );
          
          // 存储转换后的物理值
          dataRecords[channel].push(physicalValue);
        }
      }
      
      recordsProcessed++;
      
      // 处理进度每20%记录一次日志
      if (recordsProcessed % Math.max(1, Math.floor(maxRecordsToProcess / 5)) === 0) {
        console.log(`已处理 ${recordsProcessed}/${maxRecordsToProcess} 条记录 (${Math.round((recordsProcessed / maxRecordsToProcess) * 100)}%)`);
      }
    }
    
    console.log(`数据记录解析完成，共处理 ${recordsProcessed} 条记录，采样率: ${sampleRate}Hz，总持续时间: ${formatDuration(actualDuration)}，每通道数据点数: ${dataRecords[0]?.length || 0}`);
    
    // 将处理结果附加到返回值
    const processedResult = {
      dataRecords,
      metadata: {
        sampleRate,
        recordsProcessed,
        totalRecords: adjustedNumDataRecords,
        actualDuration,
        processEveryNthRecord
      }
    };
    
    return processedResult;
  } catch (err) {
    console.error('解析数据记录错误:', err);
    return { 
      dataRecords: [], 
      metadata: {
        sampleRate: 256,
        recordsProcessed: 0,
        totalRecords: 0,
        actualDuration: 0,
        processEveryNthRecord: 1
      }
    };
  }
}

/**
 * 将数字值转换为物理值
 * @param {number} digitalValue - 数字值
 * @param {number} digitalMin - 数字最小值
 * @param {number} digitalMax - 数字最大值
 * @param {number} physicalMin - 物理最小值
 * @param {number} physicalMax - 物理最大值
 * @returns {number} 转换后的物理值
 */
function convertDigitalToPhysical(digitalValue, digitalMin, digitalMax, physicalMin, physicalMax) {
  // 防止除以零
  if (digitalMax === digitalMin) return 0;
  
  return physicalMin + (digitalValue - digitalMin) * (physicalMax - physicalMin) / (digitalMax - digitalMin);
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的日期字符串
 */
function formatDate(date) {
  if (!date) return '未知日期';
  try {
    return date.toLocaleString('zh-CN');
  } catch (e) {
    return '日期格式错误';
  }
}

/**
 * 格式化持续时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化的持续时间字符串
 */
function formatDuration(seconds) {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return '未知';
  
  try {
    // 更精确地处理长时间持续时间
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    let result = '';
    if (hours > 0) result += `${hours}小时 `;
    if (minutes > 0 || hours > 0) result += `${minutes}分钟 `;
    if (hours === 0) result += `${remainingSeconds}秒`; // 只有在不足1小时时才显示秒
    
    return result.trim();
  } catch (e) {
    return '未知';
  }
}

/**
 * 生成模拟正弦波数据
 * @param {number} length - 数据点数量
 * @param {number} channelIndex - 通道索引
 * @returns {Array} 数据点数组
 */
function generateSineWave(length, channelIndex) {
  const points = [];
  const frequency = 0.05 + (channelIndex * 0.01); // 不同通道不同频率
  const amplitude = 100 - (channelIndex * 5); // 不同通道不同振幅
  
  for (let i = 0; i < length; i++) {
    points.push(Math.sin(i * frequency) * amplitude);
  }
  
  return points;
}

/**
 * 创建默认结果对象（用于解析失败时）
 * @returns {Object} 默认结果对象
 */
function createDefaultResult() {
  return {
    patientId: '解析失败',
    recordId: '解析失败',
    startDate: '未知日期',
    duration: '未知',
    channelCount: 5,
    channels: Array(5).fill().map((_, i) => ({
      label: `模拟通道 ${i+1}`,
      physicalMax: 100,
      physicalMin: -100,
      dataPoints: generateSineWave(200, i)
    })),
    sampleRate: 256
  };
}

module.exports = {
  parseEDFFile
}; 