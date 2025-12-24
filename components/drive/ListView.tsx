
/**
 * ListView.tsx
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DriveItem, SortKey, SortOrder } from '../../types';
import { FileItem } from './FileItem';

interface ListViewProps {
  items: DriveItem[];
  selectedIds: Set<string>;
  isReadOnly?: boolean;                                     // 新增
  onItemClick: (item: DriveItem) => void;
  onItemLongPress: (item: DriveItem) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
  onSelectAll: () => void;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
  sortOrder: SortOrder;
  onRename?: (item: DriveItem) => void;
  onMove?: (item: DriveItem) => void;
  onDelete?: (item: DriveItem) => void;
  onShare?: (item: DriveItem) => void;                       // 新增
}

export const ListView: React.FC<ListViewProps> = ({
  items, selectedIds, isReadOnly, onItemClick, onItemLongPress, onContextMenu, 
  onSelectAll, onSort, sortKey, sortOrder, onRename, onMove, onDelete, onShare
}) => {
  const { t } = useTranslation();
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <div className="border-2 border-black min-w-full overflow-x-auto bg-white">
      <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
        <thead>
          <tr className="bg-black text-white text-[9px] uppercase font-bold tracking-widest">
            <th className="p-3 w-[40px] border-r border-white/20 text-center">
              <input type="checkbox" className="w-4 h-4 accent-yellow-400 cursor-pointer border-2 border-white" checked={isAllSelected} onChange={(e) => { e.stopPropagation(); onSelectAll(); }} onClick={(e) => e.stopPropagation()} />
            </th>
            <th onClick={() => onSort('name')} className="p-3 border-r border-white/20 w-[40%] hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center space-x-2"><span>{t('table.name')}</span>{sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</div>
            </th>
            <th onClick={() => onSort('size')} className="p-3 border-r border-white/20 w-[12%] hover:bg-gray-800 transition-colors text-center cursor-pointer">
              <div className="flex items-center justify-center space-x-2"><span>{t('table.size')}</span>{sortKey === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}</div>
            </th>
            <th onClick={() => onSort('modifiedAt')} className="p-3 border-r border-white/20 w-[18%] hover:bg-gray-800 transition-colors text-center hidden sm:table-cell cursor-pointer">
              <div className="flex items-center justify-center space-x-2"><span>{t('table.modified')}</span>{sortKey === 'modifiedAt' && (sortOrder === 'asc' ? '↑' : '↓')}</div>
            </th>
            <th className="p-3 w-[25%] text-center">{t('table.options')}</th>
          </tr>
        </thead>
        <tbody className="text-[10px]">
          {items.map(item => (
            <FileItem 
              key={item.id}
              item={item}
              viewMode="list"
              isReadOnly={isReadOnly}
              isSelected={selectedIds.has(item.id)}
              onSelect={() => onItemClick(item)}
              onLongPress={() => onItemLongPress(item)}
              onContextMenu={(e) => onContextMenu(e, item)}
              onRename={() => onRename?.(item)}
              onMove={() => onMove?.(item)}
              onDelete={() => onDelete?.(item)}
              onShare={() => onShare?.(item)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
