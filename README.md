# 💾 GeekDrive - 全栈个人网盘系统说明书

GeekDrive 是一款专为极客设计的轻量级、高性能个人网盘系统。本项目基于 **Cloudflare 生态** (Workers + D1 + R2) 构建，前端采用 React + TypeScript + TanStack Query，旨在提供极致的响应速度与工业级的交互体验。

---

## 🎨 1. 设计方案与 UI 风格

### 设计语言：极客新丑风 (Geek-Brutalism)
*   **高对比度色调**：以经典的 **#000000 (黑色)** 和 **#FFFFFF (白色)** 为主基调，辅以 **#FDE047 (明黄色)** 作为点睛之笔（Active/Hover 状态）。
*   **硬核线条**：大量使用 `4px` 黑色实线边框和 `8px` 的复古阴影，营造出早期计算机说明书或工业控制台的视觉冲击力。
*   **兼容性**：
    *   **响应式**：完美适配从 320px 到 4K 屏幕。
    *   **移动端优化**：禁止页面缩放，提供原生应用体验。
    *   **浏览器**：兼容所有支持 WebKit Directory API 的现代浏览器。
    *   **离线友好**：所有多媒体处理（视频截图、图片缩略图）均在客户端 Web Worker/Canvas 环境完成，不占用服务端算力。
    *   **PWA 支持**：Service Worker 缓存策略，支持离线访问。

---

## 📂 2. 目录职责划分

```text
/
├── api/                # 通信层：封装与后端 API 的所有交互逻辑
├── components/         # 组件层：按功能拆分的 UI 原子
│   ├── drive/          # 核心文件列表组件 (Grid, List, Item)
│   ├── layout/         # 页面骨架组件 (Sidebar, Header)
│   ├── overlays/       # 弹出式交互组件 (Modals, UploadPanel)
│   └── preview/        # 多媒体预览专用解析组件
├── hooks/              # 逻辑抽象层：状态管理、数据获取、上传引擎
├── views/              # 视图层：对应路由的主要页面
├── types.ts            # 全局类型定义
├── utils.ts            # 工具库
├── constants.tsx       # 静态资源与常量
└── config.ts           # 部署环境变量
```

---

## 🔍 3. 全量文件指引手册

### 🛠️ 核心基础类
| 文件名 | 实现功能 | 核心细节 |
| :--- | :--- | :--- |
| **index.tsx** | 应用入口 | 配置 `QueryClient` 缓存策略；初始化 `HashRouter`；挂载 React 根节点；导入 Tailwind CSS 样式。 |
| **App.tsx** | 核心路由与容器 | 负责全局布局；管理导航路径状态 (`path`)；实现全局拖拽上传监听容器；集成 `useUpload` 状态。 |
| **types.ts** | 类型系统 | 定义 `DriveItem`（文件/文件夹统一模型）、`UploadTask`、`SortKey` 等核心接口。 |
| **utils.ts** | 客户端处理中心 | 实现 `getVideoFramesWeb`（客户端离线视频截图）；`getImageThumbnailWeb`（150x150 缩略图生成）；文件分类算法。 |
| **constants.tsx** | 视觉资源库 | 集成 lucide-react 图标库（30+ 图标）；定义全局颜色常量 `COLORS`；提供统一的图标导出接口。 |
| **config.ts** | 环境配置 | 管理 `API_HOST` 和 `STATIC_HOST`（R2 资源 CDN 地址）。 |

### 🛰️ 数据与逻辑类
| 文件名 | 实现功能 | 核心细节 |
| :--- | :--- | :--- |
| **api/drive.ts** | API 封装 | 实现了带有 **2次自动重试** 的 `apiFetch`；支持分片上传（`init/part/complete`）；透传 `x-folder-password` 鉴权头。 |
| **hooks/useDriveQueries.ts** | 异步状态管理 | 使用 `useQuery` 实现文件列表自动缓存；使用 `useMutation` 封装 CRUD 操作并在操作成功后触发缓存失效。 |
| **hooks/useUpload.ts** | **并发上传引擎** | 支持 `webkitGetAsEntry` 递归遍历文件夹；实现多文件**并发上传**；上传前预处理多媒体预览帧；支持断点续传初始化。 |

### 🖥️ 视图与主控类
| 文件名 | 实现功能 | 核心细节 |
| :--- | :--- | :--- |
| **views/FilesView.tsx** |  explorer 主页面 | 管理多选状态 (`selectedIds`)；处理文件夹加密解锁逻辑；协调右键菜单与操作模态框；支持网格/列表切换。 |
| **views/TrashView.tsx** | 回收站管理 | 专用回收站列表；实现“清空回收站”和“永久删除”逻辑。 |

