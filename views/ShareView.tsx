
/**
 * ShareView.tsx
 * 
 * 【公众分享页视图】
 * 
 * 这是一个独立的外部页面，用于展示分享的内容。
 * 包含密码校验、文件列表展示、多媒体预览等功能。
 */

import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icons } from '../constants';
import { DriveItem, SortKey, SortOrder } from '../types';
import { useShareInfo, useShareFiles, mapApiItem } from '../hooks/useDriveQueries';
import { driveApi } from '../api/drive';
import { GridView } from '../components/drive/GridView';
import { ListView } from '../components/drive/ListView';
import { PreviewModal } from '../components/overlays/PreviewModal';
import { PasswordModal } from '../components/overlays/Modals';
import { CONFIG } from '../config';

export const ShareView: React.FC = () => {
  // 1. 路由参数获取分享码
  const { code } = useParams<{ code: string }>();
  
  // 2. UI 交互状态
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [subFolderId, setSubFolderId] = useState<string | undefined>(undefined);
  const [isVerifying, setIsVerifying] = useState(false);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [navigationStack, setNavigationStack] = useState<{id: string, name: string}[]>([]);
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);

  // 3. 数据查询：先获取分享的基础信息（判断是否有密码）
  const { data: shareInfo, isLoading: infoLoading, error: infoError } = useShareInfo(code || '');
  
  // 4. 数据查询：获取分享的内容（如果是文件夹则列出文件）
  const { data: shareContent, isLoading: contentLoading, error: contentError, refetch } = useShareFiles(code || '', subFolderId, accessToken);

  // 5. 处理进入子文件夹
  const handleNavigate = (item: DriveItem) => {
    if (item.type === 'folder') {
      setNavigationStack(prev => [...prev, { id: item.id, name: item.name }]);
      setSubFolderId(item.id);
    } else {
      setPreviewItem(item);
    }
  };

  // 6. 处理面包屑回退
  const handlePopStack = (index: number) => {
    if (index === -1) {
      setNavigationStack([]);
      setSubFolderId(undefined);
    } else {
      const target = navigationStack[index];
      if (target) {
        setNavigationStack(navigationStack.slice(0, index + 1));
        setSubFolderId(target.id);
      }
    }
  };

  // 7. 处理密码验证
  const handlePasswordConfirm = async (pwd: string) => {
    if (!code) return;
    setIsVerifying(true);
    try {
      const res = await driveApi.verifySharePassword(code, pwd);
      if (res.code === 0 && res.data.accessToken) {
        setAccessToken(res.data.accessToken);
        setShowManualPassword(false);
        await refetch();
      } else {
        alert('Invalid Password');
      }
    } catch (e) {
      alert('Verification Failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // 8. 处理文件下载
  const handleDownload = async (fileId: string, filename: string) => {
    if (!code) return;
    setIsDownloading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['x-share-token'] = accessToken;
      }
      
      const response = await fetch(`${CONFIG.API_HOST}/api/shares/${code}/download/${fileId}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  // 9. 排序逻辑
  const sortedItems = useMemo(() => {
    const items = shareContent?.items || [];
    return [...items].map(mapApiItem).sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      
      const valA = a[sortKey] ?? '';
      const valB = b[sortKey] ?? '';
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [shareContent, sortKey, sortOrder]);

  // 10. 异常状态处理 (403 触发密码框)
  // 增加 showManualPassword 状态控制，避免 refetch 瞬间由于旧错误导致的闪烁
  const needsPassword = (contentError as any)?.code === 403 || showManualPassword;

  if (infoLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Icons.Grid className="w-12 h-12 animate-spin" />
      </div>
    );
  }
  
  if (infoError || !shareInfo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <Icons.Close className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Share Unavailable</h1>
        <p className="text-gray-500 text-xs uppercase font-bold max-w-sm">
          This link might have expired, reached its view limit, or the item was deleted.
        </p>
        <Link to="/" className="mt-8 border-4 border-black px-8 py-3 font-bold uppercase hover:bg-yellow-400 transition-all">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col">
      <header className="h-20 border-b-4 border-black px-6 flex items-center justify-between sticky top-0 bg-white z-50">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-black text-white border-2 border-black">
            <Icons.Folder className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase italic tracking-tighter truncate max-w-md">
              {shareInfo.file?.filename || 'Shared Content'}
            </h1>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
              Shared Publicly • {shareInfo.views} Views
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border-2 border-black">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 ${viewMode === 'grid' ? 'bg-yellow-400' : 'hover:bg-gray-100'}`}
            >
              <Icons.Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 border-l-2 border-black ${viewMode === 'list' ? 'bg-yellow-400' : 'hover:bg-gray-100'}`}
            >
              <Icons.List className="w-4 h-4" />
            </button>
          </div>
          {/* 移除分享页面的关闭/跳转按钮 */}
        </div>
      </header>

      <main className="flex-1 p-6">
        {navigationStack.length > 0 && (
          <div className="flex items-center space-x-2 mb-6 text-[10px] font-bold uppercase bg-gray-50 p-3 border-2 border-black overflow-x-auto">
            <button onClick={() => handlePopStack(-1)} className="hover:underline">ROOT</button>
            {navigationStack.map((nav, idx) => (
              <React.Fragment key={nav.id}>
                <Icons.ChevronRight className="w-3 h-3" />
                <button onClick={() => handlePopStack(idx)} className="hover:underline truncate max-w-[150px]">
                  {nav.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {contentLoading && !needsPassword ? (
          <div className="h-64 flex items-center justify-center">
            <Icons.Grid className="w-8 h-8 animate-spin" />
          </div>
        ) : shareContent?.isFolder ? (
          viewMode === 'grid' ? (
            <GridView 
              items={sortedItems} 
              selectedIds={new Set()} 
              isReadOnly={true}
              onItemClick={handleNavigate} 
              onItemLongPress={() => {}} 
              onContextMenu={() => {}} 
            />
          ) : (
            <ListView 
              items={sortedItems} 
              selectedIds={new Set()} 
              isReadOnly={true}
              onItemClick={handleNavigate} 
              onItemLongPress={() => {}} 
              onContextMenu={() => {}}
              onSelectAll={() => {}} 
              onSort={(key) => { 
                if (sortKey === key) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortKey(key);
                  setSortOrder('asc');
                }
              }}
              sortKey={sortKey} 
              sortOrder={sortOrder}
            />
          )
        ) : shareContent?.file ? (
          <div className="max-w-4xl mx-auto border-4 border-black p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
            <div className="mb-8">
              <div className="w-32 h-32 bg-yellow-400 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Icons.File className="w-16 h-16" />
              </div>
            </div>
            <h2 className="text-xl font-black uppercase mb-2 text-center">
              {shareContent.file.filename}
            </h2>
            <div className="flex space-x-4 mb-8 text-[10px] font-bold text-gray-500">
               <span>{shareContent.file.mimeType}</span>
               <span>•</span>
               <span>{shareContent.file.size ? (shareContent.file.size / 1024 / 1024).toFixed(2) + ' MB' : '--'}</span>
            </div>
            <div className="flex space-x-4 w-full sm:w-auto">
              <button 
                onClick={() => setPreviewItem(mapApiItem(shareContent.file))} 
                className="flex-1 sm:px-12 py-3 bg-black text-white font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black transition-all"
              >
                Preview
              </button>
              <button 
                onClick={() => handleDownload(shareContent.file.id, shareContent.file.filename)}
                disabled={isDownloading}
                className="flex-1 sm:px-12 py-3 border-4 border-black font-bold uppercase hover:bg-yellow-400 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        ) : needsPassword ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Icons.Archive className="w-16 h-16 opacity-10 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Restricted Access</p>
            <button onClick={() => setShowManualPassword(true)} className="mt-4 border-2 border-black px-4 py-2 font-bold uppercase hover:bg-yellow-400 text-[10px]">Enter Password</button>
          </div>
        ) : null}
      </main>

      <footer className="p-6 border-t-2 border-black/5 flex justify-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
          Protected by GEEK.DRIVE Secure Storage Protocol
        </p>
      </footer>

      {/* 密码弹窗 */}
      {needsPassword && (
        <PasswordModal 
          folderName={shareInfo?.file?.filename || 'Encrypted Item'} 
          // 取消时不再重定向到首页，而是保留在当前页并关闭模态框
          onClose={() => { setShowManualPassword(false); }} 
          onConfirm={handlePasswordConfirm} 
        />
      )}

      {previewItem && (
        <PreviewModal 
          item={previewItem} 
          onClose={() => setPreviewItem(null)}
          isReadOnly={true}
          onDownload={handleDownload}
        />
      )}

      {isVerifying && (
        <div className="fixed inset-0 z-[200] bg-black/20 flex items-center justify-center">
          <Icons.Grid className="w-10 h-10 animate-spin" />
        </div>
      )}
    </div>
  );
};
