# Hooks 逻辑抽象层指南

## 目录结构

```
hooks/
├── useDrive.ts           # 基础云盘数据管理（已废弃）
├── useDriveQueries.ts    # TanStack Query 数据管理（推荐使用）
└── useUpload.ts          # 上传引擎
```

## 设计理念

### 职责定位
- **逻辑封装**：将复杂的业务逻辑从组件中抽离
- **状态管理**：管理服务端状态（TanStack Query）和 UI 状态（React State）
- **可复用性**：提供可在多个组件中复用的逻辑单元

### 架构模式
- 使用 Custom Hooks 封装逻辑
- 服务端状态使用 TanStack Query 管理
- UI 状态使用 useState/useReducer 管理

## 核心 Hooks

### useDrive.ts（已废弃，不推荐使用）

**设计问题**：
- 没有使用 TanStack Query，手动管理缓存
- 缺少自动重新验证和后台刷新
- 错误处理和加载状态需要手动管理

**迁移建议**：使用 `useDriveQueries.ts` 替代

---

### useDriveQueries.ts（推荐使用）

#### 核心理念
- 基于 TanStack Query 实现
- 自动缓存、后台重新验证、乐观更新
- 统一的错误处理和加载状态

#### 数据查询 Hooks

**useFiles()**
```typescript
const useFiles = (
  folderId: string | null, 
  search?: string, 
  password?: string
)
```

**功能**：获取文件列表

**缓存策略**：
- queryKey: `['files', folderId, search, password]`
- 禁用窗口聚焦自动刷新（避免加密文件夹重复要求密码）
- 403 错误不重试（密码错误）

**返回值**：
- `data`: DriveItem[] - 文件列表
- `isLoading`: 是否加载中
- `error`: 错误对象
- `refetch`: 手动刷新函数

**使用场景**：FilesView 组件获取当前文件夹内容

---

**useRecycleBin()**
```typescript
const useRecycleBin = (search?: string)
```

**功能**：获取回收站文件列表

**缓存策略**：
- queryKey: `['recycle-bin', search]`
- 标准重试策略

**返回值**：同 useFiles

**使用场景**：TrashView 组件显示回收站

---

#### 数据操作 Hooks

**useDriveMutations()**
```typescript
const useDriveMutations = () => {
  return { 
    createFolder, 
    renameItem, 
    toggleLock, 
    deleteItems, 
    moveItems 
  }
}
```

**功能**：提供所有文件操作的 mutation 对象

**每个 mutation 特性**：
- 自动触发相关查询的缓存失效
- 支持 onSuccess/onError 回调
- 支持乐观更新（可选）

**Mutations 说明**：

1. **createFolder**
   - 参数：`{ name: string, parentId: string | null }`
   - 成功后：刷新 `['files']` 缓存

2. **renameItem**
   - 参数：`{ id: string, newName: string }`
   - 成功后：刷新 `['files']` 缓存

3. **toggleLock**
   - 参数：`{ id: string, isLocked: boolean, password?: string }`
   - 成功后：刷新 `['files']` 缓存

4. **deleteItems**
   - 参数：`ids: string[]`
   - 成功后：刷新 `['files']` 和 `['recycle-bin']` 缓存

5. **moveItems**
   - 参数：`{ ids: string[], targetId: string | null }`
   - 成功后：刷新 `['files']` 缓存

**使用示例**：
```typescript
const { createFolder } = useDriveMutations();

createFolder.mutate(
  { name: 'New Folder', parentId: currentFolderId },
  {
    onSuccess: () => console.log('Created'),
    onError: (error) => console.error(error)
  }
);
```

---

#### 分享相关 Hooks

**useShareInfo()**
```typescript
const useShareInfo = (code: string)
```

**功能**：获取分享的基本信息

**缓存策略**：
- queryKey: `['share-info', code]`
- 用于分享页面判断是否需要密码

**使用场景**：ShareView 组件获取分享信息

---

**useShareFiles()**
```typescript
const useShareFiles = (
  code: string, 
  subFolderId?: string, 
  token?: string
)
```

**功能**：获取分享的文件列表

**缓存策略**：
- queryKey: `['share-files', code, subFolderId, token]`
- 不自动重试（403 错误需要密码验证）

**使用场景**：ShareView 组件浏览分享内容

---

