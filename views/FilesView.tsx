/**
 * 文件浏览主视图组件
 * 功能：文件和文件夹的浏览、管理、操作界面
 * 核心特性：
 * 1. 双视图模式 - 网格视图和列表视图切换
 * 2. 多选操作 - 批量删除、移动
 * 3. 加密文件夹 - 密码缓存和解锁
 * 4. 右键菜单 - 快捷操作
 * 5. 排序功能 - 按名称、大小、时间排序
 * 6. 模态框管理 - 新建、重命名、删除、移动、密码输入
 */

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

/**
 * 文件夹密码缓存的 sessionStorage 键名
 * 用于在会话期间记住已输入的文件夹密码
 */
const STORAGE_KEY = 'geek_drive_folder_passwords';

interface FilesViewProps {
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null, item?: DriveItem) => void;
  navigationHistory: DriveItem[];
  searchQuery: string;
  viewMode: 'grid' | 'list';
  onPreview: (item: DriveItem) => void;
  onUploadClick: () => void;
}

export const FilesView: React.FC<FilesViewProps> = ({ 
  currentFolderId, setCurrentFolderId, navigationHistory, searchQuery, viewMode, onPreview, onUploadClick 
}) => {
  /**
   * 多选状态：已选中的文件/文件夹 ID 集合
   */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  /**
   * 排序字段和方向
   */
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  /**
   * 右键菜单状态
   * - contextMenu: 文件/文件夹右键菜单
   * - containerContextMenu: 空白区域右键菜单
   */
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: DriveItem } | null>(null);
  const [containerContextMenu, setContainerContextMenu] = useState<{ x: number, y: number } | null>(null);
  
  /**
   * 当前激活的模态框类型
   */
  const [activeModal, setActiveModal] = useState<'new-folder' | 'rename' | 'delete' | 'move' | 'password-enter' | 'password-unlock' | null>(null);
  
  /**
   * 当前操作的目标项
   */
  const [targetItem, setTargetItem] = useState<DriveItem | null>(null);

  /**
   * 从 sessionStorage 获取缓存的文件夹密码
   * 功能：避免用户在会话期间重复输入密码
   */
  const getCachedPassword = useCallback((folderId: string | null): string | undefined => {
    if (!folderId) return undefined;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return undefined;
      const passwords = JSON.parse(stored);
      return passwords[folderId];
    } catch {
      return undefined;
    }
  }, []);

  /**
   * 缓存文件夹密码到 sessionStorage
   * 仅在当前会话有效，关闭浏览器后自动清除
   */
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

  /**
   * 移除缓存的文件夹密码
   * 用于解锁文件夹或密码验证失败时
   */
  const removeCachedPassword = (folderId: string) => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const passwords = JSON.parse(stored);
      delete passwords[folderId];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
    } catch {}
  };

  /**
   * 当前文件夹的密码状态
   * 初始化时从缓存读取，配合 App 层的 key 机制实现面包屑导航时自动带入密码
   */
  const [folderPassword, setFolderPassword] = useState<string | undefined>(() => getCachedPassword(currentFolderId));

  /**
   * 获取文件列表和操作方法
   */
  const { data: items = [], isLoading, error, refetch } = useFiles(currentFolderId, searchQuery, folderPassword);
  const { createFolder, renameItem, toggleLock, deleteItems, moveItems } = useDriveMutations();

  /**
   * 监听 403 鉴权错误
   * 当密码错误或失效时，清除缓存并弹出密码输入框
   */
  useEffect(() => {
    if (error && (error as any).code === 403 && currentFolderId) {
      removeCachedPassword(currentFolderId);
      setFolderPassword(undefined);
      setActiveModal('password-enter');
    }
  }, [error, currentFolderId]);

  /**
   * 切换单个文件/文件夹的选中状态
   * 功能：用于多选模式下的勾选/取消勾选
   */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * 排序后的文件列表
   * 功能：按指定字段和方向排序，文件夹始终在文件前面
   * 排序规则：
   * 1. 文件夹优先于文件
   * 2. 同类型按 sortKey 和 sortOrder 排序
   */
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

  /**
   * 处理文件/文件夹右键菜单
   * 功能：显示操作菜单，如果项目未选中则自动选中它
   */
  const handleContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    setContainerContextMenu(null);
    if (!selectedIds.has(item.id)) setSelectedIds(new Set([item.id]));
    setContextMenu({ x: e.pageX, y: e.pageY, item });
  };

  /**
   * 处理空白区域右键菜单
   * 功能：显示目录级别的操作菜单（新建文件夹、刷新）
   */
  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu(null);
    setContainerContextMenu({ x: e.pageX, y: e.pageY });
  };

  /**
   * 处理文件夹导航
   * 功能：进入文件夹，处理加密文件夹的密码验证
   * @param item 要进入的文件夹
   * 
   * 逻辑：
   * - 加密文件夹：先检查缓存密码，有则直接进入，无则弹出密码输入框
   * - 普通文件夹：直接进入
   */
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

  /**
   * 处理密码确认
   * 功能：根据模态框类型处理不同的密码操作
   * - password-enter: 输入密码进入加密文件夹
   * - password-unlock: 输入密码解锁文件夹
   */
  const handlePasswordConfirm = (password: string) => {
    if (activeModal === 'password-enter') {
      const idToCache = targetItem?.id || currentFolderId;
      if (idToCache) {
        setCachedPassword(idToCache, password);
        setFolderPassword(password);
        if (targetItem) {
          setCurrentFolderId(targetItem.id, targetItem);
          setTargetItem(null);
        }
        setActiveModal(null);
      }
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

  /**
   * 监听全局点击事件
   * 功能：点击任意位置关闭右键菜单
   */
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu) setContextMenu(null);
      if (containerContextMenu) setContainerContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu, containerContextMenu]);

  /**
   * 获取当前文件夹名称
   * 功能：用于密码输入框的标题显示
   * 优先使用 targetItem，其次从导航历史中查找
   */
  const currentFolderName = useMemo(() => {
    if (targetItem) return targetItem.name;
    const historyItem = navigationHistory.find(h => h.id === currentFolderId);
    return historyItem?.name || 'FOLDER';
  }, [targetItem, navigationHistory, currentFolderId]);

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏：上传和新建文件夹按钮 */}
      <div className="p-4 md:p-6 pb-2 flex flex-wrap gap-2">
        <button onClick={onUploadClick} className="flex items-center space-x-2 bg-black text-white px-3 md:px-4 py-2 hover:bg-yellow-400 hover:text-black border-2 border-black text-[10px] md:text-xs font-bold uppercase transition-colors">
          <Icons.Plus className="w-3 h-3" /><span>Upload</span>
        </button>
        <NewFolderAction onClick={() => setActiveModal('new-folder')} />
      </div>

      {/* 文件列表主区域：支持右键菜单 */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6"
        onContextMenu={handleContainerContextMenu}
      >
        {/* 加载中状态 */}
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Icons.Grid className="w-10 h-10 animate-spin" /></div>
        
        /* 鉴权失败状态：加密文件夹密码错误或未提供 */
        ) : error && !items.length ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="text-red-500 font-bold uppercase italic text-sm">Access Denied</div>
             <p className="text-[10px] text-gray-500">{(error as any).message || 'This folder is encrypted or access timed out.'}</p>
             <div className="flex space-x-2">
               <button onClick={() => setCurrentFolderId(null)} className="border-2 border-black px-4 py-2 text-xs font-bold hover:bg-yellow-400 uppercase">Back to Root</button>
               <button onClick={() => setActiveModal('password-enter')} className="bg-black text-white px-4 py-2 text-xs font-bold hover:bg-yellow-400 hover:text-black uppercase border-2 border-black">Retry Password</button>
             </div>
          </div>
        
        /* 空目录状态 */
        ) : sortedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 uppercase font-bold italic">Empty Directory</div>
        
        /* 网格视图 */
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
        
        /* 列表视图 */
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

      {/* 新建文件夹模态框 */}
      {activeModal === 'new-folder' && <NewFolderModal onClose={() => setActiveModal(null)} onConfirm={async (name) => { createFolder.mutate({ name, parentId: currentFolderId }); setActiveModal(null); }} />}
      
      {/* 重命名模态框 */}
      {activeModal === 'rename' && targetItem && <RenameModal item={targetItem} onClose={() => setActiveModal(null)} onConfirm={async (name) => { renameItem.mutate({ id: targetItem.id, newName: name }); setActiveModal(null); }} />}
      
      {/* 密码输入模态框：进入加密文件夹或解锁文件夹 */}
      {(activeModal === 'password-enter' || activeModal === 'password-unlock') && (
        <PasswordModal 
          folderName={currentFolderName} 
          onClose={() => setActiveModal(null)} 
          onConfirm={handlePasswordConfirm} 
        />
      )}

      {/* 删除确认模态框 */}
      {activeModal === 'delete' && (
        <DeleteModal 
          title="Move to Trash?"
          count={selectedIds.size || (targetItem ? 1 : 0)} 
          isPermanent={false}
          onClose={() => setActiveModal(null)} 
          onConfirm={async () => { 
            const ids = selectedIds.size > 0 ? [...selectedIds] : (targetItem ? [targetItem.id] : []);
            deleteItems.mutate(ids); setSelectedIds(new Set()); setActiveModal(null); 
          }} 
        />
      )}
      
      {/* 移动文件模态框 */}
      {activeModal === 'move' && <MoveModal count={selectedIds.size} onClose={() => setActiveModal(null)} onConfirm={async (destId) => { moveItems.mutate({ ids: [...selectedIds], targetId: destId }); setSelectedIds(new Set()); setActiveModal(null); }} />}

      {/* 文件/文件夹右键菜单 */}
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

      {/* 空白区域右键菜单 */}
      {containerContextMenu && (
        <div 
          className="fixed z-[140] w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1 animate-in fade-in zoom-in-95 duration-100" 
          style={{ top: containerContextMenu.y, left: containerContextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-4 py-1 border-b border-black/10 mb-1">
            <p className="text-[8px] text-gray-400 font-black uppercase">Directory Options</p>
          </div>
          <button 
            onClick={() => { setActiveModal('new-folder'); setContainerContextMenu(null); }} 
            className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors flex items-center justify-between group"
          >
            <span>New Folder</span>
            <span className="text-[10px]">📁+</span>
          </button>
          <button 
            onClick={() => { refetch(); setContainerContextMenu(null); }} 
            className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors border-t border-black/5 flex items-center justify-between group"
          >
            <span>Refresh</span>
            <span className="text-[10px]">🔄</span>
          </button>
        </div>
      )}

      {/* 多选操作栏：底部悬浮，显示选中数量和批量操作按钮 */}
      {selectedIds.size > 0 && <SelectionBar count={selectedIds.size} onMove={() => setActiveModal('move')} onDelete={() => setActiveModal('delete')} onClear={() => setSelectedIds(new Set())} />}
    </div>
  );
};
