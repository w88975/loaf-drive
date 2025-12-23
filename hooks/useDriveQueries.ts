import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driveApi } from '../api/drive';
import { DriveItem } from '../types';
import { CONFIG } from '../config';

const mapApiItem = (apiItem: any): DriveItem => ({
  id: apiItem.id,
  name: apiItem.filename || apiItem.name,
  type: apiItem.type === 'FOLDER' ? 'folder' : 'file',
  parentId: apiItem.folderId === 'root' ? null : apiItem.folderId,
  size: apiItem.size,
  extension: (apiItem.filename || apiItem.name)?.split('.').pop(),
  modifiedAt: new Date(apiItem.updatedAt || apiItem.createdAt).getTime(),
  url: apiItem.type !== 'FOLDER' ? `${CONFIG.STATIC_HOST}/${apiItem.r2Key}` : undefined,
  mimeType: apiItem.mimeType,
  r2Key: apiItem.r2Key,
  previews: apiItem.previews?.map((p: string) => p.startsWith('http') ? p : `${CONFIG.STATIC_HOST}/${p}`),
  isLocked: apiItem.isLocked
});

export const useFiles = (folderId: string | null, search?: string, password?: string) => {
  return useQuery({
    queryKey: ['files', folderId, search, password],
    queryFn: async () => {
      const result = await driveApi.fetchFiles(folderId, search, password);
      // Handle the case where the server might return a non-0 code for auth errors
      if (result.code !== 0) {
        const err = new Error(result.message);
        (err as any).code = result.code;
        throw err;
      }
      return result.data.items.map(mapApiItem);
    },
    // Prevent infinite retries on authentication failure (e.g. 403)
    retry: (failureCount, error: any) => {
      if (error.message?.includes('403') || error.code === 403) return false;
      return failureCount < 2;
    },
    // Don't refetch automatically on window focus if we might need a password
    refetchOnWindowFocus: false,
  });
};

export const useRecycleBin = (search?: string) => {
  return useQuery({
    queryKey: ['recycle-bin', search],
    queryFn: async () => {
      const result = await driveApi.fetchRecycleBin(search);
      if (result.code !== 0) throw new Error(result.message);
      return result.data.items.map(mapApiItem);
    },
  });
};

export const useDriveMutations = () => {
  const queryClient = useQueryClient();

  const createFolder = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) => 
      driveApi.createFolder(name, parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const renameItem = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      driveApi.renameItem(id, newName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const toggleLock = useMutation({
    mutationFn: ({ id, isLocked, password }: { id: string; isLocked: boolean; password?: string }) => 
      driveApi.updateLockStatus(id, isLocked, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const deleteItems = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => driveApi.deleteItem(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
  });

  const moveItems = useMutation({
    mutationFn: ({ ids, targetId }: { ids: string[]; targetId: string | null }) => 
      driveApi.moveItems(ids, targetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  return { createFolder, renameItem, toggleLock, deleteItems, moveItems };
};

export const useRecycleMutations = () => {
  const queryClient = useQueryClient();

  const permanentlyDelete = useMutation({
    mutationFn: (id: string) => driveApi.permanentlyDeleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recycle-bin'] }),
  });

  const clearBin = useMutation({
    mutationFn: () => driveApi.clearRecycleBin(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recycle-bin'] }),
  });

  return { permanentlyDelete, clearBin };
};