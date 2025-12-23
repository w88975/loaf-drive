
import React, { useRef } from 'react';
import { DriveItem } from '../../types';
import { Icons } from '../../constants';
import { formatSize, getFileIcon, formatDate } from '../../utils';

interface FileItemProps {
  item: DriveItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onLongPress: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}

export const FileItem: React.FC<FileItemProps> = ({ 
  item, 
  viewMode, 
  isSelected, 
  onSelect, 
  onLongPress,
  onContextMenu,
  onRename,
  onMove,
  onDelete
}) => {
  const isFolder = item.type === 'folder';
  const iconType = getFileIcon(item.type, item.extension);
  const pressTimer = useRef<number | null>(null);
  const isLongPressActive = useRef(false);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
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
    if (!isLongPressActive.current) {
      onSelect();
    }
    isLongPressActive.current = false;
  };

  const eventHandlers = {
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: endPress,
    onTouchStart: startPress,
    onTouchEnd: endPress,
    onClick: handleClick,
    onContextMenu: onContextMenu
  };

  if (viewMode === 'grid') {
    const hasPreview = (iconType === 'image' && item.url) || (iconType === 'video' && item.previews && item.previews.length > 0);
    const previewSrc = iconType === 'image' ? item.url : (item.previews ? item.previews[0] : null);

    return (
      <div 
        {...eventHandlers}
        className={`group relative aspect-square border-2 border-black flex flex-col items-center justify-between cursor-pointer transition-all overflow-hidden ${isSelected ? 'bg-yellow-200 ring-4 ring-black scale-[0.98]' : 'hover:bg-gray-50 active:scale-95'}`}
      >
        <div className="flex-1 flex items-center justify-center w-full relative">
          {isFolder ? (
            <Icons.Folder className="w-10 h-10" />
          ) : hasPreview && previewSrc ? (
            <div className="absolute inset-0 p-1">
              <img src={previewSrc} alt="" className="w-full h-full object-cover border border-black/5 pointer-events-none" />
              {iconType === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/40 backdrop-blur-sm rounded-full p-1 border border-white/30">
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ) : iconType === 'video' ? (
            <Icons.Video className="w-10 h-10" />
          ) : (
            <Icons.File className="w-10 h-10" />
          )}
          
          {isSelected && (
            <div className="absolute top-2 left-2 z-20">
              <div className="w-5 h-5 bg-black border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400" />
              </div>
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
        <input 
          type="checkbox" 
          className="w-4 h-4 accent-black cursor-pointer border-2 border-black"
          checked={isSelected}
          readOnly
        />
      </td>
      <td className="p-3 flex items-center space-x-3 border-r-2 border-black font-bold uppercase truncate align-middle">
        <div className="flex-shrink-0">
          {isFolder ? <Icons.Folder className="w-4 h-4" /> : iconType === 'video' ? <Icons.Video className="w-4 h-4" /> : iconType === 'image' ? <Icons.Image className="w-4 h-4" /> : <Icons.File className="w-4 h-4" />}
        </div>
        <span className="truncate">{item.name}</span>
      </td>
      <td className="p-3 border-r-2 border-black text-gray-600 uppercase text-center align-middle font-bold text-[9px]">
        {isFolder ? '--' : formatSize(item.size || 0)}
      </td>
      <td className="p-3 border-r-2 border-black text-gray-400 uppercase text-center align-middle font-medium hidden sm:table-cell text-[8px]">
        {formatDate(item.modifiedAt)}
      </td>
      <td className="p-3 text-center align-middle">
        <div className="flex items-center justify-center space-x-2 text-[8px] font-black tracking-tighter">
          <button 
            onClick={(e) => { e.stopPropagation(); onRename(); }} 
            className="hover:bg-black hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white"
          >
            RENAME
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMove(); }} 
            className="hover:bg-black hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white"
          >
            MOVE
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="hover:bg-red-500 hover:text-white px-2 py-1 border-2 border-black transition-colors bg-white"
          >
            DELETE
          </button>
        </div>
      </td>
    </tr>
  );
};
