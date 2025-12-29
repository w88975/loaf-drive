/**
 * FilePreviewLoop.tsx
 * 
 * 【文件预览轮播组件】
 * 
 * 用于在网格视图中循环播放视频帧预览图
 * 当用户上传视频时，客户端会提取多个关键帧作为预览
 * 此组件自动轮播这些帧，形成 GIF 效果
 * 
 * 优化：
 * - 预加载所有图片到内存，避免重复请求
 * - 使用 CSS 显示/隐藏而非动态改变 src
 * - 只在图片加载完成后才开始轮播
 */

import React, { useState, useEffect, useRef } from 'react';

interface FilePreviewLoopProps {
  previews: string[];
  alt?: string;
  className?: string;
}

export const FilePreviewLoop: React.FC<FilePreviewLoopProps> = ({ 
  previews, 
  alt = '', 
  className = '' 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (previews.length === 0) return;

    setIsLoading(true);
    setLoadedImages([]);

    const imagePromises = previews.map((src) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
      });
    });

    Promise.all(imagePromises)
      .then((urls) => {
        setLoadedImages(urls);
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn('Some preview images failed to load:', error);
        setLoadedImages(previews);
        setIsLoading(false);
      });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [previews]);

  useEffect(() => {
    if (isLoading || loadedImages.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % loadedImages.length);
    }, 300);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoading, loadedImages.length]);

  if (previews.length === 0) return null;

  if (isLoading || loadedImages.length === 0) {
    return (
      <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="w-6 h-6 border-2 border-gray-400 border-t-black animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {loadedImages.map((src, index) => (
        <img
          key={`preview-${index}`}
          src={src}
          alt={`${alt} ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-150 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
};
