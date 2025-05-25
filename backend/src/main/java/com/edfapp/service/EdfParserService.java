package com.edfapp.service;

import com.edfapp.util.mipt.edf.EDFParser;
import com.edfapp.util.mipt.edf.EDFParserResult;
import com.edfapp.util.mipt.edf.EDFHeader;
import com.edfapp.util.mipt.edf.EDFSignal;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EdfParserService {

    public List<Map<String, Object>> parseEdfFiles(MultipartFile[] files) throws IOException {
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            
            // 验证文件类型
            if (!isEdfFile(file)) {
                throw new IllegalArgumentException("文件 " + file.getOriginalFilename() + " 不是有效的EDF文件");
            }
            
            try {
                Map<String, Object> fileResult = parseEdfFile(file);
                results.add(fileResult);
            } catch (Exception e) {
                throw new IOException("解析文件 " + file.getOriginalFilename() + " 时出错: " + e.getMessage());
            }
        }
        
        return results;
    }
    
    private Map<String, Object> parseEdfFile(MultipartFile file) throws Exception {
        BufferedInputStream inputStream = new BufferedInputStream(file.getInputStream());
        
        // 根据EDF4j的正确用法解析EDF文件
        EDFParserResult result = EDFParser.parseEDF(inputStream);
        
        Map<String, Object> fileInfo = new HashMap<>();
        
        // 基本文件信息
        fileInfo.put("fileName", file.getOriginalFilename());
        fileInfo.put("fileSize", file.getSize());
        
        // EDF头信息
        EDFHeader header = result.getHeader();
        EDFSignal signal = result.getSignal();
        
        if (header != null) {
            fileInfo.put("patientId", header.getSubjectID());
            fileInfo.put("recordId", header.getRecordingID());
            fileInfo.put("startDate", header.getStartDate());
            fileInfo.put("startTime", header.getStartTime());
            fileInfo.put("duration", header.getDurationOfRecords());
            fileInfo.put("numberOfRecords", header.getNumberOfRecords());
            fileInfo.put("channelCount", header.getNumberOfChannels());
            
            // 计算总持续时间
            double totalDuration = header.getNumberOfRecords() * header.getDurationOfRecords();
            fileInfo.put("totalDuration", totalDuration);
            
            // 通道信息和完整波形数据
            List<Map<String, Object>> channelInfo = new ArrayList<>();
            String[] channelLabels = header.getChannelLabels();
            String[] transducerTypes = header.getTransducerTypes();
            String[] dimensions = header.getDimensions();
            Double[] minInUnits = header.getMinInUnits();
            Double[] maxInUnits = header.getMaxInUnits();
            Integer[] digitalMin = header.getDigitalMin();
            Integer[] digitalMax = header.getDigitalMax();
            String[] prefilterings = header.getPrefilterings();
            Integer[] numberOfSamples = header.getNumberOfSamples();
            
            // 获取完整信号数据
            double[][] allChannelData = null;
            if (signal != null && signal.getValuesInUnits() != null) {
                allChannelData = signal.getValuesInUnits();
            }
            
            // 解析开始时间为时间戳（秒）
            String startDateStr = header.getStartDate(); // 格式: "dd.mm.yy"
            String startTimeStr = header.getStartTime(); // 格式: "hh.mm.ss"
            long startTimeSeconds = parseEdfDateTime(startDateStr, startTimeStr);
            
            for (int i = 0; i < header.getNumberOfChannels(); i++) {
                Map<String, Object> channel = new HashMap<>();
                channel.put("index", i + 1);
                channel.put("label", channelLabels != null && i < channelLabels.length ? channelLabels[i].trim() : "Channel " + (i + 1));
                channel.put("transducerType", transducerTypes != null && i < transducerTypes.length ? transducerTypes[i].trim() : "N/A");
                channel.put("physicalDimension", dimensions != null && i < dimensions.length ? dimensions[i].trim() : "μV");
                channel.put("physicalMinimum", minInUnits != null && i < minInUnits.length ? minInUnits[i] : -3277.0);
                channel.put("physicalMaximum", maxInUnits != null && i < maxInUnits.length ? maxInUnits[i] : 3277.0);
                channel.put("digitalMinimum", digitalMin != null && i < digitalMin.length ? digitalMin[i] : -32767);
                channel.put("digitalMaximum", digitalMax != null && i < digitalMax.length ? digitalMax[i] : 32767);
                channel.put("prefiltering", prefilterings != null && i < prefilterings.length ? prefilterings[i].trim() : "N/A");
                channel.put("samplesPerRecord", numberOfSamples != null && i < numberOfSamples.length ? numberOfSamples[i] : 256);
                
                // 添加完整波形数据和时间信息
                if (allChannelData != null && i < allChannelData.length && allChannelData[i] != null) {
                    double[] channelData = allChannelData[i];
                    
                    // 计算采样率
                    int samplesPerRecord = numberOfSamples != null && i < numberOfSamples.length ? numberOfSamples[i] : 256;
                    double sampleRate = samplesPerRecord / header.getDurationOfRecords();
                    channel.put("sampleRate", sampleRate);
                    
                    // 信号时间信息
                    channel.put("signalStartTime", startTimeSeconds);
                    channel.put("signalStartTimeFormatted", startTimeStr);
                    
                    // 计算信号的实际时间范围
                    double signalDuration = channelData.length / sampleRate;
                    long signalEndTime = startTimeSeconds + (long)signalDuration;
                    channel.put("signalEndTime", signalEndTime);
                    channel.put("signalDuration", signalDuration);
                    
                    // 限制传输的数据量以避免JSON序列化堆栈溢出
                    // 最多传输100,000个数据点，对于大文件进行降采样
                    int maxDataPoints = 100000;
                    int totalDataPoints = channelData.length;
                    int step = Math.max(1, totalDataPoints / maxDataPoints);
                    
                    List<Double> allDataPoints = new ArrayList<>();
                    List<Double> allTimeStamps = new ArrayList<>();
                    
                    // 智能采样：保留关键数据点
                    for (int j = 0; j < totalDataPoints; j += step) {
                        allDataPoints.add(channelData[j]);
                        // 计算每个数据点的精确时间戳
                        double timeOffset = j / sampleRate;
                        allTimeStamps.add(startTimeSeconds + timeOffset);
                    }
                    
                    // 传递采样后的数据
                    channel.put("allDataPoints", allDataPoints);
                    channel.put("allTimeStamps", allTimeStamps);
                    channel.put("totalDataPoints", totalDataPoints);
                    channel.put("sampledDataPoints", allDataPoints.size());
                    channel.put("samplingStep", step);
                    
                    // 添加采样间隔信息
                    channel.put("samplingInterval", 1.0 / sampleRate); // 秒
                    
                    System.out.println("通道 " + (i + 1) + " (" + channel.get("label") + "):");
                    System.out.println("  总数据点: " + totalDataPoints);
                    System.out.println("  传输数据点: " + allDataPoints.size() + " (采样步长: " + step + ")");
                    System.out.println("  采样率: " + sampleRate + " Hz");
                    System.out.println("  信号时长: " + (signalDuration / 60.0) + " 分钟");
                    System.out.println("  开始时间: " + startTimeStr);
                    
                } else {
                    // 如果没有数据，创建空数组
                    channel.put("allDataPoints", new ArrayList<Double>());
                    channel.put("allTimeStamps", new ArrayList<Double>());
                    channel.put("totalDataPoints", 0);
                    channel.put("sampleRate", 256.0);
                    channel.put("signalStartTime", startTimeSeconds);
                    channel.put("signalStartTimeFormatted", startTimeStr);
                    channel.put("signalDuration", 0.0);
                }
                
                channelInfo.add(channel);
            }
            fileInfo.put("channels", channelInfo);
            
            // 添加元数据信息
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("actualDuration", totalDuration);
            metadata.put("totalDurationMinutes", totalDuration / 60.0);
            metadata.put("displayDurationMinutes", 10.0); // 前端显示前10分钟
            fileInfo.put("metadata", metadata);
            
            System.out.println("文件解析完成: " + file.getOriginalFilename());
            System.out.println("总时长: " + (totalDuration / 60.0) + " 分钟");
            System.out.println("通道数: " + header.getNumberOfChannels());
        }
        
        inputStream.close();
        return fileInfo;
    }
    
    private boolean isEdfFile(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        return fileName != null && fileName.toLowerCase().endsWith(".edf");
    }
    
    /**
     * 解析EDF日期时间格式为时间戳（秒）
     * @param dateStr 日期字符串，格式: "dd.mm.yy"
     * @param timeStr 时间字符串，格式: "hh.mm.ss"
     * @return 时间戳（秒）
     */
    private long parseEdfDateTime(String dateStr, String timeStr) {
        try {
            if (dateStr == null || timeStr == null) {
                return 0L;
            }
            
            // 解析时间部分 "hh.mm.ss"
            String[] timeParts = timeStr.split("\\.");
            if (timeParts.length >= 3) {
                int hours = Integer.parseInt(timeParts[0]);
                int minutes = Integer.parseInt(timeParts[1]);
                int seconds = Integer.parseInt(timeParts[2]);
                
                // 返回当天的秒数（从00:00:00开始）
                return hours * 3600L + minutes * 60L + seconds;
            }
            
            return 0L;
        } catch (Exception e) {
            System.err.println("解析EDF时间失败: " + dateStr + " " + timeStr + " - " + e.getMessage());
            return 0L;
        }
    }
} 