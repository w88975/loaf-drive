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
- 密码使用自定义请求头 `x-folder-password`
- 所有响应都包含 `code`、`message`、`data` 三个字段

### 性能考虑
- 批量操作使用并发请求（`Promise.all`）
- 避免在循环中同步调用 API
- 大文件上传使用分片模式

### 安全提醒
- 密码仅通过 HTTPS 传输
- 不在客户端持久化密码（除 sessionStorage）
- 403 错误应清除本地密码缓存

