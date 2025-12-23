
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UploadTask } from '../types';
import { driveApi } from '../api/drive';
import { generateId, getVideoFramesWeb, getImageThumbnailWeb, dataURItoBlob } from '../utils';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
const CHUNKED_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold

export const useUpload = () => {
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const queryClient = useQueryClient();

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
      const isImage = task.file.type.startsWith('image/') && task.file.type !== 'image/svg+xml';
      let previewR2Keys: string[] = [];

      try {
        // Step 1: Pre-processing (Previews)
        if (isVideo || isImage) {
          setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'processing' } : t));
          
          if (isVideo) {
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
          } else if (isImage) {
            const imageUrl = URL.createObjectURL(task.file);
            try {
              const thumbDataUri = await getImageThumbnailWeb(imageUrl, 100, 100);
              const blob = dataURItoBlob(thumbDataUri);
              const result = await driveApi.uploadPreview(blob);
              if (result.code === 0) {
                previewR2Keys.push(result.data.r2Key);
              }
            } finally {
              URL.revokeObjectURL(imageUrl);
            }
          }
        }

        // Step 2: Main Upload (Simple or Chunked)
        if (task.file.size > CHUNKED_THRESHOLD) {
          // CHUNKED UPLOAD
          setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'uploading' } : t));
          
          const initRes = await driveApi.uploadInit({
            filename: task.file.name,
            folderId: task.targetFolderId,
            totalSize: task.file.size,
            mimeType: task.file.type
          });

          if (initRes.code !== 0) throw new Error(initRes.message);

          const { uploadId, r2Key, id } = initRes.data;
          const totalChunks = Math.ceil(task.file.size / CHUNK_SIZE);
          const parts: { partNumber: number, etag: string }[] = [];

          for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, task.file.size);
            const chunk = task.file.slice(start, end);

            const fd = new FormData();
            fd.append('chunk', chunk);
            fd.append('uploadId', uploadId);
            fd.append('r2Key', r2Key);
            fd.append('partNumber', (i + 1).toString());

            const partRes = await driveApi.uploadPart(fd);
            if (partRes.code !== 0) throw new Error(partRes.message);

            parts.push(partRes.data);
            
            const progress = ((i + 1) / totalChunks) * 100;
            setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress } : t));
          }

          const completeRes = await driveApi.uploadComplete({
            id,
            uploadId,
            r2Key,
            parts,
            previews: previewR2Keys
          });

          if (completeRes.code === 0) {
            setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t));
            queryClient.invalidateQueries({ queryKey: ['files'] });
          } else {
            throw new Error(completeRes.message);
          }

        } else {
          // SIMPLE UPLOAD
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
                queryClient.invalidateQueries({ queryKey: ['files'] });
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
        }
      } catch (err) {
        console.error('Task failed:', err);
        setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error' } : t));
      }
    }
  }, [queryClient]);

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
