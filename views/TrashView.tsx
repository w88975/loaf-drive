/**
 * 回收站视图组件
 * 功能：显示和管理回收站中的已删除文件
 * 核心特性：
 * 1. 永久删除 - 彻底删除文件，清理 R2 存储
 * 2. 清空回收站 - 一键删除所有文件
 * 3. 双视图模式 - 网格和列表视图
 * 4. 多选批量删除 - 支持选择多个文件批量操作
 * 
 * 注意：回收站中的文件无法预览、重命名或移动
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from '../constants';
import { DriveItem, SortKey, SortOrder } from '../types';
import { useRecycleBin, useRecycleMutations } from '../hooks/useDriveQueries';
import { GridView } from '../components/drive/GridView';
import { ListView } from '../components/drive/ListView';
import { SelectionBar } from '../components/drive/SelectionBar';
import { DeleteModal } from '../components/overlays/Modals';

interface TrashViewProps {
  searchQuery: string;
  viewMode: 'grid' | 'list';
}

export const TrashView: React.FC<TrashViewProps> = ({ searchQuery, viewMode }) => {
  /**
   * 多选状态：已选中的文件 ID 集合
   */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  /**
   * 排序字段和方向
   */
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  /**
   * 当前激活的模态框类型
   * - clear: 清空回收站确认
   * - delete-permanent: 永久删除确认
   */
  const [activeModal, setActiveModal] = useState<'clear' | 'delete-permanent' | null>(null);
  
  /**
   * 当前操作的目标项
   */
  const [targetItem, setTargetItem] = useState<DriveItem | null>(null);

  /**
   * 获取回收站文件列表和操作方法
   */
  const { data: items = [], isLoading } = useRecycleBin(searchQuery);
  const { permanentlyDelete, clearBin } = useRecycleMutations();

  /**
   * 排序后的文件列表
   * 注意：回收站不区分文件夹和文件，直接按字段排序
   */
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const valA = a[sortKey] || '';
      const valB = b[sortKey] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortKey, sortOrder]);

  /**
   * 处理清空回收站确认
   * 功能：删除回收站中的所有文件
   */
  const handleConfirmClear = () => {
    clearBin.mutate(undefined, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setActiveModal(null);
      }
    });
  };

  /**
   * 处理永久删除确认
   * 功能：彻底删除选中的文件（批量或单个）
   * API 限制：后端接口每次只能删除一个文件，因此使用 Promise.all 并发请求
   */
  const handleConfirmPermanentDelete = () => {
    const ids = selectedIds.size > 0 ? [...selectedIds] : (targetItem ? [targetItem.id] : []);
    Promise.all(ids.map(id => permanentlyDelete.mutateAsync(id))).then(() => {
      setSelectedIds(new Set());
      setActiveModal(null);
    });
  };

  return (
    <div className="flex flex-col h-full" onClick={() => selectedIds.size > 0 && setSelectedIds(new Set())}>
      {/* 工具栏：清空回收站按钮 */}
      <div className="p-4 md:p-6 pb-2">
        <button 
          onClick={() => setActiveModal('clear')} 
          disabled={items.length === 0}
          className="flex items-center space-x-2 bg-red-600 text-white px-3 md:px-4 py-2 hover:bg-black transition-colors border-2 border-black text-[10px] md:text-xs font-bold uppercase disabled:opacity-30"
        >
          <Icons.Trash className="w-3 h-3" /><span>Empty Trash</span>
        </button>
      </div>

      {/* 文件列表区域 */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* 加载中状态 */}
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Icons.Grid className="w-10 h-10 animate-spin" /></div>
        
        /* 空回收站状态 */
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 uppercase font-bold italic">Recycle Bin is Empty</div>
        
        /* 网格视图 */
        ) : viewMode === 'grid' ? (
          <GridView 
            items={sortedItems} selectedIds={selectedIds}
            onItemClick={(item) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; })}
            onItemLongPress={() => {}}
            onContextMenu={() => {}}
            onRename={() => {}}
            onMove={() => {}}
            onDelete={(item) => { setTargetItem(item); setActiveModal('delete-permanent'); }}
          />
        
        /* 列表视图 */
        ) : (
          <ListView 
            items={sortedItems} selectedIds={selectedIds}
            onItemClick={(item) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; })}
            onItemLongPress={() => {}}
            onContextMenu={() => {}}
            onSelectAll={() => setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
            onSort={(key) => { if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortOrder('asc'); } }}
            sortKey={sortKey} sortOrder={sortOrder}
            onRename={() => {}}
            onMove={() => {}}
            onDelete={(item) => { setTargetItem(item); setActiveModal('delete-permanent'); }}
          />
        )}
      </div>

      {/* 清空回收站确认模态框 */}
      {activeModal === 'clear' && (
        <DeleteModal 
          title="Empty Trash?" 
          count={items.length} 
          isPermanent={true}
          onClose={() => setActiveModal(null)} 
          onConfirm={handleConfirmClear} 
        />
      )}
      
      {/* 永久删除确认模态框 */}
      {activeModal === 'delete-permanent' && (
        <DeleteModal 
          title="Delete Permanently?" 
          count={selectedIds.size || (targetItem ? 1 : 0)} 
          isPermanent={true}
          onClose={() => setActiveModal(null)} 
          onConfirm={handleConfirmPermanentDelete} 
        />
      )}

      {/* 多选操作栏：注意回收站不支持移动功能 */}
      {selectedIds.size > 0 && (
        <SelectionBar 
          count={selectedIds.size} 
          onMove={() => {}} 
          onDelete={() => setActiveModal('delete-permanent')} 
          onClear={() => setSelectedIds(new Set())} 
        />
      )}
    </div>
  );
};
