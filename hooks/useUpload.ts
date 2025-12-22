
import { useState, useCallback } from 'react';
import { UploadTask } from '../types';
import { driveApi } from '../api/drive';
import { generateId } from '../utils';

export const useUpload = (refresh: () => void) => {
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const handleUpload = useCallback((files: FileList | null, currentFolderId: string | null) => {
    if (!files) return;
    const newTasks: UploadTask[] = Array.from(files).map(file => ({
      id: generateId(),
      file,
      progress: 0,
      status: 'uploading',
      targetFolderId: currentFolderId || 'root'
    }));

    setUploadTasks(prev => [...prev, ...newTasks]);
    setShowUploadPanel(true);

    newTasks.forEach(task => {
      const fd = new FormData();
      fd.append('file', task.file);
      fd.append('folderId', task.targetFolderId || 'root');

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
    });
  }, [refresh]);

  const cancelUpload = (id: string) => {
    setUploadTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task?.xhr) task.xhr.abort();
      return prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t);
    });
  };

  const clearHistory = () => setUploadTasks(prev => prev.filter(t => t.status === 'uploading'));

  return { uploadTasks, showUploadPanel, setShowUploadPanel, handleUpload, cancelUpload, clearHistory };
};
