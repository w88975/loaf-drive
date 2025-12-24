# Components 组件层指南

## 目录结构

```
components/
├── drive/              # 文件列表核心组件
│   ├── ContextMenu.tsx         # 右键菜单
│   ├── FileItem.tsx            # 文件项原子组件
│   ├── FilePreviewLoop.tsx     # 动态封面循环播放
│   ├── GridView.tsx            # 网格视图容器
│   ├── ListView.tsx            # 列表视图容器
│   ├── NewFolderAction.tsx     # 新建文件夹按钮
│   └── SelectionBar.tsx        # 多选操作栏
├── layout/             # 页面骨架组件
│   ├── Header.tsx              # 顶部导航栏
│   └── Sidebar.tsx             # 侧边栏导航
├── overlays/           # 弹出式交互组件
│   ├── Modals.tsx              # 各种模态框集合
│   ├── PreviewModal.tsx        # 文件预览弹窗
│   └── UploadPanel.tsx         # 上传队列面板
└── preview/            # 多媒体预览组件
    ├── PreviewContent.tsx      # 预览内容分发器
    ├── ImageViewer.tsx         # 图片查看器
    ├── VideoViewer.tsx         # 视频播放器
    ├── AudioViewer.tsx         # 音频播放器
    ├── PDFViewer.tsx           # PDF文档查看器
    ├── TextViewer.tsx          # 代码/文本查看器
    └── UnsupportedViewer.tsx   # 不支持格式的兜底组件
```

## 设计理念

### 组件分层
1. **原子组件** (Atomic Components)
   - 最小的可复用单元
   - 例如：FileItem, NewFolderAction
   - 无业务逻辑，纯展示

2. **容器组件** (Container Components)
   - 组合多个原子组件
   - 例如：GridView, ListView
   - 管理局部状态和交互

3. **布局组件** (Layout Components)
   - 定义页面结构
   - 例如：Header, Sidebar
   - 处理导航和全局 UI

4. **复合组件** (Composite Components)
   - 复杂的功能单元
   - 例如：PreviewModal, UploadPanel
   - 包含完整的业务逻辑

### 设计原则
- **单一职责**：每个组件只负责一个明确的功能
- **Props 接口清晰**：避免过度的 Props 传递（不超过 10 个）
- **可组合性**：组件可以灵活组合使用
- **无副作用**：展示组件不应该产生副作用
- **类型安全**：所有 Props 都有明确的类型定义

## 目录职责

### drive/ - 文件列表核心组件
**职责**：文件和文件夹的展示、交互、操作

**核心组件**：
- **FileItem**：文件项原子组件，支持图标、预览图、选中状态、长按选择
- **GridView** / **ListView**：两种视图模式的容器组件
- **ContextMenu**：右键菜单，带视口溢出检测
- **SelectionBar**：底部多选操作栏
- **FilePreviewLoop**：视频封面动态循环播放
- **NewFolderAction**：新建文件夹快捷按钮

**设计模式**：
- FileItem 作为展示组件，不包含业务逻辑
- GridView/ListView 负责布局，事件向上传递
- ContextMenu 独立管理菜单状态和位置

### layout/ - 页面骨架组件
**职责**：定义应用的整体布局结构

**核心组件**：
- **Header**：顶部导航栏，包含面包屑、搜索、视图切换、上传进度
- **Sidebar**：侧边栏导航，包含主要路由链接和节点状态

**设计模式**：
- 固定布局，响应式适配
- 通过回调函数与父组件通信
- 不直接操作路由，通过事件传递

### overlays/ - 弹出式交互组件
**职责**：提供各种浮层交互界面

**核心组件**：
- **Modals**：包含 5 种模态框（新建文件夹、重命名、删除、移动、密码输入）
- **PreviewModal**：文件预览弹窗，集成多种预览器
- **UploadPanel**：上传队列管理面板

**设计模式**：
- 使用 fixed 定位创建浮层
- 通过 onClose 回调关闭
- 使用背景遮罩阻止底层交互

### preview/ - 多媒体预览组件
**职责**：根据文件类型渲染对应的预览器

