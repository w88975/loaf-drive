import React from 'react';
import { DriveItem } from '../../types';

export const PDFViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <iframe
        src={item.url}
        title={item.name}
        className="w-full h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      />
    </div>
  );
};

