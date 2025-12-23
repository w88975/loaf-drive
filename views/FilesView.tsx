import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Icons } from '../constants';
import { DriveItem, SortKey, SortOrder } from '../types';
import { useFiles, useDriveMutations } from '../hooks/useDriveQueries';
import { GridView } from '../components/drive/GridView';
import { ListView } from '../components/drive/ListView';
import { ContextMenu } from '../components/drive/ContextMenu';
import { NewFolderAction } from '../components/drive/NewFolderAction';
import { SelectionBar } from '../components/drive/SelectionBar';
import { NewFolderModal, RenameModal, DeleteModal, MoveModal, PasswordModal } from '../components/overlays/Modals';

const STORAGE_KEY = 'geek_drive_folder_passwords';

interface FilesViewProps {
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null, item?: DriveItem) => void;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  onPreview: (item: DriveItem) => void;
  onUploadClick: () => void;
}

export const FilesView: React.FC<FilesViewProps> = ({ 
  currentFolderId, setCurrentFolderId, searchQuery, viewMode, onPreview, onUploadClick 
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: DriveItem } | null>(null);
  const [activeModal, setActiveModal] = useState<'new-folder' | 'rename' | 'delete' | 'move' | 'password-enter' | 'password-unlock' | null>(null);
  const [targetItem, setTargetItem] = useState<DriveItem | null>(null);

  // 从 sessionStorage 获取当前文件夹的密码
  const getCachedPassword = (folderId: string | null): string | undefined => {
    if (!folderId) return undefined;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return undefined;
      const passwords = JSON.parse(stored);
      return passwords[folderId];
    } catch {
      return undefined;
    }
  };

  const setCachedPassword = (folderId: string, password: string) => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const passwords = stored ? JSON.parse(stored) : {};
      passwords[folderId] = password;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
    } catch (e) {
      console.error('Failed to cache password', e);
    }
  };

  const removeCachedPassword = (folderId: string) => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const passwords = JSON.parse(stored);
      delete passwords[folderId];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
    } catch {}
  };

  // 当前激活的密码（用于 React Query 依赖）
  const [folderPassword, setFolderPassword] = useState<string | undefined>(getCachedPassword(currentFolderId));

  const { data: items = [], isLoading, error } = useFiles(currentFolderId, searchQuery, folderPassword);
  const { createFolder, renameItem, toggleLock, deleteItems, moveItems } = useDriveMutations();

  // 监听文件夹切换，同步缓存密码
  useEffect(() => {
    const cached = getCachedPassword(currentFolderId);
    setFolderPassword(cached);
  }, [currentFolderId]);

  // 如果请求报错 403，说明缓存的密码失效了，清除缓存并提示重新输入
  useEffect(() => {
    if (error && (error as any).code === 403 && currentFolderId) {
      removeCachedPassword(currentFolderId);
      setFolderPassword(undefined);
      setActiveModal('password-enter');
    }
  }, [error, currentFolderId]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  const handleContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    if (!selectedIds.has(item.id)) setSelectedIds(new Set([item.id]));
    setContextMenu({ x: e.pageX, y: e.pageY, item });
  };

  const handleNavigate = (item: DriveItem) => {
    if (item.isLocked) {
      const cached = getCachedPassword(item.id);
      if (cached) {
        setFolderPassword(cached);
        setCurrentFolderId(item.id, item);
      } else {
        setTargetItem(item);
        setActiveModal('password-enter');
      }
    } else {
      setFolderPassword(undefined);
      setCurrentFolderId(item.id, item);
    }
  };

  const handlePasswordConfirm = (password: string) => {
    if (activeModal === 'password-enter' && targetItem) {
      setCachedPassword(targetItem.id, password);
      setFolderPassword(password);
      setCurrentFolderId(targetItem.id, targetItem);
      setActiveModal(null);
    } else if (activeModal === 'password-enter' && !targetItem && currentFolderId) {
      // 这里的逻辑处理 Retry Password 按钮
      setCachedPassword(currentFolderId, password);
      setFolderPassword(password);
      setActiveModal(null);
    } else if (activeModal === 'password-unlock' && targetItem) {
      toggleLock.mutate(
        { id: targetItem.id, isLocked: false, password },
        { 
          onSuccess: () => {
            removeCachedPassword(targetItem.id);
            setActiveModal(null);
          }
        }
      );
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu) setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu]);

  return (
    <div className="flex flex-col h-full" onClick={() => selectedIds.size > 0 && setSelectedIds(new Set())}>
      <div className="p-4 md:p-6 pb-2 flex flex-wrap gap-2">
        <button onClick={onUploadClick} className="flex items-center space-x-2 bg-black text-white px-3 md:px-4 py-2 hover:bg-yellow-400 hover:text-black border-2 border-black text-[10px] md:text-xs font-bold uppercase transition-colors">
          <Icons.Plus className="w-3 h-3" /><span>Upload</span>
        </button>
        <NewFolderAction onClick={() => setActiveModal('new-folder')} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Icons.Grid className="w-10 h-10 animate-spin" /></div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="text-red-500 font-bold uppercase italic text-sm">Access Denied</div>
             <p className="text-[10px] text-gray-500">{(error as any).message || 'This folder is encrypted or access timed out.'}</p>
             <div className="flex space-x-2">
               <button onClick={() => setCurrentFolderId(null)} className="border-2 border-black px-4 py-2 text-xs font-bold hover:bg-yellow-400 uppercase">Back to Root</button>
               {(error as any).message?.includes('403') || (error as any).code === 403 ? (
                 <button onClick={() => setActiveModal('password-enter')} className="bg-black text-white px-4 py-2 text-xs font-bold hover:bg-yellow-400 hover:text-black uppercase border-2 border-black">Retry Password</button>
               ) : null}
             </div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 uppercase font-bold italic">Empty Directory</div>
        ) : viewMode === 'grid' ? (
          <GridView 
            items={sortedItems} selectedIds={selectedIds}
            onItemClick={(item) => selectedIds.size > 0 ? toggleSelect(item.id) : item.type === 'folder' ? handleNavigate(item) : onPreview(item)}
            onItemLongPress={(item) => toggleSelect(item.id)}
            onContextMenu={handleContextMenu}
            onRename={(item) => { setTargetItem(item); setActiveModal('rename'); }}
            onMove={(item) => { setSelectedIds(new Set([item.id])); setActiveModal('move'); }}
            onDelete={(item) => { setTargetItem(item); setActiveModal('delete'); }}
          />
        ) : (
          <ListView 
            items={sortedItems} selectedIds={selectedIds}
            onItemClick={(item) => selectedIds.size > 0 ? toggleSelect(item.id) : item.type === 'folder' ? handleNavigate(item) : onPreview(item)}
            onItemLongPress={(item) => toggleSelect(item.id)}
            onContextMenu={handleContextMenu}
            onSelectAll={() => setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
            onSort={(key) => { if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortOrder('asc'); } }}
            sortKey={sortKey} sortOrder={sortOrder}
            onRename={(item) => { setTargetItem(item); setActiveModal('rename'); }}
            onMove={(item) => { setSelectedIds(new Set([item.id])); setActiveModal('move'); }}
            onDelete={(item) => { setTargetItem(item); setActiveModal('delete'); }}
          />
        )}
      </div>

      {activeModal === 'new-folder' && <NewFolderModal onClose={() => setActiveModal(null)} onConfirm={async (name) => { createFolder.mutate({ name, parentId: currentFolderId }); setActiveModal(null); }} />}
      {activeModal === 'rename' && targetItem && <RenameModal item={targetItem} onClose={() => setActiveModal(null)} onConfirm={async (name) => { renameItem.mutate({ id: targetItem.id, newName: name }); setActiveModal(null); }} />}
      
      {(activeModal === 'password-enter' || activeModal === 'password-unlock') && (
        <PasswordModal 
          folderName={targetItem?.name || (items.find(i => i.id === currentFolderId)?.name) || 'Folder'} 
          onClose={() => setActiveModal(null)} 
          onConfirm={handlePasswordConfirm} 
        />
      )}

      {activeModal === 'delete' && (
        <DeleteModal count={selectedIds.size || (targetItem ? 1 : 0)} onClose={() => setActiveModal(null)} onConfirm={async () => { 
          const ids = selectedIds.size > 0 ? [...selectedIds] : (targetItem ? [targetItem.id] : []);
          deleteItems.mutate(ids); setSelectedIds(new Set()); setActiveModal(null); 
        }} />
      )}
      {activeModal === 'move' && <MoveModal count={selectedIds.size} onClose={() => setActiveModal(null)} onConfirm={async (destId) => { moveItems.mutate({ ids: [...selectedIds], targetId: destId }); setSelectedIds(new Set()); setActiveModal(null); }} />}

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} y={contextMenu.y} item={contextMenu.item}
          onRename={() => { setTargetItem(contextMenu.item); setActiveModal('rename'); setContextMenu(null); }}
          onMove={() => { setSelectedIds(new Set([contextMenu.item.id])); setActiveModal('move'); setContextMenu(null); }}
          onToggleLock={() => { 
            if (contextMenu.item.isLocked) {
              setTargetItem(contextMenu.item);
              setActiveModal('password-unlock');
            } else {
              toggleLock.mutate({ id: contextMenu.item.id, isLocked: true }); 
            }
            setContextMenu(null); 
          }}
          onDelete={() => { setTargetItem(contextMenu.item); setActiveModal('delete'); setContextMenu(null); }}
        />
      )}

      {selectedIds.size > 0 && <SelectionBar count={selectedIds.size} onMove={() => setActiveModal('move')} onDelete={() => setActiveModal('delete')} onClear={() => setSelectedIds(new Set())} />}
    </div>
  );
};