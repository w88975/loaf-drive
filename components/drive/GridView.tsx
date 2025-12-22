
import React from 'react';
import { DriveItem } from '../../types';
import { FileItem } from './FileItem';

interface GridViewProps {
  items: DriveItem[];
  selectedIds: Set<string>;
  onItemClick: (item: DriveItem) => void;
  onItemLongPress: (item: DriveItem) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
  onRename: (item: DriveItem) => void;
  onMove: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
}

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
