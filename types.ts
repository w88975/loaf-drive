
export type ItemType = 'file' | 'folder';

export interface DriveItem {
  id: string;
  name: string;
  type: ItemType;
  parentId: string | null;
  size?: number; // bytes
  extension?: string;
  mimeType?: string;
  modifiedAt: number; // timestamp
  thumbnail?: string;
  url?: string;
}

export interface FolderTreeItem {
  id: string;
  name: string;
  children?: FolderTreeItem[];
}

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  targetFolderId: string | null;
  xhr?: XMLHttpRequest;
}

export type SortKey = 'name' | 'size' | 'modifiedAt';
export type SortOrder = 'asc' | 'desc';

// API Response interfaces
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ApiFileItem {
  id: string;
  filename: string;
  type: 'FOLDER' | 'IMAGE' | 'VIDEO' | 'OTHER';
  folderId: string;
  size: number;
  updatedAt: string;
  mimeType?: string;
}
