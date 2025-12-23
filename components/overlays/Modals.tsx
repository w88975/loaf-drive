
/**
 * Modals.tsx
 */

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
    <div className={`bg-white border-4 border-black w-full ${widthClass} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-150`} onClick={e => e.stopPropagation()}>
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
      <div onClick={() => onSelect(folder.id)} className={`w-full flex items-center p-2 text-[10px] font-bold uppercase border-b border-black/5 hover:bg-yellow-100 cursor-pointer ${selectedId === folder.id ? 'bg-yellow-400' : ''}`} style={{ paddingLeft: `${level * 16 + 8}px` }}>
        {hasChildren && <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className={`mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}><Icons.ChevronRight className="w-3 h-3" /></button>}
        <Icons.Folder className={`w-4 h-4 mr-2 ${!hasChildren ? 'ml-4' : ''}`} />
        <span className="truncate">{folder.name}</span>
      </div>
      {isExpanded && folder.children?.map(child => <TreeItem key={child.id} folder={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} />)}
    </div>
  );
};

export const NewFolderModal: React.FC<{ onClose: () => void, onConfirm: (name: string) => void }> = ({ onClose, onConfirm }) => {
  const [name, setName] = useState('');
  return (
    <ModalShell title="Create Folder" onClose={onClose} footer={
      <><button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button><button onClick={() => onConfirm(name)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Create</button></>
    }><input autoFocus type="text" placeholder="NAME..." className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onConfirm(name)} /></ModalShell>
  );
};

export const RenameModal: React.FC<{ item: DriveItem, onClose: () => void, onConfirm: (name: string) => void }> = ({ item, onClose, onConfirm }) => {
  const [name, setName] = useState(item.name);
  return (
    <ModalShell title="Rename" onClose={onClose} footer={
      <><button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button><button onClick={() => onConfirm(name)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Save</button></>
    }><input autoFocus type="text" className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onConfirm(name)} /></ModalShell>
  );
};

export const PasswordModal: React.FC<{ folderName: string, onClose: () => void, onConfirm: (password: string) => void }> = ({ folderName, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  return (
    <ModalShell title="Access Restricted" onClose={onClose} footer={
      <><button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button><button onClick={() => onConfirm(password)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Enter</button></>
    }><p className="text-[10px] font-bold uppercase mb-2">Target: <span className="italic">{folderName}</span></p><input autoFocus type="password" placeholder="PASSWORD..." className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase tracking-widest" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && onConfirm(password)} /></ModalShell>
  );
};

export const DeleteModal: React.FC<{ title?: string, count: number, isPermanent?: boolean, onClose: () => void, onConfirm: () => void }> = ({ title = "Delete Items?", count, isPermanent = false, onClose, onConfirm }) => (
  <ModalShell title={title} onClose={onClose} isError footer={<><button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button><button onClick={onConfirm} className="flex-1 bg-red-600 text-white p-2 font-bold uppercase hover:bg-red-700 transition-colors border-2 border-black">{isPermanent ? 'Delete Permanently' : 'Move to Trash'}</button></>}>
    <div className="space-y-3"><p className="text-xs uppercase font-bold">{isPermanent ? `PERMANENTLY delete ${count} item(s)?` : `Move ${count} item(s) to bin?`}</p><div className="bg-red-50 border-l-4 border-red-600 p-2"><p className="text-[10px] uppercase font-black text-red-700 italic">Recursively includes all sub-contents.</p></div></div>
  </ModalShell>
);

export const MoveModal: React.FC<{ count: number, onClose: () => void, onConfirm: (id: string | null) => void }> = ({ count, onClose, onConfirm }) => {
  const [tree, setTree] = useState<FolderTreeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { driveApi.fetchTree().then(res => { if (res.code === 0) setTree(res.data); setLoading(false); }); }, []);
  return (
    <ModalShell title={`Move ${count} items`} onClose={onClose} widthClass="max-w-md" footer={<><button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button><button onClick={() => onConfirm(selectedId)} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Confirm</button></>}>
      <div className="max-h-80 overflow-y-auto border-2 border-black bg-gray-50">{loading ? <div className="p-8 flex justify-center"><Icons.Grid className="w-6 h-6 animate-spin" /></div> : <><div onClick={() => setSelectedId(null)} className={`w-full flex items-center p-3 text-[10px] font-bold uppercase border-b-2 border-black hover:bg-yellow-100 cursor-pointer ${selectedId === null ? 'bg-yellow-400' : ''}`}><Icons.Folder className="w-4 h-4 mr-2" /> / ROOT</div>{tree.map(f => <TreeItem key={f.id} folder={f} level={0} selectedId={selectedId} onSelect={setSelectedId} />)}</>}</div>
    </ModalShell>
  );
};

/**
 * 分享创建模态框
 */
export const ShareModal: React.FC<{ item: DriveItem, onClose: () => void, onConfirm: (data: any) => void }> = ({ item, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [days, setDays] = useState('7');

  const handleConfirm = () => {
    const expiresAt = days === 'forever' ? undefined : new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
    onConfirm({ fileId: item.id, password: password || undefined, expiresAt });
  };

  return (
    <ModalShell title="Share Item" onClose={onClose} footer={
      <><button onClick={onClose} className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100">Cancel</button><button onClick={handleConfirm} className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black">Generate</button></>
    }>
      <p className="text-[10px] font-bold uppercase mb-4">Sharing: <span className="italic">{item.name}</span></p>
      <div className="space-y-4">
        <div>
          <label className="text-[8px] font-black uppercase text-gray-500 mb-1 block">Password (Optional)</label>
          <input type="text" placeholder="EMPTY FOR PUBLIC" className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase tracking-widest" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-[8px] font-black uppercase text-gray-500 mb-1 block">Expiration</label>
          <select className="w-full border-2 border-black p-3 outline-none focus:bg-yellow-100 text-sm font-bold uppercase" value={days} onChange={e => setDays(e.target.value)}>
            <option value="1">1 Day</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="forever">Never</option>
          </select>
        </div>
      </div>
    </ModalShell>
  );
};

/**
 * 分享结果展示模态框
 */
export const ShareResultModal: React.FC<{ code: string, onClose: () => void }> = ({ code, onClose }) => {
  const url = `${window.location.origin}/#/share/${code}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalShell title="Link Generated" onClose={onClose} footer={
      <button onClick={onClose} className="w-full bg-black text-white p-2 font-bold uppercase border-2 border-black hover:bg-yellow-400 hover:text-black">Close</button>
    }>
      <div className="bg-gray-100 p-4 border-2 border-dashed border-black mb-4">
        <p className="text-[9px] font-mono break-all">{url}</p>
      </div>
      <button onClick={handleCopy} className="w-full border-4 border-black p-3 font-bold uppercase hover:bg-yellow-400 transition-all flex items-center justify-center space-x-2">
        <Icons.Download className="w-4 h-4 -rotate-90" />
        <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
      </button>
    </ModalShell>
  );
};
