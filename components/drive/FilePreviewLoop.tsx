/**
 * FilePreviewLoop.tsx
 * 
 * 【文件预览轮播组件】
 * 
 * 用于在网格视图中循环播放视频帧预览图
 * 当用户上传视频时，客户端会提取多个关键帧作为预览
 * 此组件自动轮播这些帧，形成 GIF 效果
 */

import React, { useState, useEffect } from 'react';

/**
 * 预览轮播的 Props 接口
 */
interface FilePreviewLoopProps {
  previews: string[];     // 预览图 URL 数组（Base64 或静态 URL）
  alt?: string;           // 图片 alt 属性
  className?: string;     // 额外的 CSS 类名
}

/**
 * 【文件预览轮播组件】
 * 
 * 功能：
 * - 自动每 300ms 切换到下一帧
 * - 循环播放所有预览图
 * - 只有一帧时不启动定时器（静态显示）
 * 
 * 使用场景：
 * - 视频文件在网格视图中的悬停预览效果
 * - 提供类似 GIF 的动态预览体验
 * 
 * 注意：
 * - 组件会在卸载时清理定时器
 * - 使用 pointer-events-none 防止拖拽干扰
 */
export const FilePreviewLoop: React.FC<FilePreviewLoopProps> = ({ previews, alt = '', className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 只有一帧或无预览时不启动定时器
    if (previews.length <= 1) return;

    // 每 300ms 切换到下一帧
    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % previews.length);
    }, 300);

    // 清理定时器
    return () => clearInterval(intervalId);
  }, [previews.length]);

  // 无预览图时不渲染
  if (previews.length === 0) return null;

  return (
    <img 
      src={previews[currentIndex]} 
      alt={alt} 
      className={`w-full h-full object-cover pointer-events-none transition-opacity duration-150 ${className}`} 
    />
  );
};
