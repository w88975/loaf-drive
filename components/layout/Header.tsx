/**
 * 顶部导航栏组件
 * 功能：应用的主要控制中心，提供导航、搜索、视图切换和上传进度显示
 * 布局：左侧面包屑导航 | 中间搜索框 | 右侧工具栏（上传、视图切换）
 */

import React from 'react';
import { Icons } from '../../constants';
import { DriveItem } from '../../types';

interface HeaderProps {
  onOpenSidebar: () => void;                          // 打开侧边栏（移动端）
  currentFolderId: string | null;                    // 当前文件夹 ID
  navigationHistory: DriveItem[];                    // 导航历史（面包屑路径）
  onNavigate: (id: string | null, item?: DriveItem) => void;  // 导航回调
  searchQuery: string;                               // 搜索关键词
  onSearchChange: (val: string) => void;             // 搜索变化回调
  viewMode: 'grid' | 'list';                         // 当前视图模式
  onViewModeChange: (mode: 'grid' | 'list') => void; // 视图切换回调
  uploadingCount: number;                            // 上传中的任务数量
  overallProgress: number;                           // 整体上传进度 (0-100)
  onToggleUploadPanel: () => void;                   // 切换上传面板显示
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSidebar, currentFolderId, navigationHistory, onNavigate,
  searchQuery, onSearchChange, viewMode, onViewModeChange,
  uploadingCount, overallProgress, onToggleUploadPanel
}) => {
  return (
    /**
     * Header 主容器
     * - sticky top-0: 粘性定位，滚动时保持在顶部
     * - z-20: 确保在其他内容之上
     */
    <header className="h-16 border-b-2 border-black flex items-center justify-between px-4 md:px-6 bg-white sticky top-0 z-20">
      {/* 左侧区域：菜单按钮（移动端）+ 面包屑导航 */}
      <div className="flex items-center flex-1 min-w-0">
        {/* 菜单按钮：仅移动端显示，用于打开侧边栏抽屉 */}
        <button onClick={onOpenSidebar} className="md:hidden mr-4 p-1.5 border-2 border-black bg-white hover:bg-yellow-400 transition-colors">
          <Icons.List className="w-5 h-5" />
        </button>
        
        {/* 
         * 面包屑导航
         * 功能：显示从根目录到当前文件夹的完整路径
         * - ROOT 按钮：点击返回根目录
         * - ChevronRight 分隔符：视觉分隔
         * - 文件夹按钮：点击跳转到该层级
         * - truncate: 路径过长时截断显示
         */}
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

      {/* 右侧工具栏：搜索框 + 上传进度 + 视图切换 */}
      <div className="flex items-center space-x-2 md:space-x-4 ml-4">
        {/* 
         * 搜索框
         * 功能：全局搜索文件
         * - 聚焦时宽度扩展：提升输入体验
         * - 黄色背景高亮：聚焦状态反馈
         * - 移动端隐藏：节省空间
         */}
        <div className="relative hidden sm:block">
          <input 
            type="text" placeholder="SEARCH..." 
            className="pl-8 pr-4 py-1 border-2 border-black focus:bg-yellow-100 outline-none text-[10px] md:text-xs w-32 md:w-48 transition-all focus:w-64"
            value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          />
          <Icons.Search className="w-3 h-3 md:w-4 md:h-4 absolute left-2 top-1.5 md:top-2" />
        </div>

        {/* 
         * 上传进度指示器
         * 功能：显示上传中的任务数量和整体进度
         * - 条件渲染：仅在有上传任务时显示
         * - animate-pulse: 脉冲动画吸引注意
         * - 进度条：底部黑色进度条实时显示百分比
         * - 点击：打开上传队列面板
         */}
        {uploadingCount > 0 && (
          <button onClick={onToggleUploadPanel} className="relative flex items-center space-x-2 border-2 border-black px-2 py-1 text-[10px] font-bold uppercase bg-yellow-400 animate-pulse">
            <Icons.Download className="w-4 h-4 rotate-180" />
            <span className="hidden md:inline">UPLOADING {uploadingCount}...</span>
            {/* 底部进度条：通过 width 百分比动态显示进度 */}
            <div className="absolute -bottom-2.5 left-0 w-full h-1 bg-black/10 overflow-hidden">
              <div className="h-full bg-black transition-all" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </button>
        )}
        
        {/* 
         * 视图切换按钮组
         * 功能：在网格视图和列表视图之间切换
         * - 黄色背景：激活状态
         * - 灰色背景：Hover 状态
         * - border-l: 左侧分隔线
         */}
        <div className="flex border-2 border-black">
          <button onClick={() => onViewModeChange('grid')} className={`p-1 md:p-1.5 ${viewMode === 'grid' ? 'bg-yellow-400' : 'hover:bg-gray-100'}`}><Icons.Grid3x3 className="w-4 h-4" /></button>
          <button onClick={() => onViewModeChange('list')} className={`p-1 md:p-1.5 border-l-2 border-black ${viewMode === 'list' ? 'bg-yellow-400' : 'hover:bg-gray-100'}`}><Icons.List className="w-4 h-4" /></button>
        </div>
      </div>
    </header>
  );
};
