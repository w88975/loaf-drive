
import React from 'react';
import { DriveItem } from '../../types';

export const AudioViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="w-48 h-48 rounded-full border-4 border-black bg-yellow-400 flex items-center justify-center mb-8 relative animate-spin-slow">
        <div className="w-12 h-12 rounded-full border-4 border-black bg-white" />
        <div className="absolute inset-0 border-4 border-black rounded-full opacity-20 scale-90" />
      </div>
      <p className="font-bold text-sm uppercase italic mb-6 tracking-widest">{item.name}</p>
      <audio 
        src={item.url} 
        controls 
        className="w-full max-w-md accent-black h-10"
      />
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};
