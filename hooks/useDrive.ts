
import { useState, useCallback, useEffect } from 'react';
import { DriveItem } from '../types';
import { driveApi } from '../api/drive';

export const useDrive = (currentFolderId: string | null, searchQuery: string) => {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mapApiItem = (apiItem: any): DriveItem => ({
    id: apiItem.id,
    name: apiItem.filename || apiItem.name,
    type: apiItem.type === 'FOLDER' ? 'folder' : 'file',
    parentId: apiItem.folderId === 'root' ? null : apiItem.folderId,
    size: apiItem.size,
    extension: (apiItem.filename || apiItem.name)?.split('.').pop(),
    modifiedAt: new Date(apiItem.updatedAt || apiItem.createdAt).getTime(),
    url: apiItem.type !== 'FOLDER' ? `https://loaf-store.cnzoe.com/${apiItem.r2Key}` : undefined,
    mimeType: apiItem.mimeType,
    r2Key: apiItem.r2Key
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await driveApi.fetchFiles(currentFolderId, searchQuery);
      if (result.code === 0) {
        setItems(result.data.items.map(mapApiItem));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, searchQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, isLoading, refresh, setItems };
};
