
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Icons } from './constants';
import { DriveItem, SortKey, SortOrder } from './types';
import { useFiles, useRecycleBin, useDriveMutations, useRecycleMutations } from './hooks/useDriveQueries';
import { useUpload } from './hooks/useUpload';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GridView } from './components/drive/GridView';
import { ListView } from './components/drive/ListView';
import { ContextMenu } from './components/drive/ContextMenu';
import { NewFolderAction } from './components/drive/NewFolderAction';
import { SelectionBar } from './components/drive/SelectionBar';
import { UploadPanel } from './components/overlays/UploadPanel';
import { PreviewModal } from './components/overlays/PreviewModal';
import { NewFolderModal, RenameModal, DeleteModal, MoveModal } from './components/overlays/Modals';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'trash'>('files');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [path, setPath] = useState<DriveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: DriveItem } | null>(null);

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Overlay states
  const [activeModal, setActiveModal] = useState<'new-folder' | 'rename' | 'delete' | 'move' | 'clear-trash' | 'delete-permanent' | null>(null);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [targetItem, setTargetItem] = useState<DriveItem | null>(null);

  // TanStack Queries
  const { data: driveFiles = [], isLoading: isDriveLoading, refetch: refetchFiles } = useFiles(currentFolderId, searchQuery);
  const { data: trashFiles = [], isLoading: isTrashLoading } = useRecycleBin(searchQuery);
  const { createFolder, renameItem, deleteItems, moveItems } = useDriveMutations();
  const { permanentlyDelete, clearBin } = useRecycleMutations();

  const items = activeTab === 'files' ? driveFiles : trashFiles;
  const isLoading = activeTab === 'files' ? isDriveLoading : isTrashLoading;
  
  // Custom Hooks (Upload remains XHR-based for progress tracking)
  const { uploadTasks, showUploadPanel, setShowUploadPanel, handleUpload, cancelUpload, clearHistory } = useUpload(refetchFiles);

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleNavigate = useCallback((id: string | null, folderItem?: DriveItem) => {
    setActiveTab('files');
    setCurrentFolderId(id);
    setSelectedIds(new Set());
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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map(i => i.id)));
  };

  const handleItemClick = (item: DriveItem) => {
    if (selectedIds.size > 0) toggleSelect(item.id);
    else if (activeTab === 'files' && item.type === 'folder') handleNavigate(item.id, item);
    else setPreviewItem(item);
  };

  const handleContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    if (selectedIds.size === 0) setSelectedIds(new Set([item.id]));
    setContextMenu({ x: e.pageX, y: e.pageY, item });
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      const valA = a[sortKey] || '';
      const valB = b[sortKey] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortKey, sortOrder]);

  const overallProgress = useMemo(() => {
    if (uploadTasks.length === 0) return 0;
    return uploadTasks.reduce((acc, t) => acc + t.progress, 0) / uploadTasks.length;
  }, [uploadTasks]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <div 
      className="flex h-screen bg-white text-black font-mono overflow-hidden relative select-none"
      onDragEnter={(e) => { e.preventDefault(); if (activeTab === 'files') dragCounter.current++; if (e.dataTransfer.items.length && activeTab === 'files') setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); if (activeTab === 'files') dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); dragCounter.current = 0; if (activeTab === 'files') handleUpload(e.dataTransfer.files, currentFolderId); }}
      onClick={() => { if (selectedIds.size > 0) setSelectedIds(new Set()); }}
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
        activeFolderId={currentFolderId} 
        activeTab={activeTab}
        onSelectRoot={() => handleNavigate(null)} 
        onSelectTrash={() => { setActiveTab('trash'); setSelectedIds(new Set()); }}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <Header 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          currentFolderId={activeTab === 'trash' ? 'trash' : currentFolderId}
          navigationHistory={activeTab === 'trash' ? [] : path}
          onNavigate={(id) => id === 'trash' ? setActiveTab('trash') : handleNavigate(id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          uploadingCount={uploadTasks.filter(t => t.status === 'uploading').length}
          overallProgress={overallProgress}
          onToggleUploadPanel={() => setShowUploadPanel(!showUploadPanel)}
        />

        <div className="p-4 md:p-6 pb-2 flex flex-wrap gap-2">
          {activeTab === 'files' ? (
            <>
              <button onClick={() => document.getElementById('file-upload')?.click()} className="flex items-center space-x-2 bg-black text-white px-3 md:px-4 py-2 hover:bg-yellow-400 hover:text-black border-2 border-black text-[10px] md:text-xs font-bold uppercase transition-colors">
                <Icons.Plus className="w-3 h-3" /><span>Upload</span>
              </button>
              <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files, currentFolderId)} />
              <NewFolderAction onClick={() => setActiveModal('new-folder')} />
            </>
          ) : (
            <button 
              onClick={() => setActiveModal('clear-trash')} 
              className="flex items-center space-x-2 bg-red-600 text-white px-3 md:px-4 py-2 hover:bg-black transition-colors border-2 border-black text-[10px] md:text-xs font-bold uppercase"
              disabled={items.length === 0}
            >
              <Icons.Trash className="w-3 h-3" /><span>Empty Trash</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center"><Icons.Grid className="w-10 h-10 animate-spin" /></div>
          ) : sortedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 uppercase font-bold italic">
              {activeTab === 'trash' ? 'Trash is Empty' : 'Empty Directory'}
            </div>
          ) : viewMode === 'grid' ? (
            <GridView 
              items={sortedItems}
              selectedIds={selectedIds}
              onItemClick={handleItemClick}
              onItemLongPress={(item) => { toggleSelect(item.id); if ('vibrate' in navigator) navigator.vibrate(50); }}
              onContextMenu={handleContextMenu}
              onRename={(item) => { setTargetItem(item); setActiveModal('rename'); }}
              onMove={(item) => { setSelectedIds(new Set([item.id])); setActiveModal('move'); }}
              onDelete={(item) => { setTargetItem(item); setActiveModal(activeTab === 'trash' ? 'delete-permanent' : 'delete'); }}
            />
          ) : (
            <ListView 
              items={sortedItems}
              selectedIds={selectedIds}
              onItemClick={handleItemClick}
              onItemLongPress={(item) => { toggleSelect(item.id); if ('vibrate' in navigator) navigator.vibrate(50); }}
              onContextMenu={handleContextMenu}
              onSelectAll={handleSelectAll}
              onSort={(key) => { if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortOrder('asc'); } }}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onRename={(item) => { setTargetItem(item); setActiveModal('rename'); }}
              onMove={(item) => { setSelectedIds(new Set([item.id])); setActiveModal('move'); }}
              onDelete={(item) => { setTargetItem(item); setActiveModal(activeTab === 'trash' ? 'delete-permanent' : 'delete'); }}
            />
          )}
        </div>
      </main>

      {/* Modals & Overlays */}
      {activeModal === 'new-folder' && <NewFolderModal onClose={() => setActiveModal(null)} onConfirm={async (name) => { createFolder.mutate({ name, parentId: currentFolderId }); setActiveModal(null); }} />}
      {activeModal === 'rename' && targetItem && <RenameModal item={targetItem} onClose={() => setActiveModal(null)} onConfirm={async (name) => { renameItem.mutate({ id: targetItem.id, newName: name }); setActiveModal(null); }} />}
      
      {activeModal === 'delete' && (
        <DeleteModal 
          count={selectedIds.size || (targetItem ? 1 : 0)} 
          onClose={() => { setActiveModal(null); setTargetItem(null); }} 
          onConfirm={async () => { 
            const ids = selectedIds.size > 0 ? [...selectedIds] : (targetItem ? [targetItem.id] : []);
            deleteItems.mutate(ids); 
            setSelectedIds(new Set()); 
            setActiveModal(null); 
            setTargetItem(null);
          }} 
        />
      )}

      {activeModal === 'delete-permanent' && (
        <DeleteModal 
          title="Delete Permanently?"
          count={selectedIds.size || (targetItem ? 1 : 0)} 
          onClose={() => { setActiveModal(null); setTargetItem(null); }} 
          onConfirm={async () => { 
            const ids = selectedIds.size > 0 ? [...selectedIds] : (targetItem ? [targetItem.id] : []);
            await Promise.all(ids.map(id => permanentlyDelete.mutateAsync(id)));
            setSelectedIds(new Set()); 
            setActiveModal(null); 
            setTargetItem(null);
          }} 
        />
      )}

      {activeModal === 'clear-trash' && (
        <DeleteModal 
          title="Clear Recycle Bin?"
          count={items.length}
          onClose={() => setActiveModal(null)} 
          onConfirm={async () => { 
            clearBin.mutate(); 
            setSelectedIds(new Set()); 
            setActiveModal(null); 
          }} 
        />
      )}

      {activeModal === 'move' && <MoveModal count={selectedIds.size} onClose={() => setActiveModal(null)} onConfirm={async (destId) => { moveItems.mutate({ ids: [...selectedIds], targetId: destId }); setSelectedIds(new Set()); setActiveModal(null); }} />}
      
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      
      {showUploadPanel && <UploadPanel tasks={uploadTasks} onClose={() => setShowUploadPanel(false)} onCancel={cancelUpload} onClear={clearHistory} />}
      {selectedIds.size > 0 && <SelectionBar count={selectedIds.size} onMove={() => setActiveModal('move')} onDelete={() => setActiveModal(activeTab === 'trash' ? 'delete-permanent' : 'delete')} onClear={() => setSelectedIds(new Set())} />}

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          item={contextMenu.item}
          onRename={() => { setTargetItem(contextMenu.item); setActiveModal('rename'); setContextMenu(null); }}
          onMove={() => { setActiveModal('move'); setContextMenu(null); }}
          onDelete={() => { setTargetItem(contextMenu.item); setActiveModal(activeTab === 'trash' ? 'delete-permanent' : 'delete'); setContextMenu(null); }}
        />
      )}
    </div>
  );
};

export default App;
