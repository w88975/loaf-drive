
import { useQuery, useMutation, useQueryClient } from 'https://esm.sh/@tanstack/react-query@5.66.0';
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
  previews: apiItem.previews?.map((p: string) => p.startsWith('http') ? p : `${CONFIG.STATIC_HOST}/${p}`)
});

export const useFiles = (folderId: string | null, search?: string) => {
  return useQuery({
    queryKey: ['files', folderId, search],
    queryFn: async () => {
      const result = await driveApi.fetchFiles(folderId, search);
      if (result.code !== 0) throw new Error(result.message);
      return result.data.items.map(mapApiItem);
    },
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

  return { createFolder, renameItem, deleteItems, moveItems };
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
