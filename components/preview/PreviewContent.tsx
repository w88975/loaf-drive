/**
 * 预览内容分发器组件
 * 功能：根据文件类型选择合适的预览器组件（策略模式）
 * 支持：图片、视频、音频、文本/代码、不支持格式的兜底
 */

import React, { useState } from 'react';
import { DriveItem } from '../../types';
import { getFileCategory, FileCategory } from '../../utils';
import { ImageViewer } from './ImageViewer';
import { VideoViewer } from './VideoViewer';
import { AudioViewer } from './AudioViewer';
import { TextViewer } from './TextViewer';
import { PDFViewer } from './PDFViewer';
import { UnsupportedViewer } from './UnsupportedViewer';

interface PreviewContentProps {
  item: DriveItem;  // 要预览的文件
}

export const PreviewContent: React.FC<PreviewContentProps> = ({ item }) => {
  /**
   * 强制分类状态
   * 功能：允许用户在不支持格式时强制使用文本查看器
   * 使用场景：PDF、二进制文件等尝试以文本方式打开
   */
  const [forcedCategory, setForcedCategory] = useState<FileCategory | null>(null);
  
  /**
   * 确定文件分类
   * 优先使用强制分类，否则根据扩展名自动判断
   */
  const category = forcedCategory || getFileCategory(item.extension);

  /**
   * 根据文件分类分发到对应的预览器
   * - image: ImageViewer - 图片查看器
   * - video: VideoViewer - 视频播放器  
   * - audio: AudioViewer - 音频播放器（带旋转唱片动画）
   * - text: TextViewer - 文本/代码查看器（带语法高亮）
   * - pdf: PDFViewer - PDF查看器
   * - default: UnsupportedViewer - 不支持格式的兜底组件
   */
  switch (category) {
    case 'image':
      return <ImageViewer item={item} />;
    case 'video':
      return <VideoViewer item={item} />;
    case 'audio':
      return <AudioViewer item={item} />;
    case 'text':
      return <TextViewer item={item} />;
    case 'pdf':
      return <PDFViewer item={item} />;
    default:
      return <UnsupportedViewer item={item} onOpenAsText={() => setForcedCategory('text')} />;
  }
};
