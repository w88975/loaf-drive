
import React from 'react';
import { DriveItem } from '../../types';

export const VideoViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-black">
      <video 
        src={item.url} 
        controls 
        autoPlay 
        className="max-w-full max-h-full border-2 border-white/10" 
      />
    </div>
  );
};
