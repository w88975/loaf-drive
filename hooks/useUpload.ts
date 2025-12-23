
import { useState, useCallback } from 'react';
import { UploadTask } from '../types';
import { driveApi } from '../api/drive';
import { generateId, getVideoFramesWeb, dataURItoBlob } from '../utils';

export const useUpload = (refresh: () => void) => {
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const handleUpload = useCallback(async (files: FileList | null, currentFolderId: string | null) => {
    if (!files) return;
    
    const newTasks: UploadTask[] = Array.from(files).map(file => ({
      id: generateId(),
      file,
      progress: 0,
      status: 'pending',
      targetFolderId: currentFolderId || 'root'
    }));

    setUploadTasks(prev => [...prev, ...newTasks]);
    setShowUploadPanel(true);

    for (const task of newTasks) {
      const isVideo = task.file.type.startsWith('video/');
      let previewR2Keys: string[] = [];

      try {
        if (isVideo) {
          // 状态变为 processing，表示正在提取预览图
          setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'processing' } : t));
          
          const videoUrl = URL.createObjectURL(task.file);
          try {
            const frames = await getVideoFramesWeb(videoUrl, [0.1, 0.5, 0.9]);
            for (const frame of frames) {
              const blob = dataURItoBlob(frame.uri);
              const result = await driveApi.uploadPreview(blob);
              if (result.code === 0) {
                previewR2Keys.push(result.data.r2Key);
              }
            }
          } finally {
            URL.revokeObjectURL(videoUrl);
          }
        }

        // 开始正式上传主文件
        setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'uploading' } : t));

        const fd = new FormData();
        fd.append('file', task.file);
        fd.append('folderId', task.targetFolderId || 'root');
        if (previewR2Keys.length > 0) {
          fd.append('previews', JSON.stringify(previewR2Keys));
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', driveApi.getUploadUrl());

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress } : t));
          }
        };

        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.code === 0) {
              setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t));
              refresh();
            } else {
              setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error' } : t));
            }
          } catch (err) {
            setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error' } : t));
          }
        };

        xhr.onerror = () => setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error' } : t));
        
        setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, xhr } : t));
        xhr.send(fd);
      } catch (err) {
        console.error('Task failed:', err);
        setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error' } : t));
      }
    }
  }, [refresh]);

  const cancelUpload = (id: string) => {
    setUploadTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task?.xhr) task.xhr.abort();
      return prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t);
    });
  };

  const clearHistory = () => setUploadTasks(prev => prev.filter(t => t.status === 'uploading' || t.status === 'processing'));

  return { uploadTasks, showUploadPanel, setShowUploadPanel, handleUpload, cancelUpload, clearHistory };
};
