# Layout 页面骨架组件指南

## 目录结构

```
components/layout/
├── Header.tsx      # 顶部导航栏
└── Sidebar.tsx     # 侧边栏导航
```

## 设计理念

### 职责定位
layout 目录包含定义应用整体结构的骨架组件，负责：
- 全局导航和路由切换
- 搜索和视图模式控制
- 面包屑导航
- 上传进度显示

### 设计原则
- **固定布局**：Header 和 Sidebar 位置固定
- **响应式**：移动端 Sidebar 转为抽屉式
- **无业务逻辑**：仅负责 UI 展示和事件传递
- **状态上提**：所有状态由父组件（App）管理

## 核心组件详解

### Header.tsx - 顶部导航栏

#### 功能概述
顶部导航栏是应用的主要控制中心，提供：
- 侧边栏切换（移动端）
- 面包屑导航
- 搜索框
- 视图模式切换（网格/列表）
- 上传进度指示

#### Props 接口
```typescript
interface HeaderProps {
  onOpenSidebar: () => void                          // 打开侧边栏
  currentFolderId: string | null | 'trash'          // 当前文件夹 ID
  navigationHistory: DriveItem[]                    // 导航历史（面包屑）
  onNavigate: (id: string | null, item?: DriveItem) => void  // 导航回调
  searchQuery: string                               // 搜索关键词
  onSearchChange: (query: string) => void           // 搜索变化
  viewMode: 'grid' | 'list'                         // 视图模式
  onViewModeChange: (mode: 'grid' | 'list') => void // 视图切换
  uploadingCount: number                            // 上传中的任务数
  overallProgress: number                           // 总体上传进度 (0-100)
  onToggleUploadPanel: () => void                   // 切换上传面板
}
```

#### 布局结构
```
Header (固定顶部, h-14)
├── 左侧区域
│   ├── 菜单按钮（移动端）
│   └── Logo/标题
├── 中间区域
│   ├── 面包屑导航
│   └── 搜索框
└── 右侧区域
    ├── 视图切换按钮
    └── 上传进度指示
```

#### 面包屑导航
**功能**：
- 显示从根目录到当前文件夹的完整路径
- 点击任意层级可快速跳转
- 回收站显示特殊图标

**实现**：
```typescript
<div className="breadcrumb">
  {/* 根目录 */}
  <button onClick={() => onNavigate(null)}>
    <Icons.Folder /> Root
  </button>
  
  {/* 分隔符 */}
  <Icons.ChevronRight />
  
  {/* 路径层级 */}
  {navigationHistory.map((folder, index) => (
    <>
      <button onClick={() => onNavigate(folder.id, folder)}>
        {folder.name}
      </button>
      {index < navigationHistory.length - 1 && <Icons.ChevronRight />}
    </>
  ))}
</div>
```

**响应式处理**：
- 移动端：只显示当前文件夹名
- 桌面端：显示完整路径
- 路径过长：中间部分省略为 "..."

#### 搜索框
**功能**：
- 实时搜索（输入即搜索）
- 搜索图标指示
- 清除按钮

**实现**：
```typescript
<div className="search-box">
  <Icons.Search />
  <input 
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    placeholder="Search files..."
  />
  {searchQuery && (
    <button onClick={() => onSearchChange('')}>
      <Icons.Close />
    </button>
  )}
</div>
```

**搜索行为**：
- 全局搜索：忽略当前文件夹，搜索所有文件
- 实时反馈：输入变化立即触发搜索
- 清除搜索：返回当前文件夹视图

#### 视图模式切换
**功能**：
- 网格/列表视图切换
- 当前模式高亮显示

**实现**：
```typescript
<div className="view-toggle">
  <button 
    onClick={() => onViewModeChange('grid')}
    className={viewMode === 'grid' ? 'active' : ''}
  >
    <Icons.Grid />
  </button>
  <button 
    onClick={() => onViewModeChange('list')}
    className={viewMode === 'list' ? 'active' : ''}
  >
    <Icons.List />
  </button>
</div>
```

#### 上传进度指示
**功能**：
- 显示上传中的任务数量
- 显示整体上传进度条
- 点击打开上传面板

**实现**：
```typescript
{uploadingCount > 0 && (
  <button onClick={onToggleUploadPanel}>
    {/* 进度环 */}
    <svg className="circular-progress">
      <circle 
        r="18" 
        cx="20" 
        cy="20"
        strokeDasharray={`${overallProgress * 1.13} 113`}
      />
    </svg>
    
    {/* 数量徽章 */}
    <span className="badge">{uploadingCount}</span>
  </button>
)}
```

**视觉设计**：
- 圆形进度环：stroke-dasharray 动态控制
- 黄色进度：从 0° 到 360° 顺时针填充
- 数量徽章：右上角红色圆点

#### 响应式设计
**移动端** (<768px)：
- 显示菜单按钮（汉堡图标）
- 隐藏完整面包屑，只显示当前名称
- 搜索框宽度自适应
- 视图切换图标缩小

**桌面端** (≥768px)：
- 隐藏菜单按钮
- 显示完整面包屑
- 搜索框固定宽度
- 所有控件正常大小

---

### Sidebar.tsx - 侧边栏导航

#### 功能概述
侧边栏提供主要的路由导航和系统信息，包括：
- 主要路由链接（文件、分享管理、回收站）
- 退出登录按钮
- Cloudflare 节点状态显示
- 版本信息
- Logo 和品牌

#### Props 接口
```typescript
interface SidebarProps {
  isOpen: boolean       // 侧边栏是否打开（移动端）
  onClose: () => void   // 关闭侧边栏（移动端）
  onSelectRoot: () => void  // 点击"文件"导航到根目录
}
```

