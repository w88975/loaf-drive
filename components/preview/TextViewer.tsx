
import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import { DriveItem } from '../../types';

export const TextViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!item.url) return;
    
    setLoading(true);
    fetch(item.url)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load text content:', err);
        setContent('Error loading content.');
        setLoading(false);
      });
  }, [item.url]);

  useEffect(() => {
    if (!loading && codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [content, loading]);

  const language = item.extension?.toLowerCase() || 'plaintext';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

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
