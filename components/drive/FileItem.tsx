/**
 * FileItem.tsx
 * 
 * 【文件/文件夹项组件】
 * 
 * 核心的文件项渲染组件，支持两种视图模式：
 * - grid: 网格视图（卡片式，显示预览图）
 * - list: 列表视图（表格行，显示详细信息）
 * 
 * 包含完整的交互逻辑：
 * - 点击选择/打开
 * - 长按多选（移动端）
 * - 右键菜单
 * - 预览图轮播
 */

import React, { useRef } from 'react';
import { DriveItem } from '../../types';
import { Icons } from '../../constants';
import { formatSize, getFileIcon, formatDate } from '../../utils';
import { FilePreviewLoop } from './FilePreviewLoop';

/**
 * 文件项组件的 Props 接口
 */
interface FileItemProps {
  item: DriveItem;                             // 文件/文件夹数据
  viewMode: 'grid' | 'list';                   // 视图模式
  isSelected: boolean;                         // 是否被选中
  onSelect: () => void;                        // 点击选择回调
  onLongPress: () => void;                     // 长按回调（用于移动端多选）
  onContextMenu: (e: React.MouseEvent) => void;// 右键菜单回调
  onRename: () => void;                        // 重命名回调
  onMove: () => void;                          // 移动回调
  onDelete: () => void;                        // 删除回调
}

/**
 * 【文件项组件】
 * 
 * 功能特性：
 * 1. 双视图模式支持（网格/列表）
 * 2. 长按检测（600ms）用于移动端多选
 * 3. 图片/视频预览支持
 * 4. 文件夹锁定状态显示
 * 5. 选中状态视觉反馈
 * 6. 右键菜单支持
 * 
 * 网格模式特性：
 * - 正方形卡片（aspect-square）
 * - 显示缩略图或文件图标
 * - 视频显示播放按钮覆盖层
 * - 选中时显示黄色复选标记
 * 
 * 列表模式特性：
 * - 表格行布局
 * - 显示文件详细信息
 * - 内联操作按钮
 */