**useCreateShare()**
```typescript
const useCreateShare = () => {
  return useMutation({ ... })
}
```

**功能**：创建新的分享链接

**参数**：
- `fileId`: 文件或文件夹 ID
- `password`: 访问密码（可选）
- `expiresAt`: 过期时间（可选）
- `maxViews`: 最大访问次数（可选）

**使用场景**：PreviewModal 中的分享按钮

---

**useAllShares()**
```typescript
const useAllShares = (
  page?: number, 
  limit?: number, 
  fileId?: string
)
```

**功能**：获取所有分享列表

**缓存策略**：
- queryKey: `['shares', page, limit, fileId]`
- 支持分页和按文件过滤

**返回值**：
- `data.items`: 分享列表
- `data.pagination`: 分页信息

**使用场景**：SharesManagementView 组件

---

**useShareMutations()**
```typescript
const useShareMutations = () => {
  return { updateShare, deleteShare }
}
```

**功能**：提供分享管理操作

**Mutations 说明**：

1. **updateShare**
   - 参数：`{ code: string, data: UpdateShareData }`
   - 成功后：刷新 `['shares']` 缓存
   - 用途：修改密码、过期时间、访问次数限制

2. **deleteShare**
   - 参数：`code: string`
   - 成功后：刷新 `['shares']` 缓存
   - 用途：取消分享

**使用场景**：SharesManagementView 组件

---

**useRecycleMutations()**
```typescript
const useRecycleMutations = () => {
  return { permanentlyDelete, clearBin }
}
```

**功能**：提供回收站专用操作

**Mutations 说明**：

1. **permanentlyDelete**
   - 参数：`id: string`
   - 成功后：刷新 `['recycle-bin']` 缓存

2. **clearBin**
   - 参数：无
   - 成功后：刷新 `['recycle-bin']` 缓存

---

### useUpload.ts - 上传引擎

#### 核心功能
- 并发上传多个文件
- 自动分片上传（大文件 >100MB）
- 客户端预览图生成
- 文件夹递归遍历
- 进度跟踪和状态管理

#### Hook 接口
```typescript
const useUpload = () => {
  return {
    uploadTasks: UploadTask[]          // 上传任务队列
    showUploadPanel: boolean           // 上传面板显示状态
    setShowUploadPanel: (show) => void // 控制面板显示
    handleUpload: (input, folderId) => void  // 处理上传
    cancelUpload: (id) => void         // 取消上传
    clearHistory: () => void           // 清除历史
  }
}
```

#### 工作流程

**1. 接收上传请求**
- 支持拖拽（DataTransfer）
- 支持点击选择（FileList）
- 自动识别文件夹结构（webkitGetAsEntry）

**2. 文件夹遍历**
- 递归创建文件夹结构
- 文件夹必须先创建获取 ID
- 同级项目并发处理

**3. 单文件上传流程**

```
创建任务 (pending)
    ↓
生成预览图 (processing)
  - 视频：3帧截图（10%, 50%, 90%）
  - 图片：150x150 缩略图
    ↓
上传主体 (uploading)
  - 小文件：直接上传 + XHR 进度（携带 x-api-key）
  - 大文件：分片上传（10MB/片，通过 apiFetch 自动鉴权）
    ↓
完成 (completed)
```

**注意**：所有上传请求都需要 API Key 认证
- 小文件直接上传：通过 `xhr.setRequestHeader('x-api-key', apiKey)` 添加
- 大文件分片上传：通过 `apiFetch` 自动添加
- 预览图上传：通过 `driveApi.uploadPreview` (apiFetch) 自动添加

**4. 预览图生成**
- **视频处理**：
  - 使用 Canvas API 截取 3 帧
  - 尺寸：350x350 像素
  - 格式：JPEG，质量 0.8
  - 时间点：10%, 50%, 90%
  
- **图片处理**：
  - 使用 Canvas API 缩放
  - 尺寸：150x150 像素
  - 模式：Cover（填充满，裁剪溢出）
  - 格式：JPEG，质量 0.8

**5. 分片上传策略**
- 阈值：100MB
- 分片大小：10MB
- 流程：init → uploadPart (循环) → complete
- 优势：提高大文件上传稳定性

**6. 状态管理**
- `pending`: 等待处理
- `processing`: 生成预览图中
- `uploading`: 上传中
- `completed`: 已完成
- `error`: 失败
- `cancelled`: 已取消

