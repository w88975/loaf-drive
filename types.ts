/**
 * 全局类型定义文件
 * 功能：定义应用中所有核心数据结构的 TypeScript 类型
 */

/**
 * 项目类型枚举
 * 功能：标识云盘中的项目是文件还是文件夹
 */
export type ItemType = 'file' | 'folder';

/**
 * 云盘项目统一数据模型（前端标准化格式）
 * 功能：表示文件或文件夹的完整信息
 * - id: 唯一标识符
 * - name: 显示名称
 * - type: 项目类型（文件/文件夹）
 * - parentId: 父文件夹ID，根目录为 null
 * - size: 文件大小（字节），文件夹无此字段
 * - extension: 文件扩展名（不含点），用于图标匹配
 * - modifiedAt: 最后修改时间戳（毫秒）
 * - url: R2 存储的完整访问地址
 * - mimeType: MIME 类型，用于预览器选择
 * - r2Key: Cloudflare R2 存储键名
 * - previews: 多媒体预览帧的 URL 数组（视频封面/图片缩略图）
 * - isLocked: 文件夹是否加密锁定
 */
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

/**
 * API 统一响应格式
 * 功能：后端所有接口返回的标准包装结构
 * - code: 状态码（200=成功）
 * - message: 响应消息
 * - data: 泛型数据载荷
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * API 原始文件项格式（后端返回格式）
 * 功能：后端数据库直接返回的文件/文件夹结构
 * 需要通过转换函数映射为 DriveItem
 * - type: 使用大写枚举 'FOLDER' | 'FILE'
 * - folderId: 对应 DriveItem 的 parentId
 * - filename/name: 不同接口可能使用不同字段
 */
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

/**
 * 文件夹树形结构节点
 * 功能：用于"移动文件"模态框中的树形选择器
 * 支持递归渲染嵌套文件夹层级
 */
export interface FolderTreeItem {
  id: string;
  name: string;
  children?: FolderTreeItem[];
}

/**
 * 上传任务数据模型
 * 功能：跟踪单个文件的上传状态和进度
 * - id: 任务唯一标识
 * - file: 原始 File 对象
 * - progress: 上传进度百分比 (0-100)
 * - status: 任务状态
 *   - pending: 等待上传
 *   - uploading: 上传中
 *   - processing: 上传完成，后端处理中（生成缩略图等）
 *   - completed: 完全完成
 *   - error: 失败
 *   - cancelled: 用户取消
 * - targetFolderId: 目标文件夹ID
 * - xhr: XMLHttpRequest 实例，用于取消上传
 */
export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  targetFolderId: string;
  xhr?: XMLHttpRequest;
}

/**
 * 排序字段枚举
 * 功能：定义文件列表可排序的列
 */
export type SortKey = 'name' | 'size' | 'modifiedAt';

/**
 * 排序方向枚举
 * 功能：定义升序或降序
 */
export type SortOrder = 'asc' | 'desc';
