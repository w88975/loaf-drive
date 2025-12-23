# API 通信层指南

## 目录结构

```
api/
└── drive.ts            # 所有 API 接口封装
```

## 设计理念

### 职责定位
- **单一职责**：专注于与后端 API 的 HTTP 通信
- **类型安全**：所有接口都有明确的输入输出类型
- **错误处理**：统一的错误处理和重试机制
- **无状态**：不保存任何状态，仅作为通信桥梁

### 架构模式
- 使用对象导出 `driveApi` 集中管理所有接口
- 封装底层 `apiFetch` 函数提供通用能力
- 返回标准 `ApiResponse<T>` 格式

## 核心组件

### apiFetch() - 增强的 Fetch 封装
```typescript
async function apiFetch<T>(
  url: string, 
  options: RequestInit = {}, 
  retries = 2
): Promise<ApiResponse<T>>
```

**功能特性**：
1. **自动重试**：5xx 错误和网络异常最多重试 2 次
2. **重试策略**：失败后等待 1 秒再重试
3. **错误处理**：优先返回 API 的 JSON 错误，JSON 解析失败则构造标准错误
4. **泛型支持**：支持类型推断和类型安全

**使用场景**：
- 所有 API 请求的底层实现
- 不应直接暴露给外部使用

### driveApi 对象 - API 接口集合

#### 文件和文件夹查询

**fetchFiles()**
- **功能**：获取指定文件夹的内容或执行全局搜索
- **参数**：
  - `folderId`: 文件夹 ID（null 为根目录）
  - `search`: 搜索关键词（提供时忽略 folderId）
  - `password`: 文件夹密码（用于加密文件夹）
- **特殊处理**：密码通过 `x-folder-password` 请求头传递

**fetchRecycleBin()**
- **功能**：获取回收站文件列表
- **参数**：
  - `search`: 搜索关键词（可选）
- **注意**：回收站文件无法恢复，只能永久删除

**fetchTree()**
- **功能**：获取完整的文件夹树形结构
- **用途**：用于"移动文件"模态框的目标选择器
- **返回**：递归的 `FolderTreeItem[]` 数组

#### 文件夹操作

**createFolder()**
- **功能**：创建新文件夹
- **参数**：
  - `name`: 文件夹名称
  - `parentId`: 父文件夹 ID（null 为根目录）
- **API 约定**：传给后端时 null 需转换为 'root'

**updateLockStatus()**
- **功能**：设置或取消文件夹加密
- **参数**：
  - `id`: 文件夹 ID
  - `isLocked`: 是否加锁
  - `password`: 密码（加锁时必填，解锁时用于验证）
- **特殊处理**：密码通过 `x-folder-password` 请求头传递

#### 文件/文件夹通用操作

**renameItem()**
- **功能**：重命名文件或文件夹
- **参数**：
  - `id`: 项目 ID
  - `newName`: 新名称
- **API 字段**：后端使用 `filename` 字段

**moveItems()**
- **功能**：批量移动文件/文件夹
- **参数**：
  - `ids`: 项目 ID 数组
  - `targetFolderId`: 目标文件夹 ID（null 为根目录）
- **并发策略**：使用 `Promise.all` 并发请求提高性能
- **注意**：简化返回只取第一个结果

**deleteItem()**
- **功能**：删除文件/文件夹（移入回收站）
- **参数**：
  - `id`: 项目 ID
- **后端行为**：自动递归处理文件夹内的所有内容

#### 回收站操作

**permanentlyDeleteItem()**
- **功能**：从回收站永久删除文件
- **参数**：
  - `id`: 文件 ID
- **API 约定**：使用查询参数 `?id=xxx`
- **后端行为**：同时清理 D1 记录和 R2 存储

**clearRecycleBin()**
- **功能**：清空回收站
- **参数**：无
- **警告**：不可逆操作，所有文件将被永久删除

#### 分享功能

**createShare()**
- **功能**：创建文件/文件夹分享链接
- **参数**：
  ```typescript
  {
    fileId: string          // 文件或文件夹 ID
    password?: string       // 访问密码（可选）
    expiresAt?: string      // 过期时间 ISO 8601（可选）
    maxViews?: number       // 最大访问次数（可选）
  }
  ```
- **返回**：`{ code: string }` - 10位分享码
- **使用场景**：从预览窗口或右键菜单创建分享

**getShareInfo()**
- **功能**：获取分享的基本信息
- **参数**：
  - `code`: 分享码
- **返回**：分享信息（包含文件信息、是否有密码、访问次数等）
- **注意**：不需要密码即可获取基本信息

**verifySharePassword()**
- **功能**：验证分享密码
- **参数**：
  - `code`: 分享码
  - `password`: 密码
- **返回**：`{ message: string, accessToken: string }`
- **认证方式**：返回的 `accessToken` 用于后续请求，通过 Header `x-share-token` 传递
- **注意**：不使用 Cookie，避免 CORS 问题

**getShareFiles()**
- **功能**：获取分享的文件内容
- **参数**：
  - `code`: 分享码
  - `subFolderId`: 子文件夹 ID（可选，用于浏览文件夹内容）
  - `token`: 访问令牌（可选，有密码保护时必填）
- **特殊处理**：令牌通过 `x-share-token` 请求头传递
- **返回**：
  - 如果是文件夹：返回文件列表和分页信息
  - 如果是文件：返回单个文件信息

