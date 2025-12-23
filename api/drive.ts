
import { ApiResponse, ApiFileItem, FolderTreeItem } from '../types';
import { CONFIG } from '../config';

const { API_HOST } = CONFIG;

/**
 * Enhanced fetch with retry logic and error handling
 */
async function apiFetch<T>(url: string, options: RequestInit = {}, retries = 2): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    
    // If the server returns a 5xx error, we might want to retry
    if (!response.ok && retries > 0 && response.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch(url, options, retries - 1);
    }

    // Attempt to parse JSON even if status is not OK to get the error message from the API
    const result = await response.json().catch(() => ({
      code: -1,
      message: `HTTP Error ${response.status}: ${response.statusText}`
    }));

    return result as ApiResponse<T>;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch(url, options, retries - 1);
    }
    // Re-throw with a more descriptive message if it's a network error
    throw new Error(error instanceof Error ? error.message : 'Network error or CORS failure');
  }
}

export const driveApi = {
  fetchFiles: async (folderId: string | null, search?: string, password?: string) => {
    const fid = folderId || 'root';
    let url = `${API_HOST}/api/files?folderId=${fid}&limit=200`;
    if (search) url = `${API_HOST}/api/files?search=${encodeURIComponent(search)}&limit=200`;
    
    const headers: Record<string, string> = {};
    if (password) {
      headers['x-folder-password'] = password;
    }

    return apiFetch<{ items: ApiFileItem[] }>(url, { headers });
  },

  fetchRecycleBin: async (search?: string) => {
    let url = `${API_HOST}/api/recycle-bin?limit=200`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiFetch<{ items: ApiFileItem[] }>(url);
  },

  fetchTree: async () => {
    return apiFetch<FolderTreeItem[]>(`${API_HOST}/api/folders/tree`);
  },

  createFolder: async (name: string, parentId: string | null) => {
    return apiFetch<any>(`${API_HOST}/api/files/folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, folderId: parentId || 'root' })
    });
  },

  deleteItem: async (id: string) => {
    return apiFetch<any>(`${API_HOST}/api/files/${id}`, { method: 'DELETE' });
  },

  permanentlyDeleteItem: async (id: string) => {
    return apiFetch<any>(`${API_HOST}/api/recycle-bin?id=${id}`, { method: 'DELETE' });
  },

  clearRecycleBin: async () => {
    return apiFetch<any>(`${API_HOST}/api/recycle-bin`, { method: 'DELETE' });
  },

  renameItem: async (id: string, newName: string) => {
    return apiFetch<any>(`${API_HOST}/api/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: newName })
    });
  },

  updateLockStatus: async (id: string, isLocked: boolean, password?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (password) {
      headers['x-folder-password'] = password;
    }

    return apiFetch<any>(`${API_HOST}/api/files/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isLocked })
    });
  },

  moveItems: async (ids: string[], targetFolderId: string | null) => {
    const folderId = targetFolderId || 'root';
    // We do these in parallel but return a collective result
    const results = await Promise.all(ids.map(id => 
      apiFetch<any>(`${API_HOST}/api/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      })
    ));
    return results[0]; // Simplified return
  },

  uploadPreview: async (file: Blob) => {
    const fd = new FormData();
    // Explicitly provide a filename for the blob to ensure multipart consistency
    fd.append('file', file, 'preview.jpg');
    return apiFetch<{ r2Key: string }>(`${API_HOST}/api/files/upload-preview`, {
      method: 'POST',
      body: fd
    });
  },

  getUploadUrl: () => `${API_HOST}/api/files/upload`,

  // Chunked Upload API
  uploadInit: async (data: { filename: string, folderId: string, totalSize: number, mimeType: string }) => {
    return apiFetch<{ id: string, uploadId: string, r2Key: string, filename: string }>(`${API_HOST}/api/files/upload/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  uploadPart: async (fd: FormData) => {
    return apiFetch<{ partNumber: number, etag: string }>(`${API_HOST}/api/files/upload/part`, {
      method: 'POST',
      body: fd
    });
  },

  uploadComplete: async (data: { id: string, uploadId: string, r2Key: string, parts: { partNumber: number, etag: string }[], previews?: string[] }) => {
    return apiFetch<ApiFileItem>(`${API_HOST}/api/files/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};
