/**
 * UploadPanel.tsx
 * 
 * 【上传任务面板】
 * 
 * 显示所有上传任务的实时状态
 * 固定在屏幕右上角，可以关闭和清空
 */

import React from 'react';
import { Icons } from '../../constants';
import { UploadTask } from '../../types';
import { formatSize } from '../../utils';

/**
 * 上传面板的 Props 接口
 */
interface UploadPanelProps {
  tasks: UploadTask[];               // 所有上传任务列表
  onClose: () => void;               // 关闭面板回调
  onCancel: (id: string) => void;    // 取消单个任务回调
  onClear: () => void;               // 清空所有已完成/失败任务回调
}

/**
 * 【上传任务面板组件】
 * 
 * 布局结构：
 * 1. 顶部黑色标题栏：显示任务总数 + Clear 和关闭按钮
 * 2. 中间任务列表区（可滚动）：显示每个任务的状态和进度
 * 3. 底部状态栏（仅在有活跃任务时显示）：闪烁的黄色提示条
 * 
 * 任务状态：
 * - uploading：显示进度条和取消按钮
 * - done：显示完成状态
 * - error：显示错误状态（红色）
 * 
 * 特性：
 * - 固定在右上角（top-20 right-4）
 * - z-index 为 40，低于模态框
 * - 最大高度 70vh，超出自动滚动
 * - 任务列表倒序显示（最新的在上面）
 */
export const UploadPanel: React.FC<UploadPanelProps> = ({ tasks, onClose, onCancel, onClear }) => {
  // 计算正在上传的任务数量
  const activeCount = tasks.filter(t => t.status === 'uploading').length;

  return (
    <div className="fixed top-20 right-4 md:right-6 w-72 md:w-96 bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] z-40 flex flex-col max-h-[70vh]">
      {/* 顶部标题栏 - 黑色背景 */}
      <div className="p-3 border-b-2 border-black bg-black text-white flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-widest italic">
          Transfers ({tasks.length})
        </h3>
        <div className="flex space-x-2">
          {/* 清空按钮 - 清除已完成和失败的任务 */}
          <button onClick={onClear} className="p-1 hover:text-yellow-400 text-[8px] uppercase font-bold border border-white/20 px-2">Clear</button>
          {/* 关闭面板按钮 */}
          <button onClick={onClose} className="p-1 hover:text-yellow-400 transition-colors"><Icons.Close className="w-4 h-4" /></button>
        </div>
      </div>
      {/* 任务列表区 - 可滚动 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {tasks.length === 0 ? (
          <div className="p-8 text-center opacity-30 text-[10px] font-bold uppercase italic">Queue Empty</div>
        ) : (
          /* 倒序显示任务（最新的在上面） */
          tasks.slice().reverse().map(task => (
            <div key={task.id} className="p-3 border-b-2 border-black bg-white last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-4">
                  {/* 文件名 */}
                  <p className="text-[10px] font-bold truncate uppercase">{task.file.name}</p>
                  {/* 状态和文件大小 */}
                  <p className={`text-[8px] uppercase font-black italic ${task.status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                    {task.status} • {formatSize(task.file.size)}
                  </p>
                </div>
                {/* 取消上传按钮（仅在上传中显示） */}
                {task.status === 'uploading' && (
                  <button onClick={() => onCancel(task.id)} className="text-[8px] font-bold uppercase border border-black px-1.5 py-0.5 hover:bg-black hover:text-white">Abort</button>
                )}
              </div>
              {/* 进度条（仅在上传中显示） */}
              {task.status === 'uploading' && (
                <div className="w-full h-2 border-2 border-black bg-white overflow-hidden">
                  <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {/* 底部活跃状态条（仅在有上传任务时显示） */}
      {activeCount > 0 && (
        <div className="p-2 bg-yellow-400 border-t-2 border-black text-[9px] font-bold uppercase text-center italic animate-pulse">
          Processing {activeCount} File(s)
        </div>
      )}
    </div>
  );
};
