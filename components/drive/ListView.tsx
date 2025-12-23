/**
 * ListView.tsx
 * 
 * 【列表视图布局】
 * 
 * 以表格形式展示文件和文件夹
 * 提供排序、全选、批量操作等功能
 */

import React from 'react';
import { DriveItem, SortKey, SortOrder } from '../../types';
import { FileItem } from './FileItem';

/**
 * 列表视图的 Props 接口
 */
interface ListViewProps {
  items: DriveItem[];                                      // 要显示的文件/文件夹列表
  selectedIds: Set<string>;                                // 选中的项 ID 集合
  onItemClick: (item: DriveItem) => void;                  // 点击项回调
  onItemLongPress: (item: DriveItem) => void;              // 长按项回调（移动端多选）
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;  // 右键菜单回调
  onSelectAll: () => void;                                 // 全选/取消全选回调
  onSort: (key: SortKey) => void;                          // 排序回调
  sortKey: SortKey;                                        // 当前排序字段
  sortOrder: SortOrder;                                    // 当前排序方向（升序/降序）
  onRename: (item: DriveItem) => void;                     // 重命名回调
  onMove: (item: DriveItem) => void;                       // 移动回调
  onDelete: (item: DriveItem) => void;                     // 删除回调
}

/**
 * 【列表视图组件】
 * 
 * 特性：
 * - 表格布局，显示详细信息（名称、大小、修改时间等）
 * - 可点击表头进行排序，显示排序方向箭头
 * - 支持全选功能（表头复选框）
 * - 每行提供快速操作按钮（重命名、移动、删除）
 * - 响应式设计，小屏幕隐藏修改时间列
 * - 固定宽度布局，水平滚动支持
 */
export const ListView: React.FC<ListViewProps> = ({
  items, selectedIds, onItemClick, onItemLongPress, onContextMenu, 
  onSelectAll, onSort, sortKey, sortOrder, onRename, onMove, onDelete
}) => {
  // 判断是否全选状态
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <div className="border-2 border-black min-w-full overflow-x-auto bg-white">
      <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
        {/* 表头 - 黑色背景，白色文字 */}
        <thead>
          <tr className="bg-black text-white text-[9px] uppercase font-bold tracking-widest">
            {/* 全选复选框列 */}
            <th className="p-3 w-[40px] border-r border-white/20 text-center">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-yellow-400 cursor-pointer border-2 border-white"
                checked={isAllSelected}
                onChange={(e) => { e.stopPropagation(); onSelectAll(); }}
                onClick={(e) => e.stopPropagation()}
              />
            </th>
            
            {/* 名称列 - 可排序 */}
            <th onClick={() => onSort('name')} className="p-3 border-r border-white/20 w-[40%] hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center space-x-2">
                <span>Name</span>
                {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
            </th>
            
            {/* 大小列 - 可排序 */}
            <th onClick={() => onSort('size')} className="p-3 border-r border-white/20 w-[12%] hover:bg-gray-800 transition-colors text-center cursor-pointer">
              <div className="flex items-center justify-center space-x-2">
                <span>Size</span>
                {sortKey === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
            </th>
            
            {/* 修改时间列 - 可排序（小屏幕隐藏） */}
            <th onClick={() => onSort('modifiedAt')} className="p-3 border-r border-white/20 w-[18%] hover:bg-gray-800 transition-colors text-center hidden sm:table-cell cursor-pointer">
              <div className="flex items-center justify-center space-x-2">
                <span>Modified</span>
                {sortKey === 'modifiedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
            </th>
            
            {/* 操作列 - 不可排序 */}
            <th className="p-3 w-[25%] text-center">Options</th>
          </tr>
        </thead>
        
        {/* 表格主体 - 每行由 FileItem 组件渲染 */}
        <tbody className="text-[10px]">
          {items.map(item => (
            <FileItem 
              key={item.id}
              item={item}
              viewMode="list"
              isSelected={selectedIds.has(item.id)}
              onSelect={() => onItemClick(item)}
              onLongPress={() => onItemLongPress(item)}
              onContextMenu={(e) => onContextMenu(e, item)}
              onRename={() => onRename(item)}
              onMove={() => onMove(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
