
import React from 'react';
import { Icons } from '../../constants';
import { DriveItem } from '../../types';
import { getFileIcon, formatSize, formatDate } from '../../utils';

interface PreviewModalProps {
  item: DriveItem;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  const iconType = getFileIcon(item.type, item.extension);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border-4 border-black w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-yellow-400">
          <h2 className="font-bold uppercase tracking-tight truncate flex-1 mr-4 italic">{item.name}</h2>
          <div className="flex items-center space-x-4">
            <a href={item.url} download className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors">
              <Icons.Download className="w-5 h-5" />
            </a>
            <button onClick={onClose} className="p-2 bg-black text-white hover:bg-red-500 border-2 border-black transition-colors">
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
          {iconType === 'image' ? (
            <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain border-2 border-black" />
          ) : iconType === 'video' ? (
            <video src={item.url} controls autoPlay className="max-w-full max-h-full border-2 border-black" />
          ) : (
            <div className="flex flex-col items-center opacity-30">
              <Icons.File className="w-24 h-24 mb-4" />
              <p className="font-bold italic">PREVIEW NOT AVAILABLE</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t-2 border-black text-[9px] font-bold uppercase grid grid-cols-3 bg-white">
          <div><span className="text-gray-400">SIZE:</span> {formatSize(item.size || 0)}</div>
          <div className="text-center"><span className="text-gray-400">TYPE:</span> {item.extension || 'FILE'}</div>
          <div className="text-right"><span className="text-gray-400">MODIFIED:</span> {formatDate(item.modifiedAt)}</div>
        </div>
      </div>
    </div>
  );
};