**核心组件**：
- **PreviewContent**：预览器分发器，根据 MIME 类型选择渲染器
- **ImageViewer**：图片查看器
- **VideoViewer**：HTML5 视频播放器
- **AudioViewer**：音频播放器，带旋转唱片动画
- **PDFViewer**：PDF文档查看器，浏览器原生支持
- **TextViewer**：代码高亮查看器，集成 highlight.js
- **UnsupportedViewer**：不支持格式的兜底展示

**设计模式**：
- 策略模式：PreviewContent 根据文件类型选择查看器
- 统一接口：所有查看器接收相同的 Props (item: DriveItem)
- 渐进增强：优先展示预览，失败则提供下载

## 组件通信

### Props Down, Events Up
- **数据向下流动**：父组件通过 Props 传递数据给子组件
- **事件向上传递**：子组件通过回调函数向父组件传递事件

### 避免 Props Drilling
- 超过 3 层的 Props 传递考虑使用 Context
- 当前项目中暂未使用 Context（组件层级不深）

### 全局状态管理
- 服务端状态：TanStack Query (在 Hooks 层)
- UI 状态：React State (在视图层或组件内部)
- 不使用 Redux 等全局状态管理库

## 样式规范

### Tailwind CSS
- 使用 Tailwind 原子类
- 响应式前缀：`md:` (768px+)
- 状态前缀：`hover:`, `focus:`, `disabled:`

### 极客新丑风格
- 黑色粗边框：`border-2 border-black`
- 硬核阴影：`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- 黄色点睛：`bg-yellow-400` / `text-yellow-400`
- 大写字体：`uppercase font-bold`

### 响应式断点
- 移动端优先：默认样式针对小屏幕
- 桌面端增强：使用 `md:` 前缀添加大屏样式
- 关键断点：768px (md)

## 性能优化

### 列表渲染优化
- 使用 key 属性（文件 ID）
- 考虑 React.memo 包裹 FileItem
- 大列表可考虑虚拟滚动（当前未实现）

### 事件处理优化
- 使用 useCallback 缓存事件处理函数
- 避免在 render 中创建新函数
- 使用事件委托（ListView 表格）

### 图片加载优化
- 使用预览图代替原图
- 延迟加载（未实现）
- 图片加载失败显示占位图标

## 最佳实践

### 组件编写
1. **类型优先**：先定义 Props 接口
2. **解构 Props**：组件参数使用解构
3. **提前返回**：早期 return 处理边界情况
4. **单一导出**：每个文件只导出一个主组件

### 事件处理
1. **命名规范**：使用 `handle` 前缀（如 handleClick）
2. **回调命名**：使用 `on` 前缀（如 onClick）
3. **防止冒泡**：必要时使用 `e.stopPropagation()`
4. **阻止默认**：使用 `e.preventDefault()`

### 条件渲染
1. **三元表达式**：简单条件使用 `condition ? A : B`
2. **短路运算**：简单显隐使用 `condition && <Component />`
3. **提前返回**：复杂条件提前 return null
4. **避免嵌套**：过多嵌套提取为子组件

## 扩展指南

### 添加新组件
1. 确定组件类型（原子/容器/布局/复合）
2. 选择合适的目录
3. 定义 Props 接口
4. 实现组件逻辑
5. 添加到父组件中使用

### 修改现有组件
1. 理解组件的职责边界
2. 保持 Props 接口的兼容性
3. 更新类型定义
4. 测试所有使用场景

### 性能优化
1. 使用 React DevTools Profiler
2. 识别重渲染热点
3. 应用 React.memo
4. 使用 useMemo/useCallback

## 注意事项

### 避免的反模式
- ❌ 在 render 中创建函数或对象
- ❌ 直接修改 Props
- ❌ 过度使用 useEffect
- ❌ Props 传递超过 3 层

### 常见陷阱
- 忘记阻止事件冒泡导致意外触发
- 右键菜单超出视口边界
- 图片加载失败没有兜底
- 长列表性能问题

### 测试建议
- 测试各种文件类型的渲染
- 测试边界情况（空列表、单个文件、大量文件）
- 测试响应式布局
- 测试交互流程（点击、长按、拖拽）

