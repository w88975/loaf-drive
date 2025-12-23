/**
 * PreviewModal.tsx
 * 
 * 【文件预览模态框】
 * 
 * 大尺寸模态框，用于预览各种类型的文件
 * 支持图片、视频、音频、文本等多种格式
 */

import React from 'react';
import { Icons } from '../../constants';
import { DriveItem } from '../../types';
import { formatSize, formatDate } from '../../utils';
import { PreviewContent } from '../preview/PreviewContent';

/**
 * 预览模态框的 Props 接口
 */
interface PreviewModalProps {
  item: DriveItem;      // 要预览的文件项
  onClose: () => void;  // 关闭回调
}

/**
 * 【文件预览模态框组件】
 * 
 * 布局结构（3层）：
 * 1. 顶部栏（黄色背景）：文件名 + 下载/关闭按钮
 * 2. 中间内容区（灰色背景，可滚动）：由 PreviewContent 动态渲染对应的 Viewer
 * 3. 底部信息栏：显示文件大小、类型、修改时间
 * 
 * 特性：
 * - z-index 为 130，高于其他模态框（120）
 * - 宽度最大 5xl，高度占据 90vh
 * - 点击遮罩关闭，点击内容区阻止事件冒泡
 * - 下载按钮直接使用文件的静态 URL
 * - 使用 flexbox 布局确保头部和底部固定，中间内容区自适应
 */
export const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border-4 border-black w-full max-w-5xl h-[90vh] flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
        {/* 顶部标题栏 - 黄色背景 */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-yellow-400">
          <h2 className="font-bold uppercase tracking-tight truncate flex-1 mr-4 italic text-sm md:text-base">{item.name}</h2>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 下载按钮 */}
            <a href={item.url} download className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors">
              <Icons.Download className="w-5 h-5" />
            </a>
            {/* 关闭按钮 */}
            <button onClick={onClose} className="p-2 bg-black text-white hover:bg-red-500 border-2 border-black transition-colors">
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 中间预览内容区 - 动态渲染对应的 Viewer */}
        <div className="flex-1 overflow-hidden relative bg-gray-100">
          <PreviewContent item={item} />
        </div>

        {/* 底部信息栏 - 显示文件元数据 */}
        <div className="p-3 border-t-2 border-black text-[9px] font-bold uppercase grid grid-cols-3 bg-white">
          <div><span className="text-gray-400">SIZE:</span> {formatSize(item.size || 0)}</div>
          <div className="text-center"><span className="text-gray-400">TYPE:</span> {item.extension?.toUpperCase() || 'FILE'}</div>
          <div className="text-right"><span className="text-gray-400">MODIFIED:</span> {formatDate(item.modifiedAt)}</div>
        </div>
      </div>
    </div>
  );
};
