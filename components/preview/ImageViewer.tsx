
import React from 'react';
import { DriveItem } from '../../types';

export const ImageViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <img 
        src={item.url} 
        alt={item.name} 
        className="max-w-full max-h-full object-contain border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" 
      />
    </div>
  );
};
