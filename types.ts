
export type ItemType = 'file' | 'folder';

// Added DriveItem interface
export interface DriveItem {
  id: string;
  name: string;
  type: ItemType;
  parentId: string | null;
  size?: number;
  extension?: string;
  modifiedAt: number;
  url?: string;
  mimeType?: string;
  r2Key?: string;
  previews?: string[];
  isLocked?: boolean;
}

// Added ApiResponse interface
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Added ApiFileItem interface
export interface ApiFileItem {
  id: string;
  filename?: string;
  name?: string;
  type: 'FOLDER' | 'FILE';
  folderId: string;
  size?: number;
  updatedAt?: string;
  createdAt: string;
  mimeType?: string;
  r2Key?: string;
  previews?: string[];
  isLocked?: boolean;
}

// Added FolderTreeItem interface
export interface FolderTreeItem {
  id: string;
  name: string;
  children?: FolderTreeItem[];
}

// Added UploadTask interface
export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  targetFolderId: string;
  xhr?: XMLHttpRequest;
}

// Added sort-related types
export type SortKey = 'name' | 'size' | 'modifiedAt';
export type SortOrder = 'asc' | 'desc';