#### 并发策略

**文件并发**：
- 所有文件同时开始上传
- 充分利用用户带宽
- 不设并发数限制（浏览器会自动限制）

**文件夹串行**：
- 必须先创建父文件夹获取 ID
- 子项目可并发处理

#### 鉴权处理

**所有上传都需要 API Key 认证**：

1. **小文件直接上传**（使用 XMLHttpRequest）：
   ```typescript
   const xhr = new XMLHttpRequest();
   xhr.open('POST', uploadUrl);
   
   // 手动添加 API Key header
   const apiKey = authManager.getApiKey();
   if (apiKey) {
     xhr.setRequestHeader('x-api-key', apiKey);
   }
   
   xhr.send(formData);
   ```

2. **大文件分片上传**（使用 apiFetch）：
   - `uploadInit`、`uploadPart`、`uploadComplete` 均通过 `apiFetch` 调用
   - `apiFetch` 会自动添加 `x-api-key` header

3. **预览图上传**（使用 apiFetch）：
   - `uploadPreview` 通过 `apiFetch` 调用
   - 自动添加 `x-api-key` header

#### 进度计算

**小文件**：
- 使用 XHR.upload.onprogress 事件
- 实时更新百分比

**大文件**：
- 按分片数量计算：`(完成分片数 / 总分片数) * 100`

**全局进度**：
- 所有任务进度的平均值
- 用于 Header 中的进度条显示

#### 错误处理

**预览图失败**：
- 仅警告，不中断上传
- 文件照常上传，只是没有预览

**上传失败**：
- 标记为 error 状态
- 保留在队列中供用户查看
- 不自动重试（避免重复）

#### 使用示例

```typescript
const { handleUpload, uploadTasks, cancelUpload } = useUpload();

// 拖拽上传
<div onDrop={(e) => handleUpload(e.dataTransfer, currentFolderId)} />

// 点击上传
<input 
  type="file" 
  onChange={(e) => handleUpload(e.target.files, currentFolderId)} 
/>

// 取消上传
<button onClick={() => cancelUpload(taskId)}>Cancel</button>

// 显示进度
{uploadTasks.map(task => (
  <div>{task.file.name}: {task.progress}%</div>
))}
```

## 最佳实践

### 使用 TanStack Query
- **优先使用** `useDriveQueries.ts` 而非 `useDrive.ts`
- 利用自动缓存和重新验证机制
- 使用 mutation 的 onSuccess 回调刷新缓存

### 错误处理
- 使用 query 的 error 状态展示错误信息
- 403 错误特殊处理（清除 localStorage 中的密码缓存）
- 网络错误提供重试按钮

### 性能优化
- 避免频繁调用 refetch
- 使用 queryKey 精确控制缓存粒度
- 上传时控制并发数（虽然当前未实现）

## 扩展指南

### 添加新的查询
1. 在 `useDriveQueries.ts` 中添加新的 useQuery Hook
2. 定义合适的 queryKey（包含所有查询参数）
3. 配置缓存和重试策略
4. 添加数据转换逻辑（mapApiItem）

### 添加新的操作
1. 在 API 层添加接口函数
2. 在 useDriveMutations 中添加 useMutation
3. 配置 onSuccess 刷新相关缓存
4. 考虑是否需要乐观更新

### 修改上传策略
- **修改分片大小**：修改 `CHUNK_SIZE` 常量
- **修改分片阈值**：修改 `CHUNKED_THRESHOLD` 常量
- **修改预览图尺寸**：修改 `getImageThumbnailWeb` 和 `getVideoFramesWeb` 调用参数
- **添加并发控制**：在 `handleUpload` 中实现队列管理

## 注意事项

### 密码缓存
- 密码通过 password 参数传入 useFiles
- 缓存管理在 FilesView 组件中，使用 localStorage 永久保存
- 密码不会自动过期，除非手动清除或解锁文件夹
- queryKey 包含 password，确保不同密码独立缓存

### 上传安全
- 预览图生成失败不应中断上传
- 大文件上传出错应提供断点续传（当前未实现）
- 考虑添加上传队列大小限制

### 性能警告
- 视频截帧可能耗时 5-10 秒
- 大文件分片上传占用内存较多
- 并发上传过多可能影响浏览器性能

