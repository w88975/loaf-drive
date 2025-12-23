/**
 * 云盘数据管理 Hook（基础版本，建议使用 useDriveQueries.ts）
 * 功能：管理文件列表数据的加载和刷新
 * 注：此 Hook 未使用 TanStack Query，属于早期实现，现已被 useDriveQueries 替代
 */

import { useState, useCallback, useEffect } from 'react';
import { DriveItem } from '../types';
import { driveApi } from '../api/drive';
import { CONFIG } from '../config';

export const useDrive = (currentFolderId: string | null, searchQuery: string) => {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * API 数据格式转换函数
   * 功能：将后端返回的 ApiFileItem 转换为前端标准的 DriveItem
   * 处理：
   * - 统一 type 字段为小写格式
   * - 拼接完整的 R2 资源 URL
   * - 提取文件扩展名
   * - 转换时间戳格式
   * - 处理预览图 URL（支持相对路径和绝对路径）
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
    previews: apiItem.previews?.map((p: string) => p.startsWith('http') ? p : `${CONFIG.STATIC_HOST}/${p}`)
  });

  /**
   * 刷新文件列表
   * 功能：从服务器重新获取当前文件夹的内容
   * 依赖：当 currentFolderId 或 searchQuery 变化时自动触发
   */
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

  /**
   * 自动触发数据加载
   * 当文件夹ID或搜索关键词变化时重新获取数据
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, isLoading, refresh, setItems };
};
