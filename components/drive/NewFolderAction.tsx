/**
 * NewFolderAction.tsx
 * 
 * 【新建文件夹按钮】
 * 
 * 显示在文件视图顶部的操作按钮
 * 点击后触发新建文件夹模态框
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from '../../constants';

/**
 * 新建文件夹按钮的 Props 接口
 */
interface NewFolderActionProps {
  onClick: () => void;  // 点击回调
}

/**
 * 【新建文件夹按钮组件】
 * 
 * 特性：
 * - Geek-Brutalism 风格（黑色边框 + 黄色悬停）
 * - 响应式字体大小和内边距
 * - 使用 stopPropagation 防止触发父元素的点击事件
 */
export const NewFolderAction: React.FC<NewFolderActionProps> = ({ onClick }) => {
  const { t } = useTranslation();
  
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      className="flex items-center space-x-2 bg-white text-black px-3 md:px-4 py-2 hover:bg-yellow-400 transition-colors border-2 border-black text-[10px] md:text-xs font-bold uppercase"
    >
      <Icons.Folder className="w-3 h-3" />
      <span>{t('file.newFolder')}</span>
    </button>
  );
};
