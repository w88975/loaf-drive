# GeekDrive 项目根目录指南

## 目录结构

```
/
├── api/                  # API 通信层
├── components/           # UI 组件层
│   ├── drive/           # 文件列表核心组件
│   ├── layout/          # 页面骨架组件（Header, Sidebar）
│   ├── overlays/        # 弹出式交互组件
│   └── preview/         # 多媒体预览组件
├── hooks/               # 逻辑抽象层
├── views/               # 视图页面层
│   ├── AuthView         # API Key 认证视图
│   ├── FilesView        # 文件管理主视图
│   ├── ShareView        # 公开分享页（外部访问）
│   ├── SharesManagementView  # 分享管理视图
│   └── TrashView        # 回收站视图
├── auth.ts              # API Key 认证管理
├── index.tsx            # 应用入口
├── App.tsx              # 根组件与路由
├── types.ts             # 全局类型定义
├── utils.ts             # 工具函数库
├── constants.tsx        # 静态常量与图标
└── config.ts            # 环境配置
```

## 核心文件说明

### index.tsx - 应用入口
- **功能**：初始化 React 应用和 Provider 层级
- **关键逻辑**：
  - 配置 TanStack Query 缓存策略（5分钟 staleTime）
  - 使用 HashRouter 实现客户端路由
  - React 18 并发模式启动

### App.tsx - 根组件
- **功能**：全局状态管理、路由配置和认证守卫
- **关键逻辑**：
  - 管理当前文件夹 ID 和面包屑路径
  - 实现全局拖拽上传监听
  - 协调上传队列和预览模态框
  - **认证路由守卫**：未认证用户强制跳转到登录页
  - 分享页独立访问（无需认证）
- **状态管理**：
  - currentFolderId: 当前所在文件夹
  - path: 导航路径历史
  - searchQuery: 搜索关键词
  - viewMode: 视图模式（grid/list）
  - previewItem: 当前预览的文件
  - isAuthenticated: 认证状态（通过 authManager 检查）

### types.ts - 类型定义
- **功能**：定义所有核心数据结构
- **关键类型**：
  - `DriveItem`: 前端标准化的文件/文件夹模型
  - `ApiFileItem`: 后端原始返回格式
  - `UploadTask`: 上传任务状态跟踪
  - `FolderTreeItem`: 树形选择器数据结构

### utils.ts - 工具函数
- **功能**：提供通用工具函数和客户端多媒体处理
- **核心函数**：
  - `getVideoFramesWeb()`: 客户端视频截帧（离线处理）
  - `getImageThumbnailWeb()`: 生成 150x150 缩略图
  - `formatSize()`: 字节转人类可读格式
  - `getFileCategory()`: 文件分类识别
  - `dataURItoBlob()`: Base64 转 Blob 用于上传

### constants.tsx - 常量定义
- **功能**：全局配色方案和 SVG 图标库
- **设计语言**：极客新丑风 (Geek-Brutalism)
  - 主色：纯黑 #000000
  - 点睛色：明黄 #FDE047
  - 背景：纯白 #FFFFFF
- **图标**：13 个 SVG 图标组件，支持 className 自定义

### config.ts - 环境配置
- **功能**：管理部署相关的环境变量
- **配置项**：
  - API_HOST: Cloudflare Workers 后端地址
  - STATIC_HOST: R2 CDN 静态资源地址

### auth.ts - 认证管理
- **功能**：管理 API Key 的存储和认证状态
- **核心方法**：
  - `saveApiKey(key)`: 保存 API Key 到 localStorage
  - `getApiKey()`: 获取保存的 API Key
  - `clearApiKey()`: 清除 API Key（退出登录）
  - `isAuthenticated()`: 检查是否已认证
- **存储方式**：localStorage（持久化存储）
- **安全机制**：
  - API Key 随每个需要鉴权的请求自动发送
  - 401 错误自动清除 API Key 并跳转登录页

## 设计理念

