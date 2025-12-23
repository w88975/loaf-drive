
import React, { useState, useEffect } from 'react';
import { Icons } from '../../constants';
import { DriveItem, FolderTreeItem } from '../../types';
import { driveApi } from '../../api/drive';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
  isError?: boolean;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, children, footer, widthClass = 'max-w-sm', isError }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div className={`bg-white border-4 border-black w-full ${widthClass} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`} onClick={e => e.stopPropagation()}>
      <h2 className={`text-lg font-bold uppercase italic mb-4 border-b-2 border-black pb-2 ${isError ? 'text-red-600' : ''}`}>{title}</h2>
      {children}
      {footer && <div className="flex space-x-3 mt-6">{footer}</div>}
    </div>
  </div>
);

const TreeItem: React.FC<{ folder: FolderTreeItem, level: number, selectedId: string | null, onSelect: (id: string | null) => void }> = ({ folder, level, selectedId, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div className="w-full">
      <div 
        onClick={() => onSelect(folder.id)}
        className={`w-full flex items-center p-2 text-[10px] font-bold uppercase border-b border-black/5 hover:bg-yellow-100 cursor-pointer ${selectedId === folder.id ? 'bg-yellow-400' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
            className={`mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <Icons.ChevronRight className="w-3 h-3" />
          </button>
        )}
        <Icons.Folder className={`w-4 h-4 mr-2 ${!hasChildren ? 'ml-4' : ''}`} />
        <span className="truncate">{folder.name}</span>
      </div>
      {isExpanded && folder.children?.map(child => (
        <TreeItem key={child.id} folder={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
};

export const NewFolderModal: React.FC<{ onClose: () => void, onConfirm: (name: string) => void }> = ({ onClose, onConfirm }) => {
  const [name, setName] = useState('');
  return (
    <ModalShell title="Create Folder" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button>
        <button onClick={() => onConfirm(name)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Create</button>
      </>
    }>
      <input autoFocus type="text" placeholder="NAME..." className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onConfirm(name)} />
    </ModalShell>
  );
};

export const RenameModal: React.FC<{ item: DriveItem, onClose: () => void, onConfirm: (name: string) => void }> = ({ item, onClose, onConfirm }) => {
  const [name, setName] = useState(item.name);
  return (
    <ModalShell title="Rename" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button>
        <button onClick={() => onConfirm(name)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Save</button>
      </>
    }>
      <input autoFocus type="text" className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onConfirm(name)} />
    </ModalShell>
  );
};

export const PasswordModal: React.FC<{ folderName: string, onClose: () => void, onConfirm: (password: string) => void }> = ({ folderName, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  return (
    <ModalShell title="Encrypted Folder" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button>
        <button onClick={() => onConfirm(password)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Enter</button>
      </>
    }>
      <p className="text-[10px] font-bold uppercase mb-2">Accessing: <span className="italic">{folderName}</span></p>
      <input autoFocus type="password" placeholder="PASSWORD..." className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase tracking-widest" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && onConfirm(password)} />
    </ModalShell>
  );
};

interface DeleteModalProps {
  title?: string;
  count: number;
  isPermanent?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ 
  title = "Delete Items?", 
  count, 
  isPermanent = false, 
  onClose, 
  onConfirm 
}) => (
  <ModalShell title={title} onClose={onClose} isError footer={
    <>
      <button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button>
      <button onClick={onConfirm} className="flex-1 bg-red-600 text-white p-2 font-bold uppercase hover:bg-red-700 transition-colors border-2 border-black">
        {isPermanent ? 'Delete Permanently' : 'Move to Trash'}
      </button>
    </>
  }>
    <div className="space-y-3">
      <p className="text-xs uppercase font-bold">
        {isPermanent 
          ? `Are you sure you want to PERMANENTLY delete ${count} item(s)?` 
          : `Are you sure you want to move ${count} item(s) to the recycle bin?`}
      </p>
      <div className="bg-red-50 border-l-4 border-red-600 p-2">
        <p className="text-[10px] uppercase font-black text-red-700 italic">
          Notice: Deleting folders will recursively include all their contents.
        </p>
      </div>
      {isPermanent && (
        <p className="text-[10px] uppercase font-bold text-red-500 underline">
          This action cannot be undone.
        </p>
      )}
    </div>
  </ModalShell>
);

export const MoveModal: React.FC<{ count: number, onClose: () => void, onConfirm: (id: string | null) => void }> = ({ count, onClose, onConfirm }) => {
  const [tree, setTree] = useState<FolderTreeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driveApi.fetchTree().then(res => { if (res.code === 0) setTree(res.data); setLoading(false); });
  }, []);

  return (
    <ModalShell title={`Move ${count} items`} onClose={onClose} widthClass="max-w-md" footer={
      <>
        <button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button>
        <button onClick={() => onConfirm(selectedId)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Confirm Move</button>
      </>
    }>
      <div className="max-h-80 overflow-y-auto border-2 border-black bg-gray-50">
        {loading ? <div className="p-8 flex justify-center"><Icons.Grid className="w-6 h-6 animate-spin" /></div> : (
          <>
            <div onClick={() => setSelectedId(null)} className={`w-full flex items-center p-3 text-[10px] font-bold uppercase border-b-2 border-black hover:bg-yellow-100 cursor-pointer ${selectedId === null ? 'bg-yellow-400' : ''}`}>
              <Icons.Folder className="w-4 h-4 mr-2" /> / ROOT
            </div>
            {tree.map(f => <TreeItem key={f.id} folder={f} level={0} selectedId={selectedId} onSelect={setSelectedId} />)}
          </>
        )}
      </div>
    </ModalShell>
  );
};
