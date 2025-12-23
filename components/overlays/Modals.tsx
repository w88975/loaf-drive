/**
 * Modals.tsx
 * 
 * 【模态框组件集合】
 * 
 * 此文件提供了所有用户交互所需的模态框组件，包括：
 * - 新建文件夹模态框
 * - 重命名模态框
 * - 密码输入模态框
 * - 删除确认模态框
 * - 移动文件/文件夹模态框
 * 
 * 所有模态框均基于统一的 ModalShell 包装器，确保一致的 UI 风格
 */

import React, { useState, useEffect } from 'react';
import { Icons } from '../../constants';
import { DriveItem, FolderTreeItem } from '../../types';
import { driveApi } from '../../api/drive';

/**
 * 模态框通用包装器的 Props 接口
 */
interface ModalShellProps {
  title: string;                   // 模态框标题
  onClose: () => void;              // 关闭回调
  children: React.ReactNode;        // 模态框内容
  footer?: React.ReactNode;         // 底部按钮区域（可选）
  widthClass?: string;              // Tailwind 宽度类名（默认 max-w-sm）
  isError?: boolean;                // 是否为错误/警告类型（影响标题颜色）
}

/**
 * 【模态框通用壳组件】
 * 
 * 提供统一的模态框外观和行为：
 * - 全屏半透明遮罩
 * - Geek-Brutalism 风格的黑色边框和阴影
 * - 点击遮罩关闭，点击内容区阻止事件冒泡
 * - z-index 为 120，确保位于所有内容之上
 */
const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, children, footer, widthClass = 'max-w-sm', isError }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div className={`bg-white border-4 border-black w-full ${widthClass} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`} onClick={e => e.stopPropagation()}>
      <h2 className={`text-lg font-bold uppercase italic mb-4 border-b-2 border-black pb-2 ${isError ? 'text-red-600' : ''}`}>{title}</h2>
      {children}
      {footer && <div className="flex space-x-3 mt-6">{footer}</div>}
    </div>
  </div>
);

/**
 * 【文件夹树节点组件】
 * 
 * 用于 MoveModal 中递归渲染文件夹树结构
 * 
 * @param folder - 当前文件夹数据（包含子文件夹）
 * @param level - 树的嵌套层级（用于控制左侧缩进）
 * @param selectedId - 当前选中的文件夹 ID
 * @param onSelect - 选择文件夹的回调函数
 * 
 * 特性：
 * - 支持折叠/展开（有子文件夹时显示 chevron 按钮）
 * - 根据层级动态计算左侧缩进
 * - 选中时高亮显示黄色背景
 * - 递归渲染子文件夹
 */
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

/**
 * 【新建文件夹模态框】
 * 
 * @param onClose - 关闭回调
 * @param onConfirm - 确认创建回调（传入文件夹名称）
 * 
 * 用户输入：文件夹名称
 * 支持 Enter 键快速确认
 */
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

/**
 * 【重命名模态框】
 * 
 * @param item - 要重命名的文件/文件夹项
 * @param onClose - 关闭回调
 * @param onConfirm - 确认重命名回调（传入新名称）
 * 
 * 输入框默认值为项目的当前名称
 * 支持 Enter 键快速确认
 */
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

/**
 * 【密码输入模态框】
 * 
 * @param folderName - 加密文件夹的名称
 * @param onClose - 关闭回调
 * @param onConfirm - 确认密码回调（传入用户输入的密码）
 * 
 * 用于访问设置了密码的文件夹
 * 输入框类型为 password，密码字符显示为点
 * 支持 Enter 键快速提交
 */
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

/**
 * 删除模态框的 Props 接口
 */
interface DeleteModalProps {
  title?: string;           // 模态框标题（可选，默认为 "Delete Items?"）
  count: number;            // 要删除的项目数量
  isPermanent?: boolean;    // 是否为永久删除（true: 永久删除, false: 移至回收站）
  onClose: () => void;      // 关闭回调
  onConfirm: () => void;    // 确认删除回调
}

/**
 * 【删除确认模态框】
 * 
 * 用于两种删除场景：
 * 1. 从文件视图删除 -> 移至回收站（isPermanent=false）
 * 2. 从回收站删除 -> 永久删除（isPermanent=true）
 * 
 * 特性：
 * - 红色警告样式（isError 标志位开启）
 * - 显示删除项目数量
 * - 提示文件夹删除将包含所有子内容
 * - 永久删除时额外显示不可撤销警告
 */
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

/**
 * 【移动文件/文件夹模态框】
 * 
 * @param count - 要移动的项目数量
 * @param onClose - 关闭回调
 * @param onConfirm - 确认移动回调（传入目标文件夹 ID，null 代表根目录）
 * 
 * 功能流程：
 * 1. 组件挂载时调用 fetchTree API 获取完整文件夹树
 * 2. 显示加载动画直到数据加载完成
 * 3. 渲染文件夹树供用户选择目标位置
 * 4. 用户可选择根目录（selectedId=null）或任意文件夹
 * 5. 确认后将选中的文件夹 ID 传递给父组件
 * 
 * 特性：
 * - 递归渲染文件夹树（使用 TreeItem 组件）
 * - 支持折叠/展开子文件夹
 * - 选中的文件夹高亮显示
 * - 最大高度 80（max-h-80），超出自动滚动
 */
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
