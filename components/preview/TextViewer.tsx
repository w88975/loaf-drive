/**
 * 文本/代码查看器组件
 * 功能：显示文本文件内容，支持代码语法高亮
 * 特性：
 * - 语法高亮：使用 highlight.js 自动识别语言
 * - 支持加密文件夹：从缓存中读取密码
 * - 深色主题：GitHub 风格代码展示
 * - 加载状态：加载中动画和错误提示
 */

import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import { DriveItem } from '../../types';
import { CONFIG } from '../../config';

/**
 * 密码缓存键名
 * 用于读取加密文件夹的密码以访问文件内容
 */
const STORAGE_KEY = 'geek_drive_folder_passwords';

export const TextViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  /**
   * 文件内容状态
   */
  const [content, setContent] = useState<string>('');
  
  /**
   * 加载状态
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * 错误信息
   */
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 代码元素引用
   * 用于语法高亮处理
   */
  const codeRef = useRef<HTMLElement>(null);

  /**
   * 获取文件内容
   * 功能：通过 API 端点获取文件文本内容
   * 注意：使用 API 端点而非直接访问 R2，以解决 CORS 问题
   */
  useEffect(() => {
    const fetchContent = async () => {
      if (!item.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        /**
         * 构造 API 端点 URL
         * 使用 /api/files/{id}/content 而非直接访问 R2
         * 优势：API 端点有更好的 CORS 支持和权限控制
         */
        const contentUrl = `${CONFIG.API_HOST}/api/files/${item.id}/content`;
        
        /**
         * 尝试从缓存中获取父文件夹密码
         * 如果文件在加密文件夹中，需要提供密码才能访问内容
         */
        const headers: Record<string, string> = {};
        if (item.parentId) {
          try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
              const passwords = JSON.parse(stored);
              const pwd = passwords[item.parentId];
              if (pwd) {
                headers['x-folder-password'] = pwd;
              }
            }
          } catch (e) {
            console.warn('Failed to read password cache', e);
          }
        }

        /**
         * 发送请求获取文件内容
         * 带上密码请求头（如果有）
         */
        const response = await fetch(contentUrl, { headers });
        
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Failed to load text content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred while fetching content.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [item.id, item.parentId]);

  /**
   * 应用语法高亮
   * 功能：内容加载完成后，使用 highlight.js 处理代码高亮
   * 时机：内容加载完成且无错误时触发
   * 延迟：使用 setTimeout 确保 DOM 已渲染
   */
  useEffect(() => {
    if (!loading && !error && codeRef.current && content) {
      const timer = setTimeout(() => {
        if (codeRef.current) {
          hljs.highlightElement(codeRef.current);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [content, loading, error]);

  /**
   * 根据文件扩展名确定语言类型
   * 用于 highlight.js 的语言识别
   */
  const language = item.extension?.toLowerCase() || 'plaintext';

  /**
   * 加载中状态
   * 显示旋转动画和加载文字
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full" />
        <p className="text-[10px] font-bold uppercase animate-pulse">Fetching Source...</p>
      </div>
    );
  }

  /**
   * 错误状态
   * 显示错误信息和可能的原因提示
   * 常见原因：CORS、权限、网络错误
   */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-red-500 text-4xl mb-4 font-black">!</div>
        <h3 className="text-sm font-bold uppercase mb-2">Fetch Failed</h3>
        <p className="text-[10px] text-gray-500 uppercase max-w-xs">{error}</p>
        <p className="text-[8px] mt-4 text-gray-400 italic">This usually happens due to CORS or incorrect folder permissions.</p>
      </div>
    );
  }

  /**
   * 内容展示
   * 使用深色主题（GitHub 风格）
   * - bg-[#0d1117]: GitHub 深色背景色
   * - language-{extension}: highlight.js 语言类名
   * - whitespace-pre: 保留空格和换行
   */
  return (
    <div className="w-full h-full overflow-auto bg-[#0d1117] p-6 text-sm font-mono border-2 border-black">
      <pre className="m-0 whitespace-pre">
        <code ref={codeRef} className={`language-${language}`}>
          {content}
        </code>
      </pre>
    </div>
  );
};
