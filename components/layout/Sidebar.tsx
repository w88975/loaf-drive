
import React from 'react';
import { NavLink } from 'https://esm.sh/react-router-dom@6';
import { Icons } from '../../constants';
import { CONFIG } from '../../config';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoot: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSelectRoot }) => {
  const hostName = new URL(CONFIG.API_HOST).hostname;

  const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, to: string, onClick?: () => void }> = ({ icon, label, to, onClick }) => (
    <NavLink 
      to={to}
      onClick={() => { onClick?.(); onClose(); }}
      className={({ isActive }) => `w-full flex items-center space-x-3 px-4 py-3 rounded-none transition-all duration-200 border-l-4 ${isActive ? 'bg-yellow-400 border-black text-black font-bold' : 'bg-transparent border-transparent hover:bg-gray-100 text-gray-600'}`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-mono text-sm uppercase tracking-tight">{label}</span>
    </NavLink>
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r-2 border-black transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b-2 border-black">
          <h1 className="text-2xl font-bold tracking-tighter italic">GEEK.DRIVE</h1>
          <p className="text-[10px] uppercase text-gray-500 mt-1">Status: Online</p>
        </div>
        <nav className="mt-4">
          <SidebarItem 
            icon={<Icons.Grid />} 
            label="All Files" 
            to="/" 
            onClick={onSelectRoot} 
          />
          <SidebarItem 
            icon={<Icons.Trash />} 
            label="Trash" 
            to="/trash"
          />
        </nav>
        <div className="absolute bottom-0 w-full p-6 border-t-2 border-black bg-white">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs uppercase font-bold">Cloud Nodes</span>
            <span className="text-[10px] text-gray-500">Live API</span>
          </div>
          <div className="text-[9px] text-gray-400 uppercase leading-tight">Connected to {hostName}<br/>Secure storage protocol v1</div>
        </div>
      </aside>
    </>
  );
};
