
/**
 * 全局类型定义文件
 * 功能：定义应用中所有核心数据结构的 TypeScript 类型
 */

export type ItemType = 'file' | 'folder';

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

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

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

export interface FolderTreeItem {
  id: string;
  name: string;
  children?: FolderTreeItem[];
}

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  targetFolderId: string;
  xhr?: XMLHttpRequest;
}

export type SortKey = 'name' | 'size' | 'modifiedAt';
export type SortOrder = 'asc' | 'desc';

/**
 * 分享信息接口
 */
export interface ShareInfo {
  code: string;
  hasPassword?: boolean;
  expiresAt?: string;
  views: number;
  maxViews?: number;
  file: {
    id: string;
    filename: string;
    type: string;
    size: number;
  };
}

/**
 * 分享内容载荷接口
 */
export interface ShareContentResponse {
  isFolder: boolean;
  file?: ApiFileItem;
  folder?: ApiFileItem;
  items?: ApiFileItem[];
}