#### 布局结构
```
Sidebar (固定左侧, w-64)
├── Logo 区域
│   ├── 应用图标
│   └── 应用名称 "GEEK.DRIVE"
│   └── 状态 "Status: Online"
├── 导航链接区域
│   ├── All Files（主页）
│   ├── Shares（分享管理）
│   └── Trash（回收站）
├── 底部区域（absolute bottom-0）
│   ├── 退出登录按钮
│   └── 信息区域
│       ├── Cloudflare 节点状态
│       └── 版本号
└── 背景遮罩（移动端）
```

#### 导航链接
**文件（主页）**：
```typescript
<Link 
  to="/" 
  onClick={onSelectRoot}
  className={location.pathname === '/' ? 'active' : ''}
>
  <Icons.Folder />
  <span>Files</span>
</Link>
```

**分享管理**：
```typescript
<Link 
  to="/shares" 
  className={location.pathname === '/shares' ? 'active' : ''}
>
  <Icons.Search className="rotate-45" />
  <span>Shares</span>
</Link>
```

**回收站**：
```typescript
<Link 
  to="/trash" 
  className={location.pathname === '/trash' ? 'active' : ''}
>
  <Icons.Trash />
  <span>Trash</span>
</Link>
```

**退出登录**：
```typescript
<button
  onClick={handleLogout}
  className="w-full p-3 border-b-2 border-black hover:bg-red-500 hover:text-white"
>
  <Icons.Close />
  Logout
</button>

const handleLogout = () => {
  authManager.clearApiKey();
  navigate('/auth');
  onClose();
};
```

**激活状态**：
- 黄色背景：`bg-yellow-400`
- 黑色文字：`text-black`
- 粗边框：`border-l-4 border-black`

#### 节点状态显示
**功能**：
- 显示当前连接的 Cloudflare 节点信息
- 显示连接状态（绿点/红点）
- 可选：显示延迟时间

**实现**：
```typescript
<div className="node-status">
  <div className="status-dot connected" />
  <div className="node-info">
    <p className="node-name">Cloudflare</p>
    <p className="node-location">Global CDN</p>
  </div>
</div>
```

#### 响应式行为
**移动端** (<768px)：
- 默认隐藏（绝对定位，left: -100%）
- isOpen=true 时滑入（left: 0）
- 显示遮罩背景（backdrop）
- 显示关闭按钮（右上角 X）
- 点击遮罩或关闭按钮关闭

**桌面端** (≥768px)：
- 始终显示（固定定位）
- 无遮罩背景
- 无关闭按钮
- 占据固定宽度（256px）

#### 动画效果
**滑入动画**（移动端）：
```css
.sidebar {
  transition: transform 0.3s ease;
  transform: translateX(-100%);
}

.sidebar.open {
  transform: translateX(0);
}
```

**遮罩动画**：
```css
.backdrop {
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
}

.backdrop.visible {
  opacity: 1;
  pointer-events: auto;
}
```

---

## 布局协同

### Header + Sidebar 配合
**桌面端布局**：
```
┌─────────────────────────────────┐
│         Header (full width)      │
├──────┬──────────────────────────┤
│      │                          │
│ Side │      Main Content        │
│ bar  │                          │
│      │                          │
└──────┴──────────────────────────┘
```

**移动端布局**：
```
┌─────────────────────────────────┐
│         Header (full width)      │
├─────────────────────────────────┤
│                                  │
│      Main Content (full)         │
│                                  │
└─────────────────────────────────┘

[Sidebar 抽屉式从左滑入]
```

### 事件流向
```
User Action
    ↓
Layout Component (Header/Sidebar)
    ↓ (callback)
App Component
    ↓ (state change)
View Component (FilesView/TrashView)
    ↓ (API call)
Backend
```

---

## 最佳实践

### 性能优化
- 面包屑路径使用 useMemo 缓存
- 搜索输入使用 debounce（如果需要）
- 上传进度计算使用 useMemo

### 用户体验
- 面包屑点击立即响应
- 搜索框提供清除按钮
- 上传进度实时更新
- 移动端侧边栏动画流畅

### 可访问性
- 所有按钮有明确的 aria-label
- 键盘导航支持（Tab 键）
- 搜索框有 placeholder 提示
- 激活状态有明显视觉反馈

## 扩展指南

### 添加新的导航项
1. 在 Sidebar 中添加新的 Link
2. 使用相同的激活状态样式
3. 添加对应的图标
4. 在 App.tsx 中添加路由

### 添加新的 Header 功能
1. 确定放置位置（左/中/右）
2. 保持响应式设计
3. 通过 Props 传递必要数据
4. 使用回调函数与父组件通信

### 修改布局结构
- 修改 Sidebar 宽度：调整 `w-64` 类名
- 修改 Header 高度：调整 `h-14` 类名
- 注意：修改后需同步调整 main 区域的 padding/margin

## 注意事项

### 常见问题
- Z-index 层级：Sidebar > Header > Main
- 面包屑过长：使用省略号或滚动
- 移动端遮罩：阻止底层滚动
- 上传进度动画：使用 CSS transform 而非 width

### 性能警告
- 避免在 Header 中执行复杂计算
- 上传进度更新频率不要过高（最多 100ms 一次）
- 搜索输入建议 debounce（300ms）

### 浏览器兼容性
- CSS Grid：所有现代浏览器
- Flexbox：IE11+
- Transitions：所有现代浏览器
- backdrop-filter：需要前缀（Safari）

