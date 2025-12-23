/**
 * 不支持格式的兜底查看器组件
 * 功能：当文件类型不支持预览时的友好提示界面
 * 提供：下载文件和尝试文本查看两种选择
 */

import React from 'react';
import { Icons } from '../../constants';
import { DriveItem } from '../../types';

export const UnsupportedViewer: React.FC<{ item: DriveItem, onOpenAsText: () => void }> = ({ item, onOpenAsText }) => {
  return (
    /**
     * 主容器：居中布局
     */
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      {/* 文件图标：半透明灰色，表示不可预览 */}
      <Icons.File className="w-24 h-24 mb-6 opacity-20" />
      
      {/* 提示标题 */}
      <h3 className="text-xl font-bold uppercase italic mb-2">Preview Not Available</h3>
      
      {/* 文件类型说明 */}
      <p className="text-gray-500 text-xs uppercase font-bold mb-8">
        We don't support previewing .{item.extension} files yet.
      </p>
      
      {/**
       * 操作按钮组
       * 提供两种备选方案：
       * 1. 尝试文本查看：强制使用 TextViewer 打开（可能失败）
       * 2. 下载文件：直接下载到本地查看
       */}
      <div className="flex space-x-4">
        {/* 
         * 尝试文本查看按钮
         * 功能：调用 onOpenAsText 回调，强制使用文本查看器
         * 用途：某些二进制格式可能包含可读文本（如 PDF、某些配置文件）
         */}
        <button 
          onClick={onOpenAsText}
          className="px-6 py-3 border-4 border-black font-bold uppercase hover:bg-yellow-400 transition-all text-xs"
        >
          Try opening as text
        </button>
        
        {/* 
         * 下载按钮
         * 功能：直接下载文件到本地
         * 样式：黑底白字，Hover 时黄色高亮
         */}
        <a 
          href={item.url} 
          download 
          className="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-yellow-400 hover:text-black border-4 border-black transition-all text-xs"
        >
          Download File
        </a>
      </div>
    </div>
  );
};
