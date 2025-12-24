/**
 * 侧边栏导航组件
 * 功能：提供主要路由导航和系统信息显示
 * 响应式：桌面端固定显示，移动端抽屉式滑入
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { CONFIG } from '../../config';
import { authManager } from '../../auth';

interface SidebarProps {
  isOpen: boolean;        // 侧边栏是否打开（移动端）
  onClose: () => void;    // 关闭侧边栏回调
  onSelectRoot: () => void;  // 点击"文件"时重置到根目录
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSelectRoot }) => {
  const navigate = useNavigate();
  
  /**
   * 提取 API 主机名用于底部节点状态显示
   */
  const hostName = new URL(CONFIG.API_HOST).hostname;

  /**
   * 处理退出登录
   */
  const handleLogout = () => {
    authManager.clearApiKey();
    navigate('/auth');
    onClose();
  };

  /**
   * 侧边栏导航项组件
   * 功能：统一的导航链接样式，支持激活状态
   * - isActive 时：黄色背景 + 黑色左边框 + 粗体
   * - 非激活时：透明背景 + Hover 灰色
   * - 点击时：触发可选回调并关闭侧边栏（移动端）
   */
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
      {/* 
       * 背景遮罩（移动端）
       * 功能：侧边栏打开时显示半透明黑色遮罩
       * - 点击遮罩关闭侧边栏
       * - 桌面端隐藏（md:hidden）
       */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      
      {/*
       * 侧边栏主容器
       * 响应式行为：
       * - 移动端：fixed 定位，从左侧滑入
       *   - 关闭时：-translate-x-full（完全隐藏在左侧）
       *   - 打开时：translate-x-0（滑入到可见位置）
       * - 桌面端：relative 定位，始终显示
       *   - md:relative: 相对定位
       *   - md:translate-x-0: 始终在正常位置
       * 
       * 尺寸和样式：
       * - w-64: 固定宽度 256px
       * - border-r-2: 右侧黑色粗边框
       * - transition-transform: 300ms 滑入动画
       */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r-2 border-black transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* 
         * Logo 区域
         * 显示应用品牌和在线状态
         */}
        <div className="p-6 border-b-2 border-black">
          <h1 className="text-2xl font-bold tracking-tighter italic">GEEK.DRIVE</h1>
          <p className="text-[10px] uppercase text-gray-500 mt-1">Status: Online</p>
        </div>
        
        {/* 
         * 导航链接区域
         * 包含所有主要路由链接
         */}
        <nav className="mt-4">
          {/* 文件页面：点击时重置到根目录 */}
          <SidebarItem 
            icon={<Icons.Grid />} 
            label="All Files" 
            to="/" 
            onClick={onSelectRoot} 
          />
          {/* 分享管理页面 */}
          <SidebarItem 
            icon={<Icons.Search className="rotate-45" />} 
            label="Shares" 
            to="/shares"
          />
          {/* 回收站页面 */}
          <SidebarItem 
            icon={<Icons.Trash />} 
            label="Trash" 
            to="/trash"
          />
        </nav>
        
        {/* 
         * 底部信息区域
         * 功能：显示 Cloudflare 节点连接状态和退出按钮
         * - 固定在侧边栏底部（absolute bottom-0）
         * - 显示主机名和协议版本
         * - 退出登录按钮
         */}
        <div className="absolute bottom-0 w-full border-t-2 border-black bg-white">
          <button
            onClick={handleLogout}
            className="w-full p-3 border-b-2 border-black hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs"
          >
            <Icons.Close className="w-4 h-4" />
            Logout
          </button>
          <div className="p-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs uppercase font-bold">Cloud Nodes</span>
              <span className="text-[10px] text-gray-500">Live API</span>
            </div>
            <div className="text-[9px] text-gray-400 uppercase leading-tight">Connected to {hostName}<br/>Secure storage protocol v1</div>
          </div>
        </div>
      </aside>
    </>
  );
};
