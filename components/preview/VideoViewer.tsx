/**
 * 视频播放器组件
 * 功能：使用 CanvasVideo 组件播放视频，支持 HLS 流媒体
 * 特性：
 * - 自动播放
 * - Canvas 渲染，性能优化
 * - 支持 HLS.js 分段加载
 * - 积极的内存管理和缓冲清理
 * - 黑色背景填充
 */

import React from 'react';
import { DriveItem } from '../../types';
import CanvasVideo from '../video/CanvasVideo';

export const VideoViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    <CanvasVideo 
      src={item.url} 
      autoplay={true}
      className="h-full w-full"
    />
  );
};
