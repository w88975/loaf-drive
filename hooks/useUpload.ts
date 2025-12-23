/**
 * 文件上传引擎 Hook
 * 功能：提供完整的文件和文件夹上传能力
 * 核心特性：
 * 1. 并发上传 - 多个文件同时上传，充分利用带宽
 * 2. 分片上传 - 大文件（>100MB）自动分片，提高可靠性
 * 3. 客户端预览 - 上传前生成视频帧和图片缩略图
 * 4. 文件夹遍历 - 支持拖拽整个文件夹，递归创建目录结构
 * 5. 进度跟踪 - 实时显示每个文件的上传进度和状态
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UploadTask } from '../types';
import { driveApi } from '../api/drive';
import { generateId, getVideoFramesWeb, getImageThumbnailWeb, dataURItoBlob } from '../utils';

const CHUNK_SIZE = 10 * 1024 * 1024;
const CHUNKED_THRESHOLD = 100 * 1024 * 1024;

export const useUpload = () => {
  /**
   * 上传任务队列
   * 存储所有正在上传/已完成/失败的任务
   */
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  
  /**
   * 上传面板显示状态
   */
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  
  const queryClient = useQueryClient();

  /**
   * 上传单个文件的核心函数
   * 功能：处理单个文件的完整上传流程
   * @param file 要上传的文件对象
   * @param targetFolderId 目标文件夹ID
   * 
   * 工作流程：
   * 1. 创建上传任务并加入队列
   * 2. 生成预览图（视频/图片）- 状态：processing
   * 3. 上传文件本体 - 状态：uploading
   *    - 大文件（>100MB）：分片上传
   *    - 小文件：直接上传
   * 4. 完成并刷新文件列表 - 状态：completed
   * 
   * 所有预览处理在客户端完成，不占用服务器资源
   */
  const uploadSingleFile = async (file: File, targetFolderId: string) => {
    const taskId = generateId();
    const task: UploadTask = {
      id: taskId,
      file,
      progress: 0,
      status: 'pending',
      targetFolderId
    };

    setUploadTasks(prev => [...prev, task]);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/') && file.type !== 'image/svg+xml';
    let previewR2Keys: string[] = [];

    try {
      /**
       * 第一阶段：预览图生成和上传
       * 在文件上传前完成，用于列表中的封面展示
       */
      if (isVideo || isImage) {
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'processing' } : t));
        
        if (isVideo) {
          const videoUrl = URL.createObjectURL(file);
          try {
            const frames = await getVideoFramesWeb(videoUrl, [0.1, 0.5, 0.9]);
            for (const frame of frames) {
              const blob = dataURItoBlob(frame.uri);
              const result = await driveApi.uploadPreview(blob);
              if (result.code === 0) {
                previewR2Keys.push(result.data.r2Key);
              }
            }
          } catch (err) {
            console.warn('Video preview generation failed:', err);
          } finally {
            URL.revokeObjectURL(videoUrl);
          }
        } else if (isImage) {
          const imageUrl = URL.createObjectURL(file);
          try {
            const thumbDataUri = await getImageThumbnailWeb(imageUrl, 150, 150);
            const blob = dataURItoBlob(thumbDataUri);
            const result = await driveApi.uploadPreview(blob);
            if (result.code === 0) {
              previewR2Keys.push(result.data.r2Key);
            }
          } catch (err) {
            console.warn('Image preview generation failed:', err);
          } finally {
            URL.revokeObjectURL(imageUrl);
          }
        }
      }

      /**
       * 第二阶段：文件主体上传
       * 根据文件大小选择上传策略
       */
      if (file.size > CHUNKED_THRESHOLD) {
        /**
         * 分片上传流程（大文件 >100MB）
         * 优势：提高大文件上传的稳定性和可恢复性
         * 
         * 流程：
         * 1. 初始化上传会话，获取 uploadId
         * 2. 循环上传每个分片，收集 ETag
         * 3. 通知后端合并分片
         */
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'uploading' } : t));
        
        const initRes = await driveApi.uploadInit({
          filename: file.name,
          folderId: targetFolderId,
          totalSize: file.size,
          mimeType: file.type
        });

        if (initRes.code !== 0) throw new Error(initRes.message);

        const { uploadId, r2Key, id } = initRes.data;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const parts: { partNumber: number, etag: string }[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const fd = new FormData();
          fd.append('chunk', chunk, 'chunk');
          fd.append('uploadId', uploadId);
          fd.append('r2Key', r2Key);
          fd.append('partNumber', (i + 1).toString());

          const partRes = await driveApi.uploadPart(fd);
          if (partRes.code !== 0) throw new Error(partRes.message);

          parts.push(partRes.data);
          
          const progress = ((i + 1) / totalChunks) * 100;
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress } : t));
        }

        const completeRes = await driveApi.uploadComplete({
          id,
          uploadId,
          r2Key,
          parts,
          previews: previewR2Keys
        });

        if (completeRes.code === 0) {
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t));
          queryClient.invalidateQueries({ queryKey: ['files'] });
        } else {
          throw new Error(completeRes.message);
        }

      } else {
        /**
         * 直接上传流程（小文件 <100MB）
         * 使用 XMLHttpRequest 支持进度回调和取消功能
         */
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'uploading' } : t));

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folderId', targetFolderId);
        if (previewR2Keys.length > 0) {
          fd.append('previews', JSON.stringify(previewR2Keys));
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', driveApi.getUploadUrl());

        /**
         * 监听上传进度事件
         * 实时更新任务的 progress 字段
         */
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress } : t));
          }
        };

        const resultPromise = new Promise((resolve, reject) => {
          xhr.onload = () => {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result.code === 0) {
                setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t));
                queryClient.invalidateQueries({ queryKey: ['files'] });
                resolve(result);
              } else {
                reject(new Error(result.message || 'Server error during upload'));
              }
            } catch (err) {
              reject(new Error('Failed to parse upload response'));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.onabort = () => reject(new Error('Upload aborted'));
        });

        /**
         * 保存 XHR 实例到任务对象
         * 用于支持取消上传功能（调用 xhr.abort()）
         */
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, xhr } : t));
        xhr.send(fd);
        await resultPromise;
      }
    } catch (err) {
      console.error(`Upload task failed for ${file.name}:`, err);
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error' } : t));
    }
  };

  /**
   * 递归处理文件系统条目（文件或文件夹）
   * 功能：遍历拖拽的文件夹结构，递归创建目录并上传文件
   * @param entry FileSystemEntry 对象（由 webkitGetAsEntry 获取）
   * @param parentFolderId 父文件夹ID
   * 
   * 工作流程：
   * - 文件：直接调用 uploadSingleFile（并发）
   * - 文件夹：先创建文件夹，获取新ID后递归处理子项
   * 
   * 并发策略：
   * - 同级文件并发上传
   * - 同级文件夹并发创建
   * - 子项必须等待父文件夹创建完成（需要父ID）
   */
  const processEntry = async (entry: any, parentFolderId: string) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
      uploadSingleFile(file, parentFolderId);
    } else if (entry.isDirectory) {
      const res = await driveApi.createFolder(entry.name, parentFolderId);
      if (res.code === 0) {
        const newFolderId = res.data.id;
        queryClient.invalidateQueries({ queryKey: ['files'] });
        
        const dirReader = entry.createReader();
        const readEntries = async (): Promise<any[]> => {
          return new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
        };

        let entries = await readEntries();
        while (entries.length > 0) {
          for (const childEntry of entries) {
            processEntry(childEntry, newFolderId);
          }
          entries = await readEntries();
        }
      } else {
        console.error('Failed to create directory structure:', res.message);
      }
    }
  };

  /**
   * 上传处理主函数
   * 功能：统一处理拖拽上传和点击上传两种输入方式
   * @param input 输入源（拖拽的 DataTransfer 或点击选择的 FileList）
   * @param currentFolderId 当前文件夹ID
   * 
   * 处理逻辑：
   * - DataTransfer：使用 webkitGetAsEntry 遍历文件夹结构
   * - FileList：直接遍历文件列表
   * 
   * 所有文件和文件夹并发处理，充分利用带宽
   */
  const handleUpload = useCallback(async (input: DataTransfer | FileList | null, currentFolderId: string | null) => {
    if (!input) return;
    setShowUploadPanel(true);
    const targetId = currentFolderId || 'root';

    if (input instanceof DataTransfer) {
      const items = Array.from(input.items);
      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          processEntry(entry, targetId);
        }
      }
    } else {
      const files = Array.from(input);
      for (const file of files) {
        uploadSingleFile(file, targetId);
      }
    }
  }, [queryClient]);

  /**
   * 取消上传
   * 功能：中止正在上传的文件（调用 XHR.abort）
   * @param id 任务ID
   */
  const cancelUpload = (id: string) => {
    setUploadTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task?.xhr) task.xhr.abort();
      return prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t);
    });
  };

  /**
   * 清除历史记录
   * 功能：移除已完成/失败/取消的任务，只保留正在进行的任务
   */
  const clearHistory = () => setUploadTasks(prev => prev.filter(t => t.status === 'uploading' || t.status === 'processing'));

  return { uploadTasks, showUploadPanel, setShowUploadPanel, handleUpload, cancelUpload, clearHistory };
};
