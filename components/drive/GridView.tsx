
/**
 * GridView.tsx
 */

import React from 'react';
import { DriveItem } from '../../types';
import { FileItem } from './FileItem';

interface GridViewProps {
  items: DriveItem[];
  selectedIds: Set<string>;
  isReadOnly?: boolean;                                     // 新增
  onItemClick: (item: DriveItem) => void;
  onItemLongPress: (item: DriveItem) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
  onRename?: (item: DriveItem) => void;
  onMove?: (item: DriveItem) => void;
  onDelete?: (item: DriveItem) => void;
  onShare?: (item: DriveItem) => void;                       // 新增
}

export const GridView: React.FC<GridViewProps> = ({
  items, selectedIds, isReadOnly, onItemClick, onItemLongPress, onContextMenu, onRename, onMove, onDelete, onShare
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {items.map(item => (
        <FileItem 
          key={item.id}
          item={item}
          viewMode="grid"
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
    </div>
  );
};
