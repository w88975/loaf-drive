# Project Context

## Purpose
GeekDrive (loaf-drive) 是一款专为极客设计的轻量级、高性能个人网盘系统。基于 Cloudflare 生态（Workers + D1 + R2）构建，提供极致的响应速度与工业级的交互体验。

**核心目标**：
- 提供类似 Google Drive 的文件管理体验
- 所有多媒体处理在客户端完成，减轻服务器压力
- 支持离线访问和 PWA 能力
- 实现并发上传、实时预览、递归操作等高级功能

## Tech Stack

### 核心框架
- **React** 19.0.0 - UI 框架，使用函数组件 + Hooks
- **TypeScript** 5.3.3 - 类型系统，target ES2022
- **Vite** 5.1.4 - 构建工具，开发服务器端口 9888
- **pnpm** 10.26.0 - 包管理器

### 状态管理与路由
- **TanStack Query** (@tanstack/react-query) 5.66.0 - 服务端状态管理与缓存
- **React Router** (react-router-dom) 6.22.0 - 客户端路由，使用 HashRouter

### UI 与样式
- **Tailwind CSS** 3.4.1 - 原子化 CSS 框架（本地化配置）
- **Lucide React** 0.562.0 - 现代图标库（30+ 常用图标）
- **字体**：Inter (sans-serif) + JetBrains Mono (monospace)

### 多媒体处理
- **HLS.js** 1.6.15 - HLS 流媒体播放（.m3u8）
- **Highlight.js** 11.9.0 - 代码语法高亮
- **Canvas API** - 视频截图、图片缩略图生成（客户端处理）

### 国际化
- **i18next** 25.7.3 + react-i18next 16.5.0 - 支持中文/英文切换

### 构建优化
- **Terser** - 代码压缩
- **Rollup** - 代码分割（vendor chunk 分离）
- **Service Worker** - PWA 缓存策略

## Project Conventions

### Code Style

#### 语言与格式
- **语言**：TypeScript，严格模式
- **模块**：ESNext，使用 import/export
- **JSX**：react-jsx（自动导入 React）
- **命名约定**：
  - 组件文件：PascalCase（如 `FileItem.tsx`）
  - 工具函数：camelCase（如 `formatFileSize`）
  - 类型定义：PascalCase（如 `DriveItem`）
  - Hooks：camelCase，use 前缀（如 `useDrive`）
  - 常量：UPPER_SNAKE_CASE（如 `API_HOST`）

#### 代码规范
- 使用函数组件，避免 class 组件
- 优先使用 `const` 声明，避免 `var`
- 使用箭头函数 `() => {}` 而非 `function`
- 使用可选链 `?.` 和空值合并 `??`
- 所有异步操作使用 `async/await`
- 不需要额外的代码注释（函数名即文档），特殊情况用英文注释

#### TypeScript 规范
- 启用 `experimentalDecorators`
- 使用 `@/*` 路径别名（映射到根目录）
- 显式声明函数返回类型（如 `React.FC`）
- 使用接口（interface）而非类型别名（type）处理对象结构
- 避免 `any`，使用 `unknown` 或泛型

#### Tailwind CSS 规范
- 使用原子类，避免自定义 CSS
- 移动端优先（mobile-first）
- 响应式断点：md: (768px), lg: (1024px)
- 禁止圆角（rounded-none）
- 统一使用 `duration-150` 或 `duration-200` 过渡

### Architecture Patterns

#### 分层架构
```
/
├── api/           - 通信层：封装所有后端 API 交互（apiFetch, 分片上传）
├── components/    - UI 组件层：按功能模块划分
│   ├── drive/     - 文件列表核心组件（GridView, ListView, FileItem）
│   ├── layout/    - 页面骨架（Sidebar, Header）
│   ├── overlays/  - 弹出式交互（Modals, UploadPanel, PreviewModal）
│   └── preview/   - 多媒体预览组件（Image, Video, Audio, PDF, Text）
├── hooks/         - 逻辑抽象层：状态管理、数据获取、上传引擎
├── views/         - 视图层：对应路由的页面组件
├── i18n/          - 国际化配置
├── types.ts       - 全局类型定义
├── utils.ts       - 工具函数
├── constants.tsx  - 图标与常量
└── config.ts      - 环境配置
```

#### 核心模式

**1. 状态管理策略**
- **服务端状态**：使用 TanStack Query（useQuery + useMutation）
- **本地 UI 状态**：使用 React Hooks（useState, useReducer）
- **上传状态**：独立的 `useUpload` Hook 管理队列

**2. 数据流**
- API 层 → Hooks 层（useQuery/useMutation）→ Views → Components
- 避免跨层调用，保持单向数据流

**3. 组件设计**
- 容器组件（Container）：管理状态和逻辑（如 FilesView）
- 展示组件（Presentational）：纯 UI 渲染（如 FileItem）
- 自定义 Hooks：提取复用逻辑（如 useDriveQueries）

**4. 路由结构**
- HashRouter 模式（无需服务端配置）
- 路由：`/`（文件浏览）、`/trash`（回收站）、`/shares`（分享管理）、`/share/:code`（分享页）、`/auth`（认证页）

**5. 错误处理**
- API 层：自动重试 2 次（`apiFetch`）
- UI 层：使用 try-catch + 错误提示

