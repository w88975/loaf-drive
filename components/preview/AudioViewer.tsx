/**
 * 音频播放器组件
 * 功能：播放音频文件，带有旋转唱片动画视觉反馈
 * 特性：
 * - 旋转唱片动画：模拟黑胶唱片播放效果
 * - 原生音频控制条
 * - 文件名显示
 */

import React from 'react';
import { DriveItem } from '../../types';

export const AudioViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      {/**
       * 旋转唱片动画
       * 视觉元素：
       * - 外圈：黄色圆盘（唱片）+ 黑色边框
       * - 中心：白色小圆（唱片中心孔）
       * - 内圈阴影：半透明黑色圆环（立体感）
       * 
       * 动画：10秒旋转一周，无限循环
       * 效果：模拟黑胶唱片播放时的旋转
       */}
      <div className="w-48 h-48 rounded-full border-4 border-black bg-yellow-400 flex items-center justify-center mb-8 relative animate-spin-slow">
        {/* 中心白色圆：唱片中心孔 */}
        <div className="w-12 h-12 rounded-full border-4 border-black bg-white" />
        {/* 内圈阴影：增加立体感 */}
        <div className="absolute inset-0 border-4 border-black rounded-full opacity-20 scale-90" />
      </div>
      
      {/* 文件名：极客风格大写加粗 */}
      <p className="font-bold text-sm uppercase italic mb-6 tracking-widest">{item.name}</p>
      
      {/**
       * HTML5 Audio 元素
       * - controls: 显示播放控制条
       * - max-w-md: 最大宽度限制
       * - accent-black: 控制条主题色为黑色
       */}
      <audio 
        src={item.url} 
        controls 
        className="w-full max-w-md accent-black h-10"
      />
      
      {/**
       * 自定义 CSS 动画
       * spin-slow: 慢速旋转动画，10秒一周
       */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};
