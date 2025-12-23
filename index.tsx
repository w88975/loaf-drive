/**
 * 应用程序入口文件
 * 功能：初始化并启动 GeekDrive React 应用，配置核心 Provider
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import App from './App';

/**
 * 配置 TanStack Query 客户端实例
 * 功能：管理所有服务端数据的缓存和同步策略
 * - staleTime: 5分钟 - 数据在5分钟内保持新鲜，不会自动重新获取
 * - retry: 1 - 请求失败时自动重试1次后进入错误状态
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

/**
 * 获取并验证根 DOM 节点
 * 功能：从 index.html 中查找 #root 元素作为 React 挂载点
 * 如果元素不存在则抛出错误，防止静默失败
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

/**
 * 创建 React 18 并发模式根节点并渲染应用
 * 功能：设置完整的 Provider 层级结构
 * 1. React.StrictMode - 开发环境下的额外检查和警告
 * 2. QueryClientProvider - 提供服务端状态管理能力
 * 3. HashRouter - 基于 Hash 的客户端路由（适配静态部署）
 * 4. App - 根组件，包含所有业务逻辑
 */
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
