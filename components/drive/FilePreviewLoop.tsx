
import React, { useState, useEffect } from 'react';

interface FilePreviewLoopProps {
  previews: string[];
  alt?: string;
  className?: string;
}

export const FilePreviewLoop: React.FC<FilePreviewLoopProps> = ({ previews, alt = '', className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (previews.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % previews.length);
    }, 800);

    return () => clearInterval(intervalId);
  }, [previews.length]);

  if (previews.length === 0) return null;

  return (
    <img 
      src={previews[currentIndex]} 
      alt={alt} 
      className={`w-full h-full object-cover pointer-events-none transition-opacity duration-150 ${className}`} 
    />
  );
};
