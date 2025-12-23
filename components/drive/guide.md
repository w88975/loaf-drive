# Drive 文件列表组件指南

## 目录结构

```
components/drive/
├── FileItem.tsx            # 文件项原子组件（核心）
├── GridView.tsx            # 网格视图容器
├── ListView.tsx            # 列表视图容器
├── FilePreviewLoop.tsx     # 动态封面循环播放
├── ContextMenu.tsx         # 右键菜单
├── SelectionBar.tsx        # 多选操作栏
└── NewFolderAction.tsx     # 新建文件夹按钮
```

## 设计理念

### 职责定位
drive 目录包含文件和文件夹展示的所有核心组件，负责：
- 文件列表的不同视图模式（网格、列表）
- 文件项的展示和交互
- 右键菜单和快捷操作
- 多选模式和批量操作

### 架构模式
- **原子组件**：FileItem - 最小的可复用单元
- **容器组件**：GridView, ListView - 管理布局和事件分发
- **功能组件**：ContextMenu, SelectionBar - 独立的功能模块

## 核心组件详解

### FileItem.tsx - 文件项原子组件

#### 功能特性
- **多态展示**：根据文件类型显示不同图标或预览图
- **选中状态**：支持勾选框和视觉反馈
- **长按选择**：移动端友好的多选体验
- **封面展示**：
  - 图片：显示缩略图
  - 视频：显示动态封面（FilePreviewLoop）
  - 其他：显示类型图标
- **信息展示**：文件名、大小（网格视图中隐藏）

#### Props 接口
```typescript
interface FileItemProps {
  item: DriveItem                      // 文件数据
  isSelected: boolean                  // 是否选中
  onClick: (item: DriveItem) => void   // 点击事件
  onLongPress?: (item: DriveItem) => void  // 长按事件
  onContextMenu?: (e: React.MouseEvent, item: DriveItem) => void  // 右键事件
  showSize?: boolean                   // 是否显示大小（列表视图用）
}
```

#### 关键实现

**长按检测**：
```typescript
const handleTouchStart = () => {
  const timer = setTimeout(() => {
    onLongPress?.(item);
  }, 500);  // 500ms 触发长按
  return () => clearTimeout(timer);
};
```

**封面渲染逻辑**：
```typescript
// 图片：显示缩略图
if (category === 'image' && item.previews?.length) {
  return <img src={item.previews[0]} />;
}

// 视频：显示动态封面
if (category === 'video' && item.previews?.length) {
  return <FilePreviewLoop frames={item.previews} />;
}

// 其他：显示图标
return <Icon />;
```

---

### GridView.tsx - 网格视图容器

#### 功能特性
- 响应式栅格布局
- 自适应列数（根据屏幕宽度）
- 150px 固定卡片宽度
- 支持快捷操作按钮（重命名、移动、删除）

#### Props 接口
```typescript
interface GridViewProps {
  items: DriveItem[]                          // 文件列表
  selectedIds: Set<string>                    // 选中的 ID 集合
  onItemClick: (item: DriveItem) => void      // 点击事件
  onItemLongPress: (item: DriveItem) => void  // 长按事件
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void  // 右键事件
  onRename?: (item: DriveItem) => void        // 重命名
  onMove?: (item: DriveItem) => void          // 移动
  onDelete?: (item: DriveItem) => void        // 删除
}
```

#### 布局特性
- 使用 CSS Grid 实现
- `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))`
- 间距：16px (gap-4)
- 卡片：150x150 核心区域 + 底部信息栏

---

### ListView.tsx - 列表视图容器

#### 功能特性
- 表格式布局
- 可排序的表头（名称、大小、修改时间）
- 全选功能
- 响应式列显示（移动端隐藏部分列）
- Hover 高亮行

#### Props 接口
```typescript
interface ListViewProps {
  items: DriveItem[]
  selectedIds: Set<string>
  onItemClick: (item: DriveItem) => void
  onItemLongPress: (item: DriveItem) => void
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void
  onSelectAll: () => void                     // 全选/取消全选
  onSort: (key: SortKey) => void              // 排序
  sortKey: SortKey                            // 当前排序字段
  sortOrder: SortOrder                        // 当前排序方向
  onRename?: (item: DriveItem) => void
  onMove?: (item: DriveItem) => void
  onDelete?: (item: DriveItem) => void
}
```

#### 表头设计
- 复选框列：全选/取消全选
- 名称列：主要信息，带图标
- 大小列：格式化显示（响应式隐藏）
- 修改时间列：相对时间或绝对时间
- 操作列：快捷操作按钮

#### 排序指示器
- 升序：↑ 向上箭头
- 降序：↓ 向下箭头
- 未排序：无指示器

---

### FilePreviewLoop.tsx - 动态封面组件

#### 功能特性
- 循环播放视频预览帧
- 300ms 间隔切换
- 产生类似 GIF 的动态效果
- 自动清理定时器

#### Props 接口
```typescript
interface FilePreviewLoopProps {
  frames: string[]  // 预览帧 URL 数组
}
```

