
import React from 'react';
import { DriveItem } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  item: DriveItem;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, item, onRename, onMove, onDelete }) => {
  return (
    <div 
      className="fixed z-[140] w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1" 
      style={{ top: y, left: x }} 
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onRename} 
        className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors"
      >
        Rename
      </button>
      <button 
        onClick={onMove} 
        className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors border-t border-black/10"
      >
        Move
      </button>
      <button 
        onClick={onDelete} 
        className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-colors border-t border-black"
      >
        Delete
      </button>
    </div>
  );
};
