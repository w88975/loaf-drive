/**
 * MessageBox.tsx
 *
 * 【消息提示组件】
 *
 * 功能：显示各种类型的消息提示
 * 核心特性：
 * 1. 多种消息类型 - success, error, info, warning
 * 2. 自动消失 - 可配置的自动关闭时间
 * 3. 手动关闭 - 点击关闭按钮
 * 4. 动画效果 - 滑入/滑出动画
 * 5. 位置固定 - 右上角显示
 */

import React, { useEffect, useState } from 'react';
import { Icons } from '../../constants';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  duration?: number;
}

interface MessageBoxProps {
  messages: Message[];
  onClose: (id: string) => void;
}

const MessageItem: React.FC<{
  message: Message;
  onClose: () => void;
}> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 延迟显示动画
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // 自动关闭
    if (message.duration && message.duration > 0) {
      const hideTimer = setTimeout(() => {
        handleClose();
      }, message.duration);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => clearTimeout(showTimer);
  }, [message.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 200); // 等待退出动画完成
  };

  // 根据类型获取配置
  const getConfig = () => {
    switch (message.type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          text: 'text-green-700',
          icon: <Icons.Check className="w-5 h-5" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-700',
          icon: <Icons.Alert className="w-5 h-5" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-700',
          icon: <Icons.Alert className="w-5 h-5" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-700',
          icon: <Icons.Alert className="w-5 h-5" />,
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className={`
        ${config.bg} ${config.border} ${config.text}
        border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        p-3 mb-3 min-w-[300px] max-w-[400px]
        transition-all duration-200 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="flex-shrink-0 pt-0.5">{config.icon}</div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase break-words">
            {message.content}
          </p>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 transition-colors rounded"
          title="Close"
        >
          <Icons.Close className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const MessageBox: React.FC<MessageBoxProps> = ({ messages, onClose }) => {
  if (messages.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col items-end">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onClose={() => onClose(message.id)}
        />
      ))}
    </div>
  );
};

/**
 * Hook for managing messages
 */
export const useMessageBox = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const showMessage = (
    content: string,
    type: MessageType = 'info',
    duration: number = 3000
  ) => {
    const id = `msg-${Date.now()}-${Math.random()}`;
    const newMessage: Message = {
      id,
      type,
      content,
      duration,
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const closeMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const success = (content: string, duration?: number) => {
    showMessage(content, 'success', duration);
  };

  const error = (content: string, duration?: number) => {
    showMessage(content, 'error', duration);
  };

  const info = (content: string, duration?: number) => {
    showMessage(content, 'info', duration);
  };

  const warning = (content: string, duration?: number) => {
    showMessage(content, 'warning', duration);
  };

  return {
    messages,
    showMessage,
    closeMessage,
    success,
    error,
    info,
    warning,
  };
};

