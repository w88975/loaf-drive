
import React from 'react';
import { Icons } from '../../constants';
import { DriveItem } from '../../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  currentFolderId: string | null;
  navigationHistory: DriveItem[];
  onNavigate: (id: string | null, item?: DriveItem) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  uploadingCount: number;
  overallProgress: number;
  onToggleUploadPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSidebar, currentFolderId, navigationHistory, onNavigate,
  searchQuery, onSearchChange, viewMode, onViewModeChange,
  uploadingCount, overallProgress, onToggleUploadPanel
}) => {
  return (
    <header className="h-16 border-b-2 border-black flex items-center justify-between px-4 md:px-6 bg-white sticky top-0 z-20">
      <div className="flex items-center flex-1 min-w-0">
        <button onClick={onOpenSidebar} className="md:hidden mr-4 p-1.5 border-2 border-black bg-white hover:bg-yellow-400 transition-colors">
          <Icons.List className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm font-bold overflow-hidden truncate">
          <button onClick={() => onNavigate(null)} className="hover:underline uppercase flex-shrink-0">ROOT</button>
          {navigationHistory.map((p) => (
            <React.Fragment key={p.id}>
              <Icons.ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              <button onClick={() => onNavigate(p.id, p)} className="hover:underline truncate uppercase">{p.name}</button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4 ml-4">
        <div className="relative hidden sm:block">
          <input 
            type="text" placeholder="SEARCH..." 
            className="pl-8 pr-4 py-1 border-2 border-black focus:bg-yellow-100 outline-none text-[10px] md:text-xs w-32 md:w-48 transition-all focus:w-64"
            value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          />
          <Icons.Search className="w-3 h-3 md:w-4 md:h-4 absolute left-2 top-1.5 md:top-2" />
        </div>

        {uploadingCount > 0 && (
          <button onClick={onToggleUploadPanel} className="relative flex items-center space-x-2 border-2 border-black px-2 py-1 text-[10px] font-bold uppercase bg-yellow-400 animate-pulse">
            <Icons.Download className="w-4 h-4 rotate-180" />
            <span className="hidden md:inline">UPLOADING {uploadingCount}...</span>
            <div className="absolute -bottom-2.5 left-0 w-full h-1 bg-black/10 overflow-hidden">
              <div className="h-full bg-black transition-all" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </button>
        )}
        
        <div className="flex border-2 border-black">
          <button onClick={() => onViewModeChange('grid')} className={`p-1 md:p-1.5 ${viewMode === 'grid' ? 'bg-yellow-400' : 'hover:bg-gray-100'}`}><Icons.Grid className="w-4 h-4" /></button>
          <button onClick={() => onViewModeChange('list')} className={`p-1 md:p-1.5 border-l-2 border-black ${viewMode === 'list' ? 'bg-yellow-400' : 'hover:bg-gray-100'}`}><Icons.List className="w-4 h-4" /></button>
        </div>
      </div>
    </header>
  );
};