#### 实现原理
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentIndex(prev => (prev + 1) % frames.length);
  }, 300);
  
  return () => clearInterval(interval);
}, [frames]);
```

---

### ContextMenu.tsx - 右键菜单

#### 功能特性
- 视口溢出检测：自动调整位置避免超出屏幕
- 条件菜单项：根据文件类型显示不同选项
- 图标 + 文字 + 快捷键提示
- 点击外部自动关闭

#### Props 接口
```typescript
interface ContextMenuProps {
  x: number                           // 菜单 X 坐标
  y: number                           // 菜单 Y 坐标
  item: DriveItem                     // 目标文件
  onRename: () => void                // 重命名
  onMove: () => void                  // 移动
  onToggleLock?: () => void           // 加锁/解锁（仅文件夹）
  onDelete: () => void                // 删除
}
```

#### 视口溢出检测
```typescript
const adjustPosition = () => {
  const menuWidth = 200;
  const menuHeight = 150;
  
  let finalX = x;
  let finalY = y;
  
  // 右侧溢出
  if (x + menuWidth > window.innerWidth) {
    finalX = window.innerWidth - menuWidth - 10;
  }
  
  // 底部溢出
  if (y + menuHeight > window.innerHeight) {
    finalY = window.innerHeight - menuHeight - 10;
  }
  
  return { finalX, finalY };
};
```

#### 菜单项设计
- **重命名**：所有文件和文件夹
- **移动**：所有文件和文件夹
- **加锁/解锁**：仅文件夹显示
  - 已锁定显示"解锁"，需要密码验证
  - 未锁定显示"加锁"，直接加锁
- **删除**：所有文件和文件夹

---

### SelectionBar.tsx - 多选操作栏

#### 功能特性
- 底部固定悬浮
- 显示选中数量
- 提供批量操作按钮
- 动画进入/退出

#### Props 接口
```typescript
interface SelectionBarProps {
  count: number               // 选中数量
  onMove: () => void          // 批量移动
  onDelete: () => void        // 批量删除
  onClear: () => void         // 清除选择
}
```

#### 视觉设计
- 黄色背景 + 黑色边框
- 固定在底部（fixed bottom-0）
- 全宽布局
- 上浮动画（animate-slide-up）

#### 操作按钮
1. **移动**：打开移动模态框，选择目标文件夹
2. **删除**：打开删除确认模态框
3. **取消**：清除所有选择，关闭操作栏

---

### NewFolderAction.tsx - 新建文件夹按钮

#### 功能特性
- 快捷按钮样式
- 黑色边框 + 白色背景
- Hover 黄色高亮
- 极简设计

#### Props 接口
```typescript
interface NewFolderActionProps {
  onClick: () => void  // 点击回调
}
```

#### 使用场景
- FilesView 工具栏
- 空白区域右键菜单（未来可扩展）

---

## 交互设计

### 点击行为
1. **单击**：
   - 无选中：文件夹进入，文件预览
   - 有选中：切换当前项的选中状态

2. **长按**（移动端）：
   - 进入多选模式
   - 选中当前项

3. **右键**：
   - 显示上下文菜单
   - 自动选中当前项（如果未选中）

### 选中状态
- 勾选框：列表视图左侧，网格视图左上角
- 视觉反馈：黄色边框或背景
- 多选模式：选中任意项后进入，显示 SelectionBar

### 响应式适配
- **移动端** (<768px)：
  - 网格视图：2-3 列
  - 列表视图：隐藏大小列
  - 快捷操作按钮：更大的触摸区域
  - 长按选择：代替右键

- **桌面端** (≥768px)：
  - 网格视图：4-6 列
  - 列表视图：显示所有列
  - Hover 高亮：鼠标悬停效果
  - 右键菜单：完整功能

## 性能优化

### 列表渲染
- 使用 `key={item.id}` 优化 Diff
- 考虑 React.memo 包裹 FileItem
- 虚拟滚动：超过 1000 项时考虑（当前未实现）

### 图片加载
- 使用预览图代替原图（150x150）
- 延迟加载：视口外的图片延迟加载（未实现）
- 加载失败：显示图标兜底

### 事件处理
- 使用事件委托减少事件监听器（ListView 表格）
- useCallback 缓存事件处理函数
- 避免在 render 中创建新函数

## 最佳实践

### 组件复用
- FileItem 可在 GridView 和 ListView 中复用
- 通过 Props 控制显示差异（showSize）
- 保持 Props 接口一致

### 状态管理
- 选中状态：由父组件（FilesView）管理
- 排序状态：由父组件管理
- 菜单状态：由父组件管理
- 组件本身无状态（除了 FilePreviewLoop 的动画帧）

### 事件传递
- 组件不直接调用 API
- 所有操作通过回调函数传递给父组件
- 父组件负责调用 mutations 和刷新数据

## 扩展指南

### 添加新的视图模式
1. 创建新的视图组件（如 TileView）
2. 实现相同的 Props 接口
3. 在 FilesView 中添加切换逻辑
4. 在 Header 中添加视图切换按钮

### 添加新的快捷操作
1. 在 GridView/ListView 中添加按钮
2. 添加对应的 Props 回调
3. 在 FilesView 中实现操作逻辑
4. 考虑在 ContextMenu 中同步添加

### 优化性能
1. 使用 React DevTools Profiler 识别瓶颈
2. FileItem 使用 React.memo
3. 实现虚拟滚动（react-window）
4. 图片懒加载（Intersection Observer）

## 注意事项

### 常见问题
- 长按和点击冲突：使用 touchstart/touchend 事件
- 右键菜单位置错误：使用 pageX/pageY 而非 clientX/clientY
- 图片加载失败：必须有 onError 兜底
- 预览帧过多：限制在 3-5 帧

### 安全考虑
- XSS 防护：文件名需要转义（React 自动处理）
- 图片跨域：预览图必须支持 CORS
- 事件冒泡：及时使用 stopPropagation

### 性能警告
- 不要在 FileItem 中使用复杂计算
- 避免在列表渲染中使用 Math.random()
- 大列表必须使用虚拟滚动
- 预览图动画不要使用 CSS animation（性能问题）

