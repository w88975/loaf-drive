/**
 * AuthView.tsx
 * 
 * 【API Key 认证视图】
 * 
 * 功能：输入 API Key 进行身份验证
 * 设计风格：极客新丑风 (Geek-Brutalism)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icons } from '../constants';
import { authManager } from '../auth';
import { CONFIG } from '../config';

export const AuthView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError(t('auth.apiKeyEmpty'));
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 保存 API Key
      authManager.saveApiKey(apiKey);
      
      // 尝试验证（通过请求一个简单的接口）
      const response = await fetch(`${CONFIG.API_HOST}/api/files?limit=1`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      const result = await response.json();

      if (result.code === 0) {
        // 验证成功，跳转到主页
        navigate('/');
      } else if (result.code === 401) {
        authManager.clearApiKey();
        setError(t('auth.invalidApiKey'));
      } else {
        setError(result.message || t('auth.verificationFailed'));
      }
    } catch (err) {
      authManager.clearApiKey();
      setError(t('auth.networkError'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
      {/* 背景装饰网格 */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* 主容器 */}
      <div className="relative w-full max-w-md">
        {/* Logo 区域 */}
        <div className="mb-8 text-center">
          <div className="inline-block p-4 bg-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4">
            <Icons.Archive className="w-16 h-16 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">
            GEEK.DRIVE
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {t('sidebar.secureStorage')}
          </p>
        </div>

        {/* 认证表单 */}
        <div className="border-4 border-black bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          {/* 标题栏 */}
          <div className="bg-yellow-400 border-b-4 border-black p-4">
            <h2 className="font-black uppercase italic tracking-tight text-lg">
              {t('auth.required')}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 mt-1">
              {t('auth.enterApiKey')}
            </p>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* API Key 输入框 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2">
                {t('auth.apiKeyLabel')}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit(e);
                    }
                  }}
                  placeholder={t('auth.apiKeyPlaceholder').toUpperCase()}
                  className="w-full border-2 border-black p-3 font-mono font-bold uppercase tracking-wider outline-none focus:bg-yellow-50 transition-colors placeholder:text-gray-300"
                  disabled={isVerifying}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:text-yellow-600 transition-colors"
                  disabled={isVerifying}
                >
                  {showKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="border-2 border-red-600 bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <Icons.Close className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-bold uppercase text-red-600">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* 提示信息 */}
            <div className="border-2 border-black bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-600 leading-relaxed">
                ⚠️ {t('auth.securityNote')}
              </p>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isVerifying || !apiKey.trim()}
              className="w-full bg-black text-white border-4 border-black py-4 font-black uppercase italic tracking-tight text-lg hover:bg-yellow-400 hover:text-black transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <Icons.Grid className="w-5 h-5 animate-spin" />
                  {t('auth.verifying')}
                </span>
              ) : (
                t('auth.authenticate')
              )}
            </button>
          </form>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300">
            Protected by Cloudflare Workers Security Layer
          </p>
        </div>
      </div>
    </div>
  );
};

