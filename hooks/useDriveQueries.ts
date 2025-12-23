/**
 * 云盘数据查询和操作 Hooks（TanStack Query 版本）
 * 功能：提供基于 TanStack Query 的服务端状态管理
 * 优势：自动缓存、后台重新验证、乐观更新、错误重试
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driveApi } from '../api/drive';
import { DriveItem } from '../types';
import { CONFIG } from '../config';

/**
 * API 数据格式转换函数
 * 功能：将后端返回的 ApiFileItem 转换为前端标准的 DriveItem
 * 包含完整的字段映射和 URL 拼接逻辑
 */
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

/**
 * 文件列表查询 Hook
 * 功能：获取指定文件夹下的文件列表，支持搜索和加密文件夹
 * @param folderId 文件夹ID（null 为根目录）
 * @param search 搜索关键词（可选）
 * @param password 文件夹密码（可选，用于解锁加密文件夹）
 * @returns useQuery 返回对象（data, isLoading, error 等）
 * 
 * 缓存策略：
 * - queryKey 包含 folderId、search、password，确保不同条件独立缓存
 * - 禁用窗口聚焦时自动刷新，避免加密文件夹反复要求输入密码
 * 
 * 错误处理：
 * - 403 鉴权失败不重试，直接返回错误（避免密码错误时的无限重试）
 * - 其他错误最多重试 2 次
 */
export const useFiles = (folderId: string | null, search?: string, password?: string) => {
  return useQuery({
    queryKey: ['files', folderId, search, password],
    queryFn: async () => {
      const result = await driveApi.fetchFiles(folderId, search, password);
      if (result.code !== 0) {
        const err = new Error(result.message);
        (err as any).code = result.code;
        throw err;
      }
      return result.data.items.map(mapApiItem);
    },
    retry: (failureCount, error: any) => {
      if (error.message?.includes('403') || error.code === 403) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * 回收站列表查询 Hook
 * 功能：获取回收站中的所有已删除文件
 * @param search 搜索关键词（可选）
 * @returns useQuery 返回对象
 */
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

/**
 * 云盘操作 Mutations Hook
 * 功能：提供所有文件和文件夹的增删改操作
 * 每个操作成功后自动刷新相关的查询缓存，实现 UI 自动更新
 * @returns 所有操作 mutation 对象的集合
 */
export const useDriveMutations = () => {
  const queryClient = useQueryClient();

  /**
   * 创建文件夹
   * 成功后刷新文件列表缓存
   */
  const createFolder = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) => 
      driveApi.createFolder(name, parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  /**
   * 重命名文件/文件夹
   * 成功后刷新文件列表缓存
   */
  const renameItem = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      driveApi.renameItem(id, newName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  /**
   * 切换文件夹加密状态
   * 成功后刷新文件列表缓存
   */
  const toggleLock = useMutation({
    mutationFn: ({ id, isLocked, password }: { id: string; isLocked: boolean; password?: string }) => 
      driveApi.updateLockStatus(id, isLocked, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  /**
   * 批量删除文件/文件夹（移入回收站）
   * 成功后同时刷新文件列表和回收站缓存
   */
  const deleteItems = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => driveApi.deleteItem(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
  });

  /**
   * 批量移动文件/文件夹
   * 成功后刷新文件列表缓存
   */
  const moveItems = useMutation({
    mutationFn: ({ ids, targetId }: { ids: string[]; targetId: string | null }) => 
      driveApi.moveItems(ids, targetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  return { createFolder, renameItem, toggleLock, deleteItems, moveItems };
};

/**
 * 回收站操作 Mutations Hook
 * 功能：提供回收站专用的永久删除操作
 * @returns 回收站操作 mutation 对象的集合
 */
export const useRecycleMutations = () => {
  const queryClient = useQueryClient();

  /**
   * 永久删除单个文件
   * 成功后刷新回收站缓存
   */
  const permanentlyDelete = useMutation({
    mutationFn: (id: string) => driveApi.permanentlyDeleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recycle-bin'] }),
  });

  /**
   * 清空回收站
   * 成功后刷新回收站缓存
   */
  const clearBin = useMutation({
    mutationFn: () => driveApi.clearRecycleBin(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recycle-bin'] }),
  });

  return { permanentlyDelete, clearBin };
};