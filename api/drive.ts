/**
 * API 通信层
 * 功能：封装所有与后端 Cloudflare Workers API 的交互逻辑
 * 提供自动重试、错误处理、类型安全的接口
 */

import { ApiResponse, ApiFileItem, FolderTreeItem } from '../types';
import { CONFIG } from '../config';

const { API_HOST } = CONFIG;

/**
 * 增强的 Fetch 封装函数
 * 功能：提供自动重试、统一错误处理的 HTTP 请求能力
 * 
 * @param url 请求地址
 * @param options Fetch 配置项
 * @param retries 剩余重试次数，默认 2 次
 * @returns Promise<ApiResponse<T>> 统一的 API 响应格式
 * 
 * 重试策略：
 * - 5xx 服务器错误：自动重试，间隔 1 秒
 * - 网络错误/CORS 失败：自动重试，间隔 1 秒
 * - 其他错误：不重试，直接返回
 * 
 * 错误处理：
 * - 优先返回 API 返回的 JSON 错误信息
 * - JSON 解析失败时构造标准错误响应
 * - 网络异常时抛出描述性错误
 */
async function apiFetch<T>(url: string, options: RequestInit = {}, retries = 2): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && retries > 0 && response.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch(url, options, retries - 1);
    }

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
    throw new Error(error instanceof Error ? error.message : 'Network error or CORS failure');
  }
}

/**
 * 云盘 API 接口集合
 * 功能：提供所有文件和文件夹操作的 API 封装
 */
