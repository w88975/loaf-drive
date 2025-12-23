/**
 * PDF查看器组件
 * 功能：使用浏览器内置PDF预览器显示PDF文件
 * 特性：
 * - 支持浏览器原生PDF查看（Chrome/Edge/Firefox内置）
 * - 自动缩放适配容器
 * - 提供下载按钮兜底方案
 */

import React from 'react';
import { DriveItem } from '../../types';
import { Icons } from '../../constants';

export const PdfViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <iframe 
        src={item.url}
        title={item.name}
        className="w-full h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      />
      
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
        <div className="flex justify-center pointer-events-auto">
          <a 
            href={item.url} 
            download 
            className="px-4 py-2 bg-yellow-400 text-black font-bold uppercase border-4 border-black hover:bg-white transition-all text-xs flex items-center space-x-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Icons.Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>
    </div>
  );
};