### 🏗️ UI 交互组件类 (components/)
| 文件名 | 职责 | 实现逻辑 |
| :--- | :--- | :--- |
| **drive/FileItem.tsx** | 原子文件项 | 实现长按选择功能；动态加载图标；针对图片/视频展示预览封面。 |
| **drive/FilePreviewLoop.tsx** | 动态封面 | 在网格视图中以 **300ms** 间隔循环切换多帧预览图，产生动态 GIF 效果。 |
| **drive/GridView.tsx** | 网格容器 | 响应式栅格布局，针对 150px 缩略图优化。 |
| **drive/ListView.tsx** | 列表表格 | 实现带有排序反馈（↑/↓）的表头；优化移动端展示。 |
| **drive/ContextMenu.tsx** | 右键菜单 | 具备 **视口溢出检测** 功能；支持重命名、移动、删除、加锁等快捷操作。 |
| **drive/SelectionBar.tsx** | 批量操作栏 | 当选中多个文件时弹出，提供统一的删除或移动接口。 |
| **layout/Header.tsx** | 导航头 | 实现面包屑路径跳转；实时显示全局上传进度条及上传数量。 |
| **layout/Sidebar.tsx** | 侧边栏 | 处理应用主导航；显示当前连接的 Cloudflare 节点状态。 |
| **overlays/Modals.tsx** | 统一模态框 | 包含：新建文件夹、重命名、**递归删除确认**、树形移动选框、密码输入框。 |
| **overlays/UploadPanel.tsx** | 传输面板 | 悬浮显示上传队列；支持取消上传任务；区分上传中、处理中、已完成等状态。 |
| **overlays/PreviewModal.tsx** | 预览弹窗 | 明黄色标题栏设计；集成下载入口；提供详细的文件元数据展示。 |

### 👁️ 多媒体预览类 (components/preview/)
| 文件名 | 预览类型 | 技术实现 |
| :--- | :--- | :--- |
| **PreviewContent.tsx** | 策略分发器 | 根据 MIME 类型或后缀名自动匹配渲染器；支持“强制以文本模式打开”。 |
| **ImageViewer.tsx** | 图片查看器 | 带有黑色阴影装饰的响应式图像渲染。 |
| **VideoViewer.tsx** | 视频播放器 | 原生 HTML5 Video 集成；支持自动播放。 |
| **AudioViewer.tsx** | 音频播放器 | 实现 **旋转唱片动画** 视觉效果；黑色风格音频控制器。 |
| **TextViewer.tsx** | 代码查看器 | 集成 `highlight.js`；通过 API 获取原始内容；支持自动识别编程语言并高亮。 |
| **UnsupportedViewer.tsx** | 兜底界面 | 针对未知格式提供下载入口或尝试文本解析。 |

---

## 🛠️ 4. 关键交互细节与逻辑

### 并发上传逻辑
在 `useUpload.ts` 中，我们摒弃了传统的队列等待机制。当用户拖入一个包含 100 个文件的文件夹时，`processEntry` 会递归触发 `uploadSingleFile`。这些任务会同时发起异步 XHR 请求，充分利用用户带宽。

### 递归删除逻辑
前端 `DeleteModal` 会根据 `isPermanent` 标记区分“移入回收站”与“永久删除”。根据后端 API 更新，前端只需发送根 ID，后端会自动进行 D1 数据库记录的递归更新及 R2 物理文件的递归清理。

### 多媒体预处理
为了减轻服务器压力，所有预览所需的缩略图 (150x150) 和视频帧均在 `useUpload.ts` 中通过 `utils.ts` 离线生成。生成后的 Base64 数据被转换为 Blob 并首先上传到预览存储区。

---

## 📦 5. 技术栈与依赖

### 核心依赖

| 依赖包 | 版本 | 用途 |
| :--- | :--- | :--- |
| **react** | ^19.0.0 | UI 框架 |
| **react-dom** | ^19.0.0 | DOM 渲染 |
| **react-router-dom** | ^6.22.0 | 客户端路由 |
| **@tanstack/react-query** | ^5.66.0 | 服务端状态管理与缓存 |
| **lucide-react** | ^0.562.0 | 现代图标库（1000+ 图标） |
| **highlight.js** | ^11.9.0 | 代码语法高亮 |
| **tailwindcss** | ^3.4.1 | 原子化 CSS 框架（本地化） |
| **typescript** | ^5.3.3 | 类型系统 |
| **vite** | ^5.1.4 | 构建工具 |

### 图标系统

- **lucide-react**: 提供一致的现代图标设计
- **按需引入**: 支持 Tree-shaking，只打包使用的图标
- **高度可定制**: 支持 size、color、strokeWidth 等属性
- **30+ 常用图标**: 涵盖文件类型、操作、导航、状态等场景

### 本地化资源

- **字体文件**: Inter、JetBrains Mono（可变字体，总计 ~430KB）
- **CSS 资源**: Highlight.js 代码高亮样式
- **无 CDN 依赖**: 所有资源本地化，提升加载速度和离线可用性

### Service Worker 缓存

- **静态资源**: Cache First 策略（HTML/JS/CSS/字体）
- **API 请求**: Network First 策略（优先网络，失败降级缓存）
- **离线支持**: 首次加载后可离线访问应用界面
- **版本管理**: 自动清理旧版本缓存

---

## 🚀 6. 构建与部署

### 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

### 构建优化

- **代码分割**: Vendor chunk 分离第三方库
- **Tree Shaking**: 移除未使用的代码
- **资源压缩**: Terser + cssnano
- **资源哈希化**: 长期缓存优化
- **Gzip 压缩**: 生产环境自动启用

### 部署要求

- **HTTPS**: Service Worker 必需（localhost 除外）
- **静态托管**: 支持 SPA 路由（HashRouter 无需特殊配置）
- **推荐平台**: Cloudflare Pages、Vercel、Netlify

详细构建和部署指南请参考 [BUILD.md](./BUILD.md)

---
*GeekDrive - Minimalist. Powerful. Secure.*
