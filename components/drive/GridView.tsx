/**
 * GridView.tsx
 * 
 * 【网格视图布局】
 * 
 * 以卡片形式展示文件和文件夹
 * 响应式设计：移动端2列，平板4列，桌面8列
 */

import React from 'react';
import { DriveItem } from '../../types';
import { FileItem } from './FileItem';

/**
 * 网格视图的 Props 接口
 */
interface GridViewProps {
  items: DriveItem[];                                      // 要显示的文件/文件夹列表
  selectedIds: Set<string>;                                // 选中的项 ID 集合
  onItemClick: (item: DriveItem) => void;                  // 点击项回调
  onItemLongPress: (item: DriveItem) => void;              // 长按项回调（移动端多选）
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;  // 右键菜单回调
  onRename: (item: DriveItem) => void;                     // 重命名回调
  onMove: (item: DriveItem) => void;                       // 移动回调
  onDelete: (item: DriveItem) => void;                     // 删除回调
}

/**
 * 【网格视图组件】
 * 
 * 特性：
 * - 响应式网格布局（2/4/8列）
 * - 每个项由 FileItem 组件渲染（viewMode="grid"）
 * - 支持图片和视频的缩略图预览
 * - 卡片式设计，适合视觉浏览
 */
export const GridView: React.FC<GridViewProps> = ({
  items, selectedIds, onItemClick, onItemLongPress, onContextMenu, onRename, onMove, onDelete
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {items.map(item => (
        <FileItem 
          key={item.id}
          item={item}
          viewMode="grid"
          isSelected={selectedIds.has(item.id)}
          onSelect={() => onItemClick(item)}
          onLongPress={() => onItemLongPress(item)}
          onContextMenu={(e) => onContextMenu(e, item)}
          onRename={() => onRename(item)}
          onMove={() => onMove(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
    </div>
  );
};
