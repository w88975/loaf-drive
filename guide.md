# GeekDrive 项目根目录指南

## 目录结构

```
/
├── api/                  # API 通信层
├── components/           # UI 组件层
│   ├── drive/           # 文件列表核心组件
│   ├── layout/          # 页面骨架组件
│   ├── overlays/        # 弹出式交互组件
│   └── preview/         # 多媒体预览组件
├── hooks/               # 逻辑抽象层
├── views/               # 视图页面层
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
- **功能**：全局状态管理和路由配置
- **关键逻辑**：
  - 管理当前文件夹 ID 和面包屑路径
  - 实现全局拖拽上传监听
  - 协调上传队列和预览模态框
- **状态管理**：
  - currentFolderId: 当前所在文件夹
  - path: 导航路径历史
  - searchQuery: 搜索关键词
  - viewMode: 视图模式（grid/list）
  - previewItem: 当前预览的文件

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

## 开发规范

### 代码风格
- **命名规范**：函数名使用动词开头（handle, fetch, get, set）
- **组件规范**：使用函数式组件 + Hooks
- **状态管理**：优先使用 TanStack Query，UI 状态用 useState

### 文档维护规范 ⚠️
**强制要求**：每次完成组件或功能开发后，必须同步更新对应的 guide.md 文档

1. **新增组件**：
   - 在对应目录的 guide.md 中添加组件说明章节
   - 包含：功能特性、Props 接口、实现要点、使用示例
   - 更新目录结构和流程图（如适用）

2. **修改现有功能**：
   - 同步更新 guide.md 中的相关描述
   - 更新代码示例和注意事项
   - 标注变更日期和原因

3. **文档位置**：
   - 根目录：`/guide.md` - 项目整体架构和开发指南
   - 组件目录：`components/*/guide.md` - 该模块的详细说明
   - 示例：`components/preview/guide.md` - 预览组件完整文档

4. **文档质量要求**：
   - 使用中文撰写，代码注释使用英文
   - 包含完整的代码示例和类型定义
   - 说明设计思路和关键决策
   - 列出注意事项和已知问题

**目的**：确保团队成员能快速理解代码架构，新人能通过文档快速上手

### 关键约定
1. **文件夹 ID**：null 表示根目录，'root' 用于 API 传参
2. **密码缓存**：使用 sessionStorage，关闭浏览器自动清除
3. **预览图尺寸**：150x150 像素（图片）、350x350 像素（视频帧）
4. **分片大小**：10MB/片，100MB 以上文件启用分片上传

## 注意事项

### 安全考虑
- 密码仅缓存在 sessionStorage，不持久化
- 403 错误自动清除缓存密码并重新请求

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
5. **⚠️ 更新文档**：完成开发后必须更新对应的 guide.md（见"文档维护规范"）

### 修改设计语言
1. 颜色：修改 `constants.tsx` 中的 `COLORS` 对象
2. 图标：在 `constants.tsx` 中的 `Icons` 对象添加新图标
3. 样式：使用 Tailwind CSS 类名，修改全局样式需调整 Tailwind 配置

### 性能优化建议
1. 使用 React.memo 包裹列表项组件
2. 使用 useMemo 缓存计算密集型操作
3. 使用 useCallback 避免函数重新创建
4. 考虑虚拟滚动处理大量文件列表

## 移动端优化

### PWA 支持
本项目已配置为 PWA 应用，支持添加到主屏幕和离线访问。

### 移动端交互优化

#### 1. 禁止页面缩放
**问题**：移动端输入密码时页面会自动缩放，影响体验

**解决方案**：
- `index.html` viewport 设置：`maximum-scale=1.0, user-scalable=no`
- CSS 设置：`touch-action: pan-x pan-y`
- 全局禁止文本选中（输入框和文本域除外）

```css
body {
  touch-action: pan-x pan-y;
}

* {
  -webkit-user-select: none;
  user-select: none;
}

input, textarea, [contenteditable="true"] {
  -webkit-user-select: text;
  user-select: text;
}
```

#### 2. 预览模态框全屏显示
**问题**：移动端小屏幕需要更大的预览空间

**解决方案**：
- 移动端：`h-full` + `w-full` 全屏显示，无边框
- 桌面端：`max-w-5xl` + `h-[90vh]` 居中显示，保留黑色边框
- 底部信息栏在移动端隐藏，节省空间

```tsx
<div className="p-0 md:p-4">
  <div className="border-0 md:border-4 w-full h-full md:max-w-5xl md:h-[90vh]">
    {/* 顶部按钮移动端缩小 */}
    <button className="p-1.5 md:p-2">
      <Icon className="w-4 h-4 md:w-5 md:h-5" />
    </button>
    
    {/* 底部信息栏移动端隐藏 */}
    <div className="hidden md:grid">...</div>
  </div>
</div>
```

#### 3. 长按交互智能适配
**问题**：移动端无右键，长按会选中文本，无法触发菜单

**解决方案**：根据设备类型采用不同交互模式

**移动端（触摸事件）**：
- 长按 600ms 触发右键菜单
- 禁止文本选中
- 通过模拟 `contextmenu` 事件触发菜单

**桌面端（鼠标事件）**：
- 右键直接触发菜单
- 长按 600ms 触发多选
- 保持原有交互习惯

```tsx
const startPress = (e: React.MouseEvent | React.TouchEvent) => {
  const isMobile = 'touches' in e;
  
  pressTimer.current = window.setTimeout(() => {
    if (isMobile) {
      // 移动端：触发右键菜单
      const touch = e.touches[0];
      const syntheticEvent = new MouseEvent('contextmenu', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      e.target.dispatchEvent(syntheticEvent);
    } else {
      // 桌面端：触发多选
      onLongPress();
    }
  }, 600);
};
```

#### 4. 移动端特殊注意事项

**右键菜单定位**：
- 自动边界检测，防止菜单超出屏幕
- 移动端菜单按钮需要更大的触摸区域（44x44px 最小）

**性能优化**：
- 视频预览自动降低质量
- 大图片使用懒加载
- 减少不必要的动画

**兼容性**：
- iOS Safari：需要 `-webkit-` 前缀
- Android Chrome：支持标准 CSS 属性
- 触摸事件：使用 `TouchEvent` 和 `MouseEvent` 双重支持