**getAllShares()**
- **功能**：获取所有分享列表
- **参数**：
  - `page`: 页码（可选，默认 1）
  - `limit`: 每页数量（可选，默认 20）
  - `fileId`: 按文件 ID 过滤（可选）
- **返回**：`{ items: Share[], pagination: PaginationInfo }`
- **使用场景**：分享管理页面

**updateShare()**
- **功能**：更新分享的配置
- **参数**：
  - `code`: 分享码
  - `data`: 更新数据
    - `password?: string | null` - 新密码（null 表示移除密码）
    - `expiresAt?: string | null` - 新过期时间（null 表示移除限制）
    - `maxViews?: number | null` - 新最大访问次数（null 表示移除限制）
- **使用场景**：修改分享配置（暂未在前端实现）

**deleteShare()**
- **功能**：删除分享链接（取消分享）
- **参数**：
  - `code`: 分享码
- **使用场景**：分享管理页面的取消分享功能

**实现示例**：

创建和访问分享：
```typescript
// 1. 创建分享
const shareRes = await driveApi.createShare({
  fileId: 'xxx',
  password: '123456',
  maxViews: 100
});
const shareCode = shareRes.data.code;

// 2. 验证密码并获取令牌
const verifyRes = await driveApi.verifySharePassword(shareCode, '123456');
const token = verifyRes.data.accessToken;

// 3. 获取文件列表（携带令牌）
const filesRes = await driveApi.getShareFiles(shareCode, undefined, token);
```

管理分享：
```typescript
// 1. 获取所有分享
const sharesRes = await driveApi.getAllShares(1, 50);
const shares = sharesRes.data.items;

// 2. 删除分享
await driveApi.deleteShare(shareCode);

// 3. 更新分享（延期）
await driveApi.updateShare(shareCode, {
  expiresAt: '2025-12-31T23:59:59Z'
});
```

#### 文件上传

**uploadPreview()**
- **功能**：上传预览图/缩略图
- **参数**：
  - `file`: Blob 对象（Canvas 生成的图片）
- **用途**：上传视频截帧或图片缩略图
- **返回**：预览图的 R2 key

**getUploadUrl()**
- **功能**：返回上传接口 URL
- **用途**：用于构造 XHR 请求
- **注意**：返回的是字符串，不是 Promise

**uploadInit()** - 分片上传初始化
- **功能**：创建分片上传会话
- **参数**：
  ```typescript
  {
    filename: string
    folderId: string  
    totalSize: number
    mimeType: string
  }
  ```
- **返回**：
  ```typescript
  {
    id: string        // 文件记录 ID
    uploadId: string  // R2 上传会话 ID
    r2Key: string     // R2 存储键
    filename: string
  }
  ```

**uploadPart()** - 上传单个分片
- **功能**：上传文件的一个分片
- **参数**：FormData 包含
  - `chunk`: 分片数据
  - `uploadId`: 上传会话 ID
  - `r2Key`: R2 存储键
  - `partNumber`: 分片序号（从 1 开始）
- **返回**：`{ partNumber, etag }`
- **注意**：ETag 用于最终合并分片

**uploadComplete()** - 完成分片上传
- **功能**：通知后端合并所有分片
- **参数**：
  ```typescript
  {
    id: string
    uploadId: string
    r2Key: string
    parts: Array<{ partNumber: number, etag: string }>
    previews?: string[]  // 预览图 R2 keys
  }
  ```
- **返回**：完整的文件记录 `ApiFileItem`

## 使用规范

### 调用方式
- **推荐**：通过 `hooks/useDriveQueries.ts` 中的封装 Hook 调用
- **不推荐**：直接在组件中调用（除非有特殊需求）

### 错误处理
```typescript
try {
  const result = await driveApi.fetchFiles(folderId);
  if (result.code === 0) {
    // 成功处理
  } else {
    // 业务错误处理
  }
} catch (error) {
  // 网络错误或超时处理
}
```

### 类型转换
- API 返回的是 `ApiFileItem`，需要转换为 `DriveItem`
- 转换逻辑统一在 `hooks/useDriveQueries.ts` 的 `mapApiItem` 函数中

## 扩展指南

### 添加新接口
1. 在 `driveApi` 对象中添加新方法
2. 定义清晰的参数和返回类型
3. 使用 `apiFetch` 作为底层请求函数
4. 添加必要的参数转换（如 null → 'root'）

### 修改重试策略
- 修改 `apiFetch` 函数的 `retries` 默认值
- 或在特定接口调用时传入自定义 `retries` 参数

### 添加请求拦截
- 在 `apiFetch` 函数中添加统一的请求头
- 例如添加认证 token：
  ```typescript
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  }
  ```

## 注意事项

### API 约定
- 文件夹 ID 为 null 时传递 'root' 字符串
- 加密文件夹密码使用请求头 `x-folder-password`
- 分享访问令牌使用请求头 `x-share-token`
- 所有响应都包含 `code`、`message`、`data` 三个字段

### 性能考虑
- 批量操作使用并发请求（`Promise.all`）
- 避免在循环中同步调用 API
- 大文件上传使用分片模式

### 安全提醒
- 密码仅通过 HTTPS 传输
- 不在客户端持久化密码（除 sessionStorage）
- 403 错误应清除本地密码缓存
- 分享令牌仅存储在内存中（组件状态），不持久化
- 分享访问使用 Header 认证而非 Cookie，避免 CORS 问题

