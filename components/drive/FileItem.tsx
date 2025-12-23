
/**
 * FileItem.tsx
 */

import React, { useRef } from 'react';
import { DriveItem } from '../../types';
import { Icons } from '../../constants';
import { formatSize, getFileIcon, formatDate } from '../../utils';
import { FilePreviewLoop } from './FilePreviewLoop';

interface FileItemProps {
  item: DriveItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  isReadOnly?: boolean;                         // 新增：只读模式标记
  onSelect: () => void;
  onLongPress: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onShare?: () => void;                          // 新增：分享回调
}

export const FileItem: React.FC<FileItemProps> = ({ 
  item, 
  viewMode, 
  isSelected, 
  isReadOnly = false,
  onSelect, 
  onLongPress,
  onContextMenu,
  onRename,
  onMove,
  onDelete,
  onShare
}) => {
  const isFolder = item.type === 'folder';
  const iconKey = getFileIcon(item.type, item.extension);
  const pressTimer = useRef<number | null>(null);
  const isLongPressActive = useRef(false);

  const startPress = () => {
    isLongPressActive.current = false;
    pressTimer.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      onLongPress();
      pressTimer.current = null;
    }, 600);
  };

  const endPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLongPressActive.current) onSelect();
    isLongPressActive.current = false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isReadOnly) return; // 只读模式禁用右键
    e.stopPropagation();
    onContextMenu(e);
  };

  const eventHandlers = {
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: endPress,
    onTouchStart: startPress,
    onTouchEnd: endPress,
    onClick: handleClick,
    onContextMenu: handleContextMenu
  };

  const IconComponent = Icons[iconKey] || Icons.File;

  if (viewMode === 'grid') {
    const hasPreviews = item.previews && item.previews.length > 0;
    const isImage = iconKey === 'Image';
    const isVideo = iconKey === 'Video';
    const showPreview = hasPreviews || (isImage && item.url);

    return (
      <div 
        {...eventHandlers}
        className={`group relative aspect-square border-2 border-black flex flex-col items-center justify-between cursor-pointer transition-all overflow-hidden ${isSelected ? 'bg-yellow-200 ring-4 ring-black scale-[0.98]' : 'hover:bg-gray-50 active:scale-95'}`}
      >
        <div className="flex-1 flex items-center justify-center w-full relative">
          {isFolder ? (
            <div className="relative">
              <IconComponent className="w-10 h-10" />
              {item.isLocked && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                </div>
              )}
            </div>
          ) : showPreview ? (
            <div className="absolute inset-0 p-1">
              {hasPreviews ? <FilePreviewLoop previews={item.previews!} /> : <img src={item.url} alt="" className="w-full h-full object-cover border border-black/5" />}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/40 backdrop-blur-sm rounded-full p-1 border border-white/30">
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              )}
            </div>
          ) : <IconComponent className="w-10 h-10" />}
          
          {isSelected && (
            <div className="absolute top-2 left-2 z-20">
              <div className="w-5 h-5 bg-black border-2 border-white flex items-center justify-center"><div className="w-2 h-2 bg-yellow-400" /></div>
            </div>
          )}
        </div>
        
        <div className="w-full text-center p-2 bg-white/95 border-t-2 border-black z-10">
          <p className="text-[9px] font-bold truncate uppercase px-1">{item.name}</p>
          <p className="text-[7px] text-gray-500 font-black uppercase">{isFolder ? 'DIRECTORY' : formatSize(item.size || 0)}</p>
        </div>
      </div>
    );
  }

  return (
    <tr 
      {...eventHandlers}
      className={`border-b-2 border-black hover:bg-yellow-50 cursor-pointer transition-colors ${isSelected ? 'bg-yellow-100' : ''}`}
    >
      <td className="p-3 w-[40px] border-r-2 border-black text-center align-middle">
        <input type="checkbox" className="w-4 h-4 accent-black cursor-pointer border-2 border-black" checked={isSelected} readOnly />
      </td>
      <td className="p-3 flex items-center space-x-3 border-r-2 border-black font-bold uppercase truncate align-middle">
        <div className="flex-shrink-0 flex items-center"><IconComponent className="w-4 h-4" />{isFolder && item.isLocked && <span className="ml-1 opacity-50">🔒</span>}</div>
        <span className="truncate">{item.name}</span>
      </td>
      <td className="p-3 border-r-2 border-black text-gray-600 uppercase text-center align-middle font-bold text-[9px]">{isFolder ? '--' : formatSize(item.size || 0)}</td>
      <td className="p-3 border-r-2 border-black text-gray-400 uppercase text-center align-middle font-medium hidden sm:table-cell text-[8px]">{formatDate(item.modifiedAt)}</td>
      <td className="p-3 text-center align-middle">
        <div className="flex items-center justify-center space-x-2 text-[8px] font-black tracking-tighter">
          {!isReadOnly ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onRename?.(); }} className="hover:bg-black hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white uppercase">Rename</button>
              <button onClick={(e) => { e.stopPropagation(); onMove?.(); }} className="hover:bg-black hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white uppercase">Move</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="hover:bg-red-500 hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white uppercase">Delete</button>
            </>
          ) : (
             <button onClick={(e) => { e.stopPropagation(); onShare?.(); }} className="hover:bg-yellow-400 px-2 py-1 border-2 border-black transition-colors bg-white uppercase">Link</button>
          )}
        </div>
      </td>
    </tr>
  );
};
