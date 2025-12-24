/**
 * 不支持格式的兜底查看器组件
 * 功能：当文件类型不支持预览时的友好提示界面
 * 提供：下载文件和尝试文本查看两种选择
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from '../../constants';
import { DriveItem } from '../../types';

export const UnsupportedViewer: React.FC<{ item: DriveItem, onOpenAsText: () => void }> = ({ item, onOpenAsText }) => {
  const { t } = useTranslation();
  const MAX_TEXT_VIEW_SIZE = 5 * 1024 * 1024;
  const fileSize = item.size || 0;
  const isTooLarge = fileSize > MAX_TEXT_VIEW_SIZE;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <Icons.File className="w-24 h-24 mb-6 opacity-20" />
      
      <h3 className="text-xl font-bold uppercase italic mb-2">{t('preview.previewNotAvailable')}</h3>
      
      <p className="text-gray-500 text-xs uppercase font-bold mb-8">
        {t('preview.notSupported')}
      </p>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-4">
          <button 
            onClick={onOpenAsText}
            disabled={isTooLarge}
            className="px-6 py-3 border-4 border-black font-bold uppercase transition-all text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-400 disabled:hover:bg-transparent"
            title={isTooLarge ? t('preview.fileTooLarge') : t('preview.tryOpenAsText')}
          >
            {t('preview.tryOpenAsText')}
          </button>
          
          <a 
            href={item.url} 
            download 
          className="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-yellow-400 hover:text-black border-4 border-black transition-all text-xs"
        >
          {t('preview.downloadFile')}
        </a>
        </div>
        
        {isTooLarge && (
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-wide">
            ⚠ {t('preview.fileTooLarge')}
          </p>
        )}
      </div>
    </div>
  );
};