**6. 性能优化**
- 客户端多媒体处理（视频截图、图片缩略图）
- 代码分割（vendor chunk）
- 懒加载（React.lazy）
- 虚拟化长列表（按需实现）
- Service Worker 缓存

### Testing Strategy
当前项目**未配置自动化测试**。开发时依赖：
- TypeScript 类型检查
- ESLint 代码质量检查（需确认配置）
- 手动功能测试

未来可引入：
- Vitest（单元测试）
- React Testing Library（组件测试）
- Playwright（E2E 测试）

### Git Workflow
（请根据团队实际情况补充）

建议工作流：
- 主分支：`main` 或 `master`
- 功能分支：`feature/xxx`
- 修复分支：`fix/xxx`
- Commit 规范：使用约定式提交（Conventional Commits）

## Domain Context

### 核心概念

**DriveItem**
文件和文件夹的统一抽象模型，包含：
- `id`: 唯一标识符
- `name`: 文件/文件夹名称
- `type`: 'file' | 'folder'
- `mimeType`: MIME 类型（仅文件）
- `size`: 文件大小（字节）
- `parentId`: 父文件夹 ID
- `previewImages`: 预览图数组（视频多帧预览）
- `createdAt`, `updatedAt`: 时间戳

**上传机制**
- 支持文件夹递归上传（WebKit Directory API）
- 并发上传（无队列等待，充分利用带宽）
- 分片上传（init → upload parts → complete）
- 客户端预处理：生成缩略图和视频帧后上传

**文件操作**
- 递归删除：前端发送根 ID，后端递归处理 D1 + R2
- 移动文件：支持跨文件夹移动
- 文件夹加密：支持密码保护

**预览系统**
根据 MIME 类型或扩展名自动选择渲染器：
- 图片：Image 标签 + 响应式
- 视频：Canvas 渲染 + HLS 支持 + Worker 解码
- 音频：Audio 标签 + 旋转唱片动画
- PDF：iframe 原生渲染
- 代码：Highlight.js 语法高亮
- 其他：提示下载或强制文本模式

**分享功能**
- 生成分享码（code）
- 支持密码保护
- 独立的分享页路由（无需认证）

## Important Constraints

### 技术约束
- **浏览器要求**：需支持 WebKit Directory API（现代浏览器）
- **HTTPS 必需**：Service Worker 要求（localhost 除外）
- **客户端处理**：所有多媒体预处理在浏览器完成，不占用服务端资源
- **离线友好**：支持 PWA 和离线访问核心界面

### 设计约束（极客新丑风 Geek-Brutalism）
- **禁止圆角**：所有组件使用 `rounded-none`
- **色彩限制**：仅使用 #000000（黑）、#FFFFFF（白）、#FDE047（黄）、#DC2626（红）、#9CA3AF（灰）
- **边框规范**：`border-2` 或 `border-4` + 黑色实线
- **硬阴影**：使用偏移阴影（如 `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`），禁止模糊阴影
- **字体规范**：UI 使用 `font-mono`，正文使用 `font-sans`
- **交互反馈**：Hover 使用 `bg-yellow-400`，Active 使用 `scale-95`

### 性能约束
- **并发上传**：同时上传多个文件，无排队机制
- **缓存策略**：静态资源 Cache First，API Network First
- **内存管理**：视频播放器限制最大缓冲 10s，后向缓冲 5s，上限 30MB

### 业务约束
- **用户认证**：基于 authManager，需登录后访问（分享页除外）
- **文件夹加密**：支持密码保护，需解锁后访问
- **回收站**：删除文件先移入回收站，支持恢复和永久删除

## External Dependencies

### 后端 API
- **Cloudflare Workers**：提供 RESTful API
- **Cloudflare D1**：SQLite 数据库，存储文件元数据
- **Cloudflare R2**：对象存储，存储文件内容

### API 端点（参考 api/drive.ts）
- `GET /api/drive` - 获取文件列表
- `POST /api/drive/folder` - 创建文件夹
- `POST /api/drive/upload/init` - 初始化上传
- `POST /api/drive/upload/part` - 分片上传
- `POST /api/drive/upload/complete` - 完成上传
- `DELETE /api/drive/:id` - 删除文件
- `PATCH /api/drive/:id` - 更新文件（重命名/移动）
- `GET /api/trash` - 获取回收站列表
- `POST /api/trash/:id/restore` - 恢复文件
- `POST /api/share` - 创建分享
- `GET /api/share/:code` - 访问分享

### CDN 与资源
- **STATIC_HOST**：R2 资源 CDN 地址（由 `config.ts` 配置）
- **本地字体**：Inter、JetBrains Mono（可变字体，~430KB）
- **Highlight.js CSS**：代码高亮样式（本地化）

### 浏览器 API
- **File API**：文件读取和处理
- **WebKit Directory API**：文件夹递归遍历
- **Canvas API**：视频截图和图片缩略图生成
- **Service Worker API**：PWA 缓存
- **HLS.js**：处理 .m3u8 流媒体

### 开发工具
- **OpenSpec**：规范驱动开发工具（本项目使用）
- **Vite**：开发服务器和构建工具
- **pnpm**：包管理器

---

**最后更新**: 2026-01-04  
**维护者**: @kamisama
