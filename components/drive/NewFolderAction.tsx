
import React from 'react';
import { Icons } from '../../constants';

interface NewFolderActionProps {
  onClick: () => void;
}

export const NewFolderAction: React.FC<NewFolderActionProps> = ({ onClick }) => {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      className="flex items-center space-x-2 bg-white text-black px-3 md:px-4 py-2 hover:bg-yellow-400 transition-colors border-2 border-black text-[10px] md:text-xs font-bold uppercase"
    >
      <Icons.Folder className="w-3 h-3" />
      <span>New Folder</span>
    </button>
  );
};
