
import React from 'react';
import { Icons } from '../../constants';
import { DriveItem } from '../../types';

export const UnsupportedViewer: React.FC<{ item: DriveItem, onOpenAsText: () => void }> = ({ item, onOpenAsText }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <Icons.File className="w-24 h-24 mb-6 opacity-20" />
      <h3 className="text-xl font-bold uppercase italic mb-2">Preview Not Available</h3>
      <p className="text-gray-500 text-xs uppercase font-bold mb-8">
        We don't support previewing .{item.extension} files yet.
      </p>
      
      <div className="flex space-x-4">
        <button 
          onClick={onOpenAsText}
          className="px-6 py-3 border-4 border-black font-bold uppercase hover:bg-yellow-400 transition-all text-xs"
        >
          Try opening as text
        </button>
        <a 
          href={item.url} 
          download 
          className="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-yellow-400 hover:text-black border-4 border-black transition-all text-xs"
        >
          Download File
        </a>
      </div>
    </div>
  );
};
