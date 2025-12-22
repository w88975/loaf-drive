
import React from 'react';
import { Icons } from '../../constants';

interface SelectionBarProps {
  count: number;
  onMove: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({ count, onMove, onDelete, onClear }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-black text-white px-6 py-4 flex items-center space-x-8 shadow-[0_0_20px_rgba(0,0,0,0.4)] border-4 border-yellow-400 italic font-bold uppercase animate-in slide-in-from-bottom-full duration-200">
      <div className="text-sm tracking-tighter"><span className="text-yellow-400">{count}</span> ITEM(S) READY</div>
      <div className="flex space-x-4">
        <button 
          onClick={(e) => { e.stopPropagation(); onMove(); }} 
          className="hover:text-yellow-400 transition-colors flex items-center space-x-2 text-xs"
        >
          <Icons.More className="w-4 h-4" /><span>Move</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="hover:text-red-500 transition-colors flex items-center space-x-2 text-xs"
        >
          <Icons.Trash className="w-4 h-4" /><span>Delete</span>
        </button>
      </div>
      <button onClick={onClear} className="p-1 hover:text-yellow-400 border-l border-white/20 pl-4">
        <Icons.Close className="w-4 h-4" />
      </button>
    </div>
  );
};
