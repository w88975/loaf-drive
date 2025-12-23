/**
 * 图片查看器组件
 * 功能：显示图片预览，支持自适应缩放
 * 特性：
 * - 保持图片宽高比（object-contain）
 * - 黑色粗边框和硬核阴影（极客新丑风）
 * - 自适应容器大小
 */

import React from 'react';
import { DriveItem } from '../../types';

export const ImageViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    /**
     * 容器：flex 布局居中
     * 图片：
     * - max-w-full/max-h-full: 不超过容器尺寸
     * - object-contain: 保持比例，完整显示
     * - border-4 + shadow: 极客新丑风硬核阴影
     */
    <div className="flex items-center justify-center h-full w-full">
      <img 
        src={item.url} 
        alt={item.name} 
        className="max-w-full max-h-full object-contain border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" 
      />
    </div>
  );
};
