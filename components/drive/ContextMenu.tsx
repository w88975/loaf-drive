/**
 * ContextMenu.tsx
 * 
 * 【右键上下文菜单】
 * 
 * 当用户右键点击文件/文件夹项时弹出的操作菜单
 * 提供快速访问重命名、移动、删除、锁定等功能
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { DriveItem } from '../../types';

/**
 * 上下文菜单的 Props 接口
 */
interface ContextMenuProps {
  x: number;                   // 菜单显示的 X 坐标（鼠标位置）
  y: number;                   // 菜单显示的 Y 坐标（鼠标位置）
  item: DriveItem;             // 被右键点击的项
  onRename: () => void;        // 重命名回调
  onMove: () => void;          // 移动回调
  onDelete: () => void;        // 删除回调
  onToggleLock: () => void;    // 切换锁定状态回调（仅文件夹）
}

/**
 * 【右键上下文菜单组件】
 * 
 * 功能：
 * 1. 在鼠标右键位置显示菜单
 * 2. 自动边界检测，防止菜单超出屏幕
 * 3. 根据项目类型显示不同的操作选项（文件夹额外显示锁定/解锁）
 * 
 * 边界检测逻辑：
 * - 使用 useLayoutEffect 在渲染后立即检测菜单是否超出屏幕
 * - 如果右侧超出，将菜单移到鼠标左侧
 * - 如果底部超出，将菜单移到鼠标上方
 * 
 * z-index 为 140，确保位于所有内容之上
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, item, onRename, onMove, onDelete, onToggleLock }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });

  // 边界检测：确保菜单不会超出屏幕
  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let nextLeft = x;
      let nextTop = y;

      // 如果右侧超出屏幕，将菜单移到鼠标左侧
      if (x + rect.width > screenWidth) {
        nextLeft = x - rect.width;
      }
      // 如果底部超出屏幕，将菜单移到鼠标上方
      if (y + rect.height > screenHeight) {
        nextTop = y - rect.height;
      }

      setPosition({ top: nextTop, left: nextLeft });
    }
  }, [x, y]);

  return (
    <div 
      ref={menuRef}
      className="fixed z-[140] w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1 animate-in fade-in zoom-in-95 duration-100" 
      style={{ top: position.top, left: position.left }} 
    >
      {/* 菜单头部 - 显示项目名称 */}
      <div className="px-4 py-1 border-b border-black/10 mb-1">
        <p className="text-[8px] text-gray-400 font-black uppercase truncate">{item.name}</p>
      </div>
      
      {/* 重命名按钮 */}
      <button 
        onClick={onRename} 
        className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors flex items-center justify-between group"
      >
        <span>Rename</span>
        <span className="opacity-0 group-hover:opacity-100 text-[8px]">→</span>
      </button>
      
      {/* 移动按钮 */}
      <button 
        onClick={onMove} 
        className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors border-t border-black/5 flex items-center justify-between group"
      >
        <span>Move to...</span>
        <span className="opacity-0 group-hover:opacity-100 text-[8px]">→</span>
      </button>
      
      {/* 锁定/解锁按钮（仅文件夹显示） */}
      {item.type === 'folder' && (
        <button 
          onClick={onToggleLock} 
          className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-yellow-400 transition-colors border-t border-black/5 flex items-center justify-between group"
        >
          <span>{item.isLocked ? 'Unlock Folder' : 'Lock Folder'}</span>
          <span className="opacity-0 group-hover:opacity-100 text-[8px]">{item.isLocked ? '🔓' : '🔒'}</span>
        </button>
      )}
      
      {/* 删除按钮 - 红色悬停效果 */}
      <button 
        onClick={onDelete} 
        className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-colors border-t border-black flex items-center justify-between group"
      >
        <span>Delete</span>
        <span className="opacity-0 group-hover:opacity-100 text-[8px]">×</span>
      </button>
    </div>
  );
};
