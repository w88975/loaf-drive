
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useLocation } from 'https://esm.sh/react-router-dom@6';
import { Icons } from './constants';
import { DriveItem } from './types';
import { useFiles } from './hooks/useDriveQueries';
import { useUpload } from './hooks/useUpload';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { UploadPanel } from './components/overlays/UploadPanel';
import { PreviewModal } from './components/overlays/PreviewModal';
import { FilesView } from './views/FilesView';
import { TrashView } from './views/TrashView';

const App: React.FC = () => {
  const location = useLocation();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [path, setPath] = useState<DriveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);

  const { refetch: refetchFiles } = useFiles(currentFolderId, searchQuery);
  const { uploadTasks, showUploadPanel, setShowUploadPanel, handleUpload, cancelUpload, clearHistory } = useUpload(refetchFiles);

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleNavigate = useCallback((id: string | null, folderItem?: DriveItem) => {
    setCurrentFolderId(id);
    if (id === null) {
      setPath([]);
    } else if (folderItem) {
      const idx = path.findIndex(p => p.id === folderItem.id);
      if (idx !== -1) setPath(path.slice(0, idx + 1));
      else setPath(prev => [...prev, folderItem]);
    } else {
      const index = path.findIndex(p => p.id === id);
      if (index !== -1) setPath(path.slice(0, index + 1));
      else if (id === null) setPath([]);
    }
  }, [path]);

  const overallProgress = useMemo(() => {
    if (uploadTasks.length === 0) return 0;
    return uploadTasks.reduce((acc, t) => acc + t.progress, 0) / uploadTasks.length;
  }, [uploadTasks]);

  const isTrash = location.pathname === '/trash';

  return (
    <div 
      className="flex h-screen bg-white text-black font-mono overflow-hidden relative select-none"
      onDragEnter={(e) => { e.preventDefault(); if (!isTrash) dragCounter.current++; if (e.dataTransfer.items.length && !isTrash) setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); if (!isTrash) dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); dragCounter.current = 0; if (!isTrash) handleUpload(e.dataTransfer.files, currentFolderId); }}
    >
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm pointer-events-none flex items-center justify-center p-8">
          <div className="w-full h-full border-4 border-dashed border-yellow-400 flex flex-col items-center justify-center text-yellow-400 space-y-4">
            <Icons.Plus className="w-24 h-24 animate-bounce" />
            <span className="text-4xl font-bold italic uppercase tracking-widest">Drop files to upload</span>
          </div>
        </div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSelectRoot={() => handleNavigate(null)} 
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <Header 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          currentFolderId={isTrash ? 'trash' : currentFolderId}
          navigationHistory={isTrash ? [] : path}
          onNavigate={(id) => handleNavigate(id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          uploadingCount={uploadTasks.filter(t => t.status === 'uploading').length}
          overallProgress={overallProgress}
          onToggleUploadPanel={() => setShowUploadPanel(!showUploadPanel)}
        />

        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={
              <FilesView 
                currentFolderId={currentFolderId}
                setCurrentFolderId={handleNavigate}
                searchQuery={searchQuery}
                viewMode={viewMode}
                onPreview={setPreviewItem}
                onUploadClick={() => document.getElementById('file-upload')?.click()}
              />
            } />
            <Route path="/trash" element={
              <TrashView searchQuery={searchQuery} viewMode={viewMode} />
            } />
          </Routes>
        </div>

        <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files, currentFolderId)} />
      </main>
      
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      {showUploadPanel && <UploadPanel tasks={uploadTasks} onClose={() => setShowUploadPanel(false)} onCancel={cancelUpload} onClear={clearHistory} />}
    </div>
  );
};

export default App;