export const driveApi = {
  /**
   * 获取文件列表
   * 功能：获取指定文件夹下的所有文件和子文件夹
   * @param folderId 文件夹ID，null 表示根目录
   * @param search 搜索关键词（可选），提供时忽略 folderId 进行全局搜索
   * @param password 文件夹密码（可选），用于解锁加密文件夹
   * @returns 文件列表响应
   */
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

  /**
   * 获取回收站文件列表
   * 功能：获取所有已删除但未永久清除的文件
   * @param search 搜索关键词（可选）
   * @returns 回收站文件列表
   */
  fetchRecycleBin: async (search?: string) => {
    let url = `${API_HOST}/api/recycle-bin?limit=200`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiFetch<{ items: ApiFileItem[] }>(url);
  },

  /**
   * 获取文件夹树形结构
   * 功能：获取完整的文件夹层级关系，用于"移动文件"选择器
   * @returns 递归的文件夹树
   */
  fetchTree: async () => {
    return apiFetch<FolderTreeItem[]>(`${API_HOST}/api/folders/tree`);
  },

  /**
   * 创建新文件夹
   * 功能：在指定位置创建文件夹
   * @param name 文件夹名称
   * @param parentId 父文件夹ID，null 表示在根目录创建
   * @returns 创建结果
   */
  createFolder: async (name: string, parentId: string | null) => {
    return apiFetch<any>(`${API_HOST}/api/files/folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, folderId: parentId || 'root' })
    });
  },

  /**
   * 删除文件/文件夹（移入回收站）
   * 功能：软删除，文件移入回收站而非永久删除
   * 后端会递归处理文件夹内的所有内容
   * @param id 文件/文件夹 ID
   * @returns 删除结果
   */
  deleteItem: async (id: string) => {
    return apiFetch<any>(`${API_HOST}/api/files/${id}`, { method: 'DELETE' });
  },

  /**
   * 永久删除文件（从回收站删除）
   * 功能：从回收站中彻底删除文件，同时清理 R2 存储
   * @param id 文件 ID
   * @returns 删除结果
   */
  permanentlyDeleteItem: async (id: string) => {
    return apiFetch<any>(`${API_HOST}/api/recycle-bin?id=${id}`, { method: 'DELETE' });
  },

  /**
   * 清空回收站
   * 功能：永久删除回收站中的所有文件
   * @returns 清空结果
   */
  clearRecycleBin: async () => {
    return apiFetch<any>(`${API_HOST}/api/recycle-bin`, { method: 'DELETE' });
  },

  /**
   * 重命名文件/文件夹
   * 功能：修改文件或文件夹的名称
   * @param id 文件/文件夹 ID
   * @param newName 新名称
   * @returns 重命名结果
   */
  renameItem: async (id: string, newName: string) => {
    return apiFetch<any>(`${API_HOST}/api/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: newName })
    });
  },

  /**
   * 更新文件夹加密状态
   * 功能：设置或取消文件夹密码锁
   * @param id 文件夹 ID
   * @param isLocked 是否加锁
   * @param password 密码（加锁时必填，解锁时用于验证）
   * @returns 更新结果
   */
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

  /**
   * 批量移动文件/文件夹
   * 功能：将多个项目移动到指定文件夹
   * 采用并发请求提高性能
   * @param ids 要移动的项目 ID 数组
   * @param targetFolderId 目标文件夹 ID，null 表示移动到根目录
   * @returns 移动结果（简化返回第一个结果）
   */
  moveItems: async (ids: string[], targetFolderId: string | null) => {
    const folderId = targetFolderId || 'root';
    const results = await Promise.all(ids.map(id => 
      apiFetch<any>(`${API_HOST}/api/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      })
    ));
    return results[0];
  },

  /**
   * 上传预览图/缩略图
   * 功能：上传客户端生成的图片缩略图或视频预览帧
   * 用于在文件列表中显示封面，提升用户体验
   * @param file Blob 对象（Canvas 生成的图片数据）
   * @returns 预览图的 R2 存储键名
   */
  uploadPreview: async (file: Blob) => {
    const fd = new FormData();
    fd.append('file', file, 'preview.jpg');
    return apiFetch<{ r2Key: string }>(`${API_HOST}/api/files/upload-preview`, {
      method: 'POST',
      body: fd
    });
  },

  /**
   * 获取文件上传接口地址
   * 功能：返回上传端点 URL（用于直接构造 XHR 请求）
   * @returns 上传接口完整地址
   */
  getUploadUrl: () => `${API_HOST}/api/files/upload`,

  /**
   * 初始化分片上传
   * 功能：创建上传会话，获取 uploadId 和 R2 key
   * 支持大文件分片上传，提高可靠性
   * @param data 文件元信息
   *   - filename: 文件名
   *   - folderId: 目标文件夹ID
   *   - totalSize: 文件总大小（字节）
   *   - mimeType: MIME 类型
   * @returns 上传会话信息
   */
  uploadInit: async (data: { filename: string, folderId: string, totalSize: number, mimeType: string }) => {
    return apiFetch<{ id: string, uploadId: string, r2Key: string, filename: string }>(`${API_HOST}/api/files/upload/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * 上传单个分片
   * 功能：上传文件的一个分片，返回 ETag 用于最终合并
   * @param fd FormData 对象，包含：
   *   - chunk: 分片数据
   *   - uploadId: 上传会话ID
   *   - r2Key: R2 存储键
   *   - partNumber: 分片序号（从1开始）
   * @returns 分片上传结果（partNumber 和 etag）
   */
  uploadPart: async (fd: FormData) => {
    return apiFetch<{ partNumber: number, etag: string }>(`${API_HOST}/api/files/upload/part`, {
      method: 'POST',
      body: fd
    });
  },

  /**
   * 完成分片上传
   * 功能：通知后端合并所有分片，完成文件上传
   * 后端会在 R2 中合并分片，在 D1 数据库中创建文件记录
   * @param data 完成上传所需信息
   *   - id: 文件记录ID
   *   - uploadId: 上传会话ID
   *   - r2Key: R2 存储键
   *   - parts: 所有分片的 partNumber 和 etag 列表
   *   - previews: 可选的预览图 R2 key 数组
   * @returns 最终的文件记录
   */
  uploadComplete: async (data: { id: string, uploadId: string, r2Key: string, parts: { partNumber: number, etag: string }[], previews?: string[] }) => {
    return apiFetch<ApiFileItem>(`${API_HOST}/api/files/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};