### 架构设计
1. **分层架构**：严格分离 API 层、逻辑层、组件层、视图层
2. **状态管理**：使用 TanStack Query 管理服务端状态，React State 管理 UI 状态
3. **类型安全**：全面使用 TypeScript，确保编译时类型检查

### 性能优化
1. **客户端处理**：视频截帧和图片缩略图在浏览器端完成，不占用服务器资源
2. **并发上传**：多文件同时上传，充分利用带宽
3. **分片上传**：大文件（>100MB）自动分片，提高可靠性
4. **智能缓存**：TanStack Query 自动缓存和失效管理

### 用户体验
1. **拖拽上传**：支持拖拽文件和整个文件夹
2. **加密文件夹**：密码保护和会话缓存
3. **多选操作**：批量删除、移动
4. **实时进度**：上传进度实时显示
5. **分享功能**：
   - 文件/文件夹分享链接生成
   - 支持密码保护
   - 支持过期时间和访问次数限制
   - 独立的分享页面（ShareView）
   - 只读预览（不支持二次分享）
   - 集中管理所有分享（SharesManagementView）
   - 一键复制分享链接
   - 取消分享功能

## 开发规范

### 代码风格
- **命名规范**：函数名使用动词开头（handle, fetch, get, set）
- **组件规范**：使用函数式组件 + Hooks
- **状态管理**：优先使用 TanStack Query，UI 状态用 useState

### 关键约定
1. **API 认证**：API Key 保存在 localStorage，自动随请求发送
2. **文件夹 ID**：null 表示根目录，'root' 用于 API 传参
3. **密码缓存**：使用 localStorage 永久保存，不会自动过期，除非手动清除
4. **预览图尺寸**：150x150 像素（图片）、350x350 像素（视频帧）
5. **分片大小**：10MB/片，100MB 以上文件启用分片上传

## 注意事项

### 安全考虑
- **API 鉴权**：
  - 所有网盘功能需要 API Key 认证
  - API Key 保存在 localStorage
  - 每个请求自动在 Header 中携带 `x-api-key`
  - 401 错误自动清除 API Key 并跳转登录页
  - **上传鉴权**：
    - 小文件直接上传：通过 `xhr.setRequestHeader('x-api-key', apiKey)` 手动添加
    - 大文件分片上传：通过 `apiFetch` 自动添加
    - 预览图上传：通过 `apiFetch` 自动添加
- **文件夹密码**：
  - 密码缓存在 localStorage，永久保存
  - 不会自动过期，方便用户重复访问
  - 403 错误自动清除缓存密码并重新请求
  - 用户可通过解锁文件夹功能手动清除密码
- **分享访问**：
  - 分享页面公开访问，无需 API Key
  - 使用 Header 认证（x-share-token），避免 CORS 问题
  - 分享令牌仅存储在内存中，刷新后需重新验证
  - 分享页面只读模式，禁止二次分享

### 兼容性
- 需要浏览器支持 webkitGetAsEntry API（文件夹遍历）
- 使用 HashRouter 兼容静态部署（GitHub Pages 等）

### 性能警告
- 视频截帧可能耗时较长，已标记为 processing 状态
- 大文件上传建议使用分片模式，小文件直接上传更快

## 扩展指南

### 添加新功能
1. 新增 API 接口：在 `api/drive.ts` 中添加
2. 新增数据查询：在 `hooks/useDriveQueries.ts` 中添加 Hook
3. 新增 UI 组件：根据功能选择合适的 components 子目录
4. 新增页面：在 `views/` 目录添加，并在 `App.tsx` 中注册路由

### 修改设计语言
1. 颜色：修改 `constants.tsx` 中的 `COLORS` 对象
2. 图标：在 `constants.tsx` 中的 `Icons` 对象添加新图标
3. 样式：使用 Tailwind CSS 类名，修改全局样式需调整 Tailwind 配置

### 性能优化建议
1. 使用 React.memo 包裹列表项组件
2. 使用 useMemo 缓存计算密集型操作
3. 使用 useCallback 避免函数重新创建
4. 考虑虚拟滚动处理大量文件列表

