
import { ApiResponse, ApiFileItem, FolderTreeItem } from '../types';
import { CONFIG } from '../config';

const { API_HOST } = CONFIG;

export const driveApi = {
  fetchFiles: async (folderId: string | null, search?: string) => {
    const fid = folderId || 'root';
    let url = `${API_HOST}/api/files?folderId=${fid}&limit=200`;
    if (search) url = `${API_HOST}/api/files?search=${encodeURIComponent(search)}&limit=200`;
    const res = await fetch(url);
    return (await res.json()) as ApiResponse<{ items: ApiFileItem[] }>;
  },

  fetchRecycleBin: async (search?: string) => {
    let url = `${API_HOST}/api/recycle-bin?limit=200`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    return (await res.json()) as ApiResponse<{ items: ApiFileItem[] }>;
  },

  fetchTree: async () => {
    const res = await fetch(`${API_HOST}/api/folders/tree`);
    return (await res.json()) as ApiResponse<FolderTreeItem[]>;
  },

  createFolder: async (name: string, parentId: string | null) => {
    const res = await fetch(`${API_HOST}/api/files/folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, folderId: parentId || 'root' })
    });
    return await res.json();
  },

  deleteItem: async (id: string) => {
    const res = await fetch(`${API_HOST}/api/files/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  permanentlyDeleteItem: async (id: string) => {
    const res = await fetch(`${API_HOST}/api/recycle-bin?id=${id}`, { method: 'DELETE' });
    return await res.json();
  },

  clearRecycleBin: async () => {
    const res = await fetch(`${API_HOST}/api/recycle-bin`, { method: 'DELETE' });
    return await res.json();
  },

  renameItem: async (id: string, newName: string) => {
    const res = await fetch(`${API_HOST}/api/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: newName })
    });
    return await res.json();
  },

  moveItems: async (ids: string[], targetFolderId: string | null) => {
    const folderId = targetFolderId || 'root';
    return Promise.all(ids.map(id => 
      fetch(`${API_HOST}/api/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      })
    ));
  },

  getUploadUrl: () => `${API_HOST}/api/files/upload`
};
