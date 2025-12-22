
import React from 'react';
import { Icons } from '../../constants';
import { UploadTask } from '../../types';
import { formatSize } from '../../utils';

interface UploadPanelProps {
  tasks: UploadTask[];
  onClose: () => void;
  onCancel: (id: string) => void;
  onClear: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ tasks, onClose, onCancel, onClear }) => {
  const activeCount = tasks.filter(t => t.status === 'uploading').length;

  return (
    <div className="fixed top-20 right-4 md:right-6 w-72 md:w-96 bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] z-40 flex flex-col max-h-[70vh]">
      <div className="p-3 border-b-2 border-black bg-black text-white flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-widest italic">
          Transfers ({tasks.length})
        </h3>
        <div className="flex space-x-2">
          <button onClick={onClear} className="p-1 hover:text-yellow-400 text-[8px] uppercase font-bold border border-white/20 px-2">Clear</button>
          <button onClick={onClose} className="p-1 hover:text-yellow-400 transition-colors"><Icons.Close className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {tasks.length === 0 ? (
          <div className="p-8 text-center opacity-30 text-[10px] font-bold uppercase italic">Queue Empty</div>
        ) : (
          tasks.slice().reverse().map(task => (
            <div key={task.id} className="p-3 border-b-2 border-black bg-white last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-[10px] font-bold truncate uppercase">{task.file.name}</p>
                  <p className={`text-[8px] uppercase font-black italic ${task.status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                    {task.status} • {formatSize(task.file.size)}
                  </p>
                </div>
                {task.status === 'uploading' && (
                  <button onClick={() => onCancel(task.id)} className="text-[8px] font-bold uppercase border border-black px-1.5 py-0.5 hover:bg-black hover:text-white">Abort</button>
                )}
              </div>
              {task.status === 'uploading' && (
                <div className="w-full h-2 border-2 border-black bg-white overflow-hidden">
                  <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {activeCount > 0 && (
        <div className="p-2 bg-yellow-400 border-t-2 border-black text-[9px] font-bold uppercase text-center italic animate-pulse">
          Processing {activeCount} File(s)
        </div>
      )}
    </div>
  );
};
