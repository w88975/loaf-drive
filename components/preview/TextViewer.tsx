
import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import { DriveItem } from '../../types';
import { CONFIG } from '../../config';

const STORAGE_KEY = 'geek_drive_folder_passwords';

export const TextViewer: React.FC<{ item: DriveItem }> = ({ item }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!item.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Construct the API endpoint for content which usually has better CORS support than the direct R2 bucket
        const contentUrl = `${CONFIG.API_HOST}/api/files/${item.id}/content`;
        
        // Try to get the password from cache if this file is in a locked folder
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

  useEffect(() => {
    if (!loading && !error && codeRef.current && content) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (codeRef.current) {
          hljs.highlightElement(codeRef.current);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [content, loading, error]);

  const language = item.extension?.toLowerCase() || 'plaintext';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full" />
        <p className="text-[10px] font-bold uppercase animate-pulse">Fetching Source...</p>
      </div>
    );
  }

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
