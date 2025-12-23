
/**
 * ContextMenu.tsx
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { DriveItem } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  item: DriveItem;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onShare: () => void;                          // 新增
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, item, onRename, onMove, onDelete, onToggleLock, onShare }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      let nextLeft = x;
      let nextTop = y;
      if (x + rect.width > screenWidth) nextLeft = x - rect.width;
      if (y + rect.height > screenHeight) nextTop = y - rect.height;
      setPosition({ top: nextTop, left: nextLeft });
    }
  }, [x, y]);

  return (
    <div 
      ref={menuRef}
      className="fixed z-[140] w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1 animate-in fade-in zoom-in-95 duration-100" 
      style={{ top: position.top, left: position.left }} 
    >
      <div className="px-4 py-1 border-b border-black/10 mb-1">
        <p className="text-[8px] text-gray-400 font-black uppercase truncate">{item.name}</p>
      </div>
      
      {/* 分享入口 */}
      <button onClick={onShare} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors flex items-center justify-between group bg-yellow-50">
        <span>Share Link</span>
        <span className="text-[8px]">🔗</span>
      </button>

      <button onClick={onRename} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors border-t border-black/5 flex items-center justify-between group">
        <span>Rename</span>
        <span className="opacity-0 group-hover:opacity-100 text-[8px]">→</span>
      </button>
      
      <button onClick={onMove} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors border-t border-black/5 flex items-center justify-between group">
        <span>Move to...</span>
        <span className="opacity-0 group-hover:opacity-100 text-[8px]">→</span>
      </button>
      
      {item.type === 'folder' && (
        <button onClick={onToggleLock} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors border-t border-black/5 flex items-center justify-between group">
          <span>{item.isLocked ? 'Unlock Folder' : 'Lock Folder'}</span>
          <span className="opacity-0 group-hover:opacity-100 text-[8px]">{item.isLocked ? '🔓' : '🔒'}</span>
        </button>
      )}
      
      <button onClick={onDelete} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-colors border-t border-black flex items-center justify-between group">
        <span>Delete</span>
        <span className="opacity-0 group-hover:opacity-100 text-[8px]">×</span>
      </button>
    </div>
  );
};
