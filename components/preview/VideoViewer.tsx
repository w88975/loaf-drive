/**
 * 视频播放器组件
 * 功能：使用 HTML5 原生 video 元素播放视频
 * 特性：
 * - 自动播放
 * - 完整的播放控制条（播放/暂停、进度、音量、全屏）
 * - 黑色背景填充
 */

import React from 'react';
import { DriveItem } from '../../types';

export const VideoViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    /**
     * 容器：黑色背景，用于视频周围的填充区域
     */
    <div className="flex items-center justify-center h-full w-full bg-black">
      {/**
       * HTML5 Video 元素
       * - controls: 显示原生播放控制条
       * - autoPlay: 自动播放（浏览器策略可能需要静音）
       * - max-w-full/max-h-full: 自适应容器大小
       * - border-white/10: 半透明白色边框，与黑色背景搭配
       */}
      <video 
        src={item.url} 
        controls 
        autoPlay 
        className="max-w-full max-h-full border-2 border-white/10" 
      />
    </div>
  );
};
