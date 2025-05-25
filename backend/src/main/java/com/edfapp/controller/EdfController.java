package com.edfapp.controller;

import com.edfapp.service.EdfParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // 允许跨域请求
public class EdfController {

    @Autowired
    private EdfParserService edfParserService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadEdfFiles(
            @RequestParam("files") MultipartFile[] files) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 验证文件数量
            if (files.length == 0) {
                response.put("success", false);
                response.put("message", "请选择至少一个文件");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (files.length > 3) {
                response.put("success", false);
                response.put("message", "最多只能上传3个文件");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 验证文件大小
            for (MultipartFile file : files) {
                if (file.getSize() > 100 * 1024 * 1024) { // 100MB
                    response.put("success", false);
                    response.put("message", "文件 " + file.getOriginalFilename() + " 超过100MB限制");
                    return ResponseEntity.badRequest().body(response);
                }
            }
            
            // 解析EDF文件
            List<Map<String, Object>> results = edfParserService.parseEdfFiles(files);
            
            response.put("success", true);
            response.put("message", "文件解析成功");
            response.put("data", results);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "服务器内部错误: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "EDF解析服务运行正常");
        return ResponseEntity.ok(response);
    }
} 