export const FileItem: React.FC<FileItemProps> = ({ 
  item, 
  viewMode, 
  isSelected, 
  onSelect, 
  onLongPress,
  onContextMenu,
  onRename,
  onMove,
  onDelete
}) => {
  const isFolder = item.type === 'folder';
  const iconKey = getFileIcon(item.type, item.extension);
  const pressTimer = useRef<number | null>(null);
  const isLongPressActive = useRef(false);
  const isMobile = useRef(false);

  /**
   * 开始长按检测
   * 设置 600ms 定时器，超时后触发长按回调
   * 移动端：长按触发右键菜单
   * 桌面端：长按触发多选
   */
  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPressActive.current = false;
    isMobile.current = 'touches' in e;
    
    pressTimer.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      
      if (isMobile.current) {
        const touch = (e as React.TouchEvent).touches[0];
        if (touch) {
          const syntheticEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          (e.target as HTMLElement).dispatchEvent(syntheticEvent);
        }
      } else {
        onLongPress();
      }
      
      pressTimer.current = null;
    }, 600);
  };

  /**
   * 结束长按检测
   * 清除定时器（用户提前释放鼠标/触摸）
   */
  const endPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  /**
   * 处理点击事件
   * 仅在非长按状态下触发选择回调
   */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLongPressActive.current) {
      onSelect();
    }
    isLongPressActive.current = false;
  };

  /**
   * 处理右键菜单事件
   * 移动端通过长按触发，桌面端通过右键触发
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e);
  };

  /**
   * 统一的事件处理器配置
   * 同时支持鼠标和触摸事件
   */
  const eventHandlers = {
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: endPress,
    onTouchStart: startPress,
    onTouchEnd: endPress,
    onClick: handleClick,
    onContextMenu: handleContextMenu
  };

  // 根据文件类型获取图标组件
  const IconComponent = Icons[iconKey] || Icons.File;

  // ==================== 网格视图模式 ====================
  if (viewMode === 'grid') {
    const hasPreviews = item.previews && item.previews.length > 0;  // 是否有预览帧（视频）
    const isImage = iconKey === 'Image';                             // 是否为图片
    const isVideo = iconKey === 'Video';                             // 是否为视频
    const showPreview = hasPreviews || (isImage && item.url);        // 是否显示预览图

    return (
      <div 
        {...eventHandlers}
        className={`group relative aspect-square border-2 border-black flex flex-col items-center justify-between cursor-pointer transition-all overflow-hidden ${isSelected ? 'bg-yellow-200 ring-4 ring-black scale-[0.98]' : 'hover:bg-gray-50 active:scale-95'}`}
      >
        {/* 中间内容区 - 图标或预览图 */}
        <div className="flex-1 flex items-center justify-center w-full relative">
          {isFolder ? (
            /* 文件夹：显示文件夹图标 + 锁定标记 */
            <div className="relative">
              <IconComponent className="w-10 h-10" />
              {item.isLocked && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                </div>
              )}
            </div>
          ) : showPreview ? (
            /* 图片/视频：显示预览图 */
            <div className="absolute inset-0 p-1">
              {hasPreviews ? (
                /* 视频帧轮播 */
                <FilePreviewLoop previews={item.previews!} className="border border-black/5" />
              ) : (
                /* 静态图片预览 */
                <img src={item.url} alt="" className="w-full h-full object-cover border border-black/5 pointer-events-none" />
              )}
              
              {/* 视频播放按钮覆盖层 */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/40 backdrop-blur-sm rounded-full p-1 border border-white/30">
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 其他文件类型：显示对应图标 */
            <IconComponent className="w-10 h-10" />
          )}
          
          {/* 选中状态标记 - 左上角黄色复选标记 */}
          {isSelected && (
            <div className="absolute top-2 left-2 z-20">
              <div className="w-5 h-5 bg-black border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400" />
              </div>
            </div>
          )}
        </div>
        
        {/* 底部信息栏 - 文件名和大小 */}
        <div className="w-full text-center p-2 bg-white/95 border-t-2 border-black z-10">
          <p className="text-[9px] font-bold truncate uppercase px-1">{item.name}</p>
          <p className="text-[7px] text-gray-500 font-black uppercase">{isFolder ? 'DIRECTORY' : formatSize(item.size || 0)}</p>
        </div>
      </div>
    );
  }

  // ==================== 列表视图模式 ====================
  return (
    <tr 
      {...eventHandlers}
      className={`border-b-2 border-black hover:bg-yellow-50 cursor-pointer transition-colors ${isSelected ? 'bg-yellow-100' : ''}`}
    >
      {/* 复选框列 */}
      <td className="p-3 w-[40px] border-r-2 border-black text-center align-middle">
        <input 
          type="checkbox" 
          className="w-4 h-4 accent-black cursor-pointer border-2 border-black"
          checked={isSelected}
          readOnly
        />
      </td>
      
      {/* 名称列 - 显示图标 + 文件名 + 锁定标记 */}
      <td className="p-3 flex items-center space-x-3 border-r-2 border-black font-bold uppercase truncate align-middle">
        <div className="flex-shrink-0 flex items-center">
          <IconComponent className="w-4 h-4" />
          {isFolder && item.isLocked && <span className="ml-1 opacity-50">🔒</span>}
        </div>
        <span className="truncate">{item.name}</span>
      </td>
      
      {/* 大小列 - 文件夹显示 '--' */}
      <td className="p-3 border-r-2 border-black text-gray-600 uppercase text-center align-middle font-bold text-[9px]">
        {isFolder ? '--' : formatSize(item.size || 0)}
      </td>
      
      {/* 修改时间列 - 小屏幕隐藏 */}
      <td className="p-3 border-r-2 border-black text-gray-400 uppercase text-center align-middle font-medium hidden sm:table-cell text-[8px]">
        {formatDate(item.modifiedAt)}
      </td>
      
      {/* 操作按钮列 - 快速操作 */}
      <td className="p-3 text-center align-middle">
        <div className="flex items-center justify-center space-x-2 text-[8px] font-black tracking-tighter">
          <button 
            onClick={(e) => { e.stopPropagation(); onRename(); }} 
            className="hover:bg-black hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white"
          >
            RENAME
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMove(); }} 
            className="hover:bg-black hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white"
          >
            MOVE
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="hover:bg-red-500 hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white"
          >
            DELETE
          </button>
        </div>
      </td>
    </tr>
  );
};
