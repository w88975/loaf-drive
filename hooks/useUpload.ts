
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
      // Step 1: Pre-processing (Previews)
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
            // Updated to 150x150 for better visual quality
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

      // Step 2: Main Upload (Simple or Chunked)
      if (file.size > CHUNKED_THRESHOLD) {
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
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'uploading' } : t));

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folderId', targetFolderId);
        if (previewR2Keys.length > 0) {
          fd.append('previews', JSON.stringify(previewR2Keys));
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', driveApi.getUploadUrl());

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

        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, xhr } : t));
        xhr.send(fd);
        await resultPromise;
      }
    } catch (err) {
      console.error(`Upload task failed for ${file.name}:`, err);
      setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error' } : t));
    }
  };

  const processEntry = async (entry: any, parentFolderId: string) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
      // Concurrently start file upload
      uploadSingleFile(file, parentFolderId);
    } else if (entry.isDirectory) {
      // Must await folder creation to get ID for children, but siblings can be concurrent
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
          // Process all entries in this batch concurrently
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

  const handleUpload = useCallback(async (input: DataTransfer | FileList | null, currentFolderId: string | null) => {
    if (!input) return;
    setShowUploadPanel(true);
    const targetId = currentFolderId || 'root';

    if (input instanceof DataTransfer) {
      const items = Array.from(input.items);
      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          // Start process concurrently
          processEntry(entry, targetId);
        }
      }
    } else {
      const files = Array.from(input);
      for (const file of files) {
        // Start process concurrently
        uploadSingleFile(file, targetId);
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
