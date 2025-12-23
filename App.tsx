/**
 * 应用主组件
 * 功能：管理全局状态、路由配置、拖拽上传、模态框等核心功能
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Icons } from './constants';
import { DriveItem } from './types';
import { useUpload } from './hooks/useUpload';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { UploadPanel } from './components/overlays/UploadPanel';
import { PreviewModal } from './components/overlays/PreviewModal';
import { FilesView } from './views/FilesView';
import { TrashView } from './views/TrashView';

const App: React.FC = () => {
  const location = useLocation();
  
  /**
   * 当前所在文件夹的 ID
   * null 表示根目录
   */
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  /**
   * 面包屑导航路径
   * 存储从根目录到当前文件夹的所有父级文件夹信息
   */
  const [path, setPath] = useState<DriveItem[]>([]);
  
  /**
   * 搜索关键词
   * 用于文件列表的客户端过滤
   */
  const [searchQuery, setSearchQuery] = useState('');
  
  /**
   * 视图模式：网格或列表
   */
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  /**
   * 侧边栏展开状态（移动端）
   */
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  /**
   * 当前预览的文件项
   * 非 null 时显示预览模态框
   */
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);

  /**
   * 上传管理 Hook
   * 提供上传队列、上传面板状态、上传操作等功能
   */
  const { uploadTasks, showUploadPanel, setShowUploadPanel, handleUpload, cancelUpload, clearHistory } = useUpload();

  /**
   * 拖拽上传相关状态
   * isDragging: 是否正在拖拽文件到窗口上方
   * dragCounter: 拖拽事件计数器，用于处理嵌套元素的 dragEnter/dragLeave
   */
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  /**
   * 导航处理函数
   * 功能：处理文件夹跳转并更新面包屑路径
   * @param id 目标文件夹 ID（null 表示根目录）
   * @param folderItem 目标文件夹的完整信息（用于添加到面包屑）
   * 
   * 逻辑：
   * - 跳转到根目录：清空路径
   * - 跳转到新文件夹：添加到路径末尾
   * - 点击面包屑：截断路径到该位置
   */
  const handleNavigate = useCallback((id: string | null, folderItem?: DriveItem) => {
    setCurrentFolderId(id);
    if (id === null) {
      setPath([]);
    } else if (folderItem) {
      const idx = path.findIndex(p => p.id === folderItem.id);
      if (idx !== -1) setPath(path.slice(0, idx + 1));
      else setPath(prev => [...prev, folderItem]);
    } else {
      const index = path.findIndex(p => p.id === id);
      if (index !== -1) setPath(path.slice(0, index + 1));
      else if (id === null) setPath([]);
    }
  }, [path]);

  /**
   * 计算全局上传进度
   * 功能：对所有上传任务的进度求平均值
   * 用于 Header 中的进度条显示
   */
  const overallProgress = useMemo(() => {
    if (uploadTasks.length === 0) return 0;
    return uploadTasks.reduce((acc, t) => acc + t.progress, 0) / uploadTasks.length;
  }, [uploadTasks]);

  /**
   * 判断当前是否在回收站页面
   * 用于禁用回收站中的拖拽上传功能
   */
  const isTrash = location.pathname === '/trash';

  return (
    /**
     * 根容器 - 全局拖拽上传监听区域
     * 功能：监听整个窗口的拖拽事件，实现全局拖拽上传
     * 
     * 拖拽事件处理逻辑：
     * - onDragEnter: 文件进入窗口，计数器+1，显示拖拽提示
     * - onDragLeave: 文件离开元素，计数器-1，当计数器归零时隐藏提示
     * - onDragOver: 必须阻止默认行为才能触发 drop 事件
     * - onDrop: 接收文件/文件夹并传递给上传引擎
     * 
     * 使用计数器的原因：拖拽经过子元素时会触发父元素的 leave 事件
     */
    <div 
      className="flex h-screen bg-white text-black font-mono overflow-hidden relative select-none"
      onDragEnter={(e) => { e.preventDefault(); if (!isTrash) dragCounter.current++; if (e.dataTransfer.items.length && !isTrash) setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); if (!isTrash) dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { 
        e.preventDefault(); 
        setIsDragging(false); 
        dragCounter.current = 0; 
        if (!isTrash) {
          handleUpload(e.dataTransfer, currentFolderId); 
        }
      }}
    >
      {/* 拖拽遮罩层：拖拽文件到窗口上方时显示的全屏提示 */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm pointer-events-none flex items-center justify-center p-8">
          <div className="w-full h-full border-4 border-dashed border-yellow-400 flex flex-col items-center justify-center text-yellow-400 space-y-4">
            <Icons.Plus className="w-24 h-24 animate-bounce" />
            <span className="text-4xl font-bold italic uppercase tracking-widest">Drop folders or files to upload</span>
          </div>
        </div>
      )}

      {/* 侧边栏：主导航菜单 */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSelectRoot={() => handleNavigate(null)} 
      />

      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* 顶部导航栏：面包屑、搜索、视图切换、上传进度 */}
        <Header 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          currentFolderId={isTrash ? 'trash' : currentFolderId}
          navigationHistory={isTrash ? [] : path}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          uploadingCount={uploadTasks.filter(t => t.status === 'uploading' || t.status === 'processing').length}
          overallProgress={overallProgress}
          onToggleUploadPanel={() => setShowUploadPanel(!showUploadPanel)}
        />

        {/* 路由视图容器 */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            {/* 主页：文件管理页面 */}
            <Route path="/" element={
              <FilesView 
                key={currentFolderId || 'root'}
                currentFolderId={currentFolderId}
                setCurrentFolderId={handleNavigate}
                navigationHistory={path}
                searchQuery={searchQuery}
                viewMode={viewMode}
                onPreview={setPreviewItem}
                onUploadClick={() => document.getElementById('file-upload')?.click()}
              />
            } />
            {/* 回收站页面 */}
            <Route path="/trash" element={
              <TrashView searchQuery={searchQuery} viewMode={viewMode} />
            } />
          </Routes>
        </div>

        {/* 隐藏的文件输入框：用于点击按钮选择文件上传 */}
        <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files, currentFolderId)} />
      </main>
      
      {/* 文件预览模态框：条件渲染 */}
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      
      {/* 上传队列面板：条件渲染 */}
      {showUploadPanel && <UploadPanel tasks={uploadTasks} onClose={() => setShowUploadPanel(false)} onCancel={cancelUpload} onClear={clearHistory} />}
    </div>
  );
};

export default App;
