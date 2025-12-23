/**
 * SelectionBar.tsx
 * 
 * 【批量操作工具栏】
 * 
 * 当用户选中一个或多个文件/文件夹时
 * 在屏幕底部弹出的浮动工具栏
 */

import React from 'react';
import { Icons } from '../../constants';

/**
 * 选择工具栏的 Props 接口
 */
interface SelectionBarProps {
  count: number;         // 选中的项目数量
  onMove: () => void;    // 批量移动回调
  onDelete: () => void;  // 批量删除回调
  onClear: () => void;   // 清空选择回调
}

/**
 * 【批量操作工具栏组件】
 * 
 * 特性：
 * - 固定在屏幕底部中央（bottom-6, left-1/2）
 * - z-index 为 80，位于内容之上但低于模态框
 * - 黑色背景 + 黄色边框（醒目的 Geek-Brutalism 风格）
 * - 从底部滑入动画（slide-in-from-bottom-full）
 * - 显示选中数量，提供移动、删除、清空操作
 */
export const SelectionBar: React.FC<SelectionBarProps> = ({ count, onMove, onDelete, onClear }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-black text-white px-6 py-4 flex items-center space-x-8 shadow-[0_0_20px_rgba(0,0,0,0.4)] border-4 border-yellow-400 italic font-bold uppercase animate-in slide-in-from-bottom-full duration-200">
      {/* 选中数量显示 */}
      <div className="text-sm tracking-tighter"><span className="text-yellow-400">{count}</span> ITEM(S) READY</div>
      
      {/* 操作按钮组 */}
      <div className="flex space-x-4">
        <button 
          onClick={(e) => { e.stopPropagation(); onMove(); }} 
          className="hover:text-yellow-400 transition-colors flex items-center space-x-2 text-xs"
        >
          <Icons.More className="w-4 h-4" /><span>Move</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="hover:text-red-500 transition-colors flex items-center space-x-2 text-xs"
        >
          <Icons.Trash className="w-4 h-4" /><span>Delete</span>
        </button>
      </div>
      
      {/* 清空选择按钮 */}
      <button onClick={onClear} className="p-1 hover:text-yellow-400 border-l border-white/20 pl-4">
        <Icons.Close className="w-4 h-4" />
      </button>
    </div>
  );
};
