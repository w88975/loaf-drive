# Views 视图层指南

## 目录结构

```
views/
├── FilesView.tsx       # 文件浏览主视图
└── TrashView.tsx       # 回收站视图
```

## 设计理念

### 职责定位
- **页面级组件**：对应路由的主要页面
- **状态协调**：管理页面级的 UI 状态和用户交互
- **组件组装**：组合多个子组件构成完整页面

### 架构模式
- 视图组件作为容器组件（Container Component）
- 负责数据获取和状态管理
- 将展示逻辑委托给展示组件（Presentational Component）

## 核心组件

### FilesView.tsx - 文件浏览主视图

#### 功能概述
文件和文件夹的浏览、管理、操作界面，是应用的核心视图。

#### 核心特性
1. **双视图模式**
   - 网格视图（GridView）：卡片式布局，显示预览图
   - 列表视图（ListView）：表格式布局，显示详细信息

2. **多选操作**
   - 批量删除
   - 批量移动
   - 底部选择栏显示操作按钮

3. **加密文件夹支持**
   - 密码输入和验证
   - 密码缓存（sessionStorage）
   - 403 错误自动清除缓存并重新请求

4. **右键菜单**
   - 文件/文件夹右键菜单：重命名、移动、删除、加锁/解锁
   - 空白区域右键菜单：新建文件夹、刷新

5. **排序功能**
   - 按名称、大小、修改时间排序
   - 升序/降序切换
   - 文件夹始终在文件前面

6. **模态框管理**
   - 新建文件夹
   - 重命名
   - 删除确认
   - 移动文件（树形选择器）
   - 密码输入（进入加密文件夹/解锁文件夹）

#### 状态管理

**UI 状态**：
- `selectedIds`: 已选中的文件/文件夹 ID 集合
- `sortKey` / `sortOrder`: 排序字段和方向
- `contextMenu`: 右键菜单位置和目标
- `activeModal`: 当前显示的模态框类型
- `targetItem`: 当前操作的目标项

**服务端状态**：
- 通过 `useFiles(folderId, searchQuery, password)` 获取
- 自动缓存和刷新
- 403 错误触发密码重新输入

**密码管理**：
- `folderPassword`: 当前文件夹的密码状态
- `getCachedPassword()`: 从 sessionStorage 读取
- `setCachedPassword()`: 保存到 sessionStorage
- `removeCachedPassword()`: 清除缓存（解锁或密码错误时）

#### 关键逻辑

**文件夹导航**：
```typescript
handleNavigate(item: DriveItem) {
  if (item.isLocked) {
    // 加密文件夹：先检查缓存密码
    const cached = getCachedPassword(item.id);
    if (cached) {
      // 有缓存，直接进入
      setFolderPassword(cached);
      setCurrentFolderId(item.id, item);
    } else {
      // 无缓存，弹出密码输入框
      setTargetItem(item);
      setActiveModal('password-enter');
    }
  } else {
    // 普通文件夹，直接进入
    setCurrentFolderId(item.id, item);
  }
}
```

**排序逻辑**：
```typescript
sortedItems = items.sort((a, b) => {
  // 1. 文件夹优先
  if (a.type === 'folder' && b.type === 'file') return -1;
  if (a.type === 'file' && b.type === 'folder') return 1;
  
  // 2. 同类型按 sortKey 排序
  const valA = a[sortKey] || '';
  const valB = b[sortKey] || '';
  return sortOrder === 'asc' ? valA - valB : valB - valA;
});
```

**右键菜单处理**：
- 点击文件/文件夹：显示项目菜单，自动选中
- 点击空白区域：显示目录菜单
- 全局点击事件：关闭所有菜单

**密码确认处理**：
- `password-enter`: 进入加密文件夹
  - 缓存密码
  - 设置 folderPassword 状态
  - 导航到目标文件夹
- `password-unlock`: 解锁文件夹
  - 调用 toggleLock mutation
  - 成功后清除密码缓存

#### 组件树结构

```
FilesView
├── 工具栏
│   ├── Upload 按钮
│   └── NewFolderAction 按钮
├── 文件列表区域
│   ├── GridView（网格视图）
│   │   └── FileItem * N
│   └── ListView（列表视图）
│       └── FileItem * N
├── 模态框层
│   ├── NewFolderModal
│   ├── RenameModal
│   ├── PasswordModal
│   ├── DeleteModal
│   └── MoveModal
├── 右键菜单层
│   ├── ContextMenu（项目菜单）
│   └── containerContextMenu（目录菜单）
└── SelectionBar（多选操作栏）
```

#### 使用的子组件
- `GridView` / `ListView`: 文件列表展示
- `ContextMenu`: 右键菜单
- `NewFolderAction`: 新建文件夹按钮
- `SelectionBar`: 多选操作栏
- `NewFolderModal` / `RenameModal` / `DeleteModal` / `MoveModal` / `PasswordModal`: 各种模态框

---

### TrashView.tsx - 回收站视图

#### 功能概述
显示和管理回收站中的已删除文件，支持永久删除和清空回收站。

#### 核心特性
1. **永久删除**
   - 单个文件永久删除
   - 批量永久删除
   - 删除确认提示

2. **清空回收站**
   - 一键删除所有文件
   - 不可逆警告

3. **双视图模式**
   - 网格视图
   - 列表视图

4. **简化功能**
   - 不支持预览
   - 不支持重命名
   - 不支持移动
   - 不支持右键菜单

#### 状态管理

**UI 状态**：
- `selectedIds`: 已选中的文件 ID 集合
- `sortKey` / `sortOrder`: 排序字段和方向
- `activeModal`: 当前模态框（'clear' | 'delete-permanent'）
- `targetItem`: 单个删除的目标文件

**服务端状态**：
- 通过 `useRecycleBin(searchQuery)` 获取
- 自动缓存和刷新

#### 关键逻辑

**清空回收站**：
```typescript
handleConfirmClear() {
  clearBin.mutate(undefined, {
    onSuccess: () => {
      setSelectedIds(new Set());
      setActiveModal(null);
    }
  });
}
```

**永久删除**：
```typescript
handleConfirmPermanentDelete() {
  const ids = selectedIds.size > 0 
    ? [...selectedIds] 
    : (targetItem ? [targetItem.id] : []);
  
  // API 限制：每次只能删除一个，使用并发请求
  Promise.all(ids.map(id => permanentlyDelete.mutateAsync(id)))
    .then(() => {
      setSelectedIds(new Set());
      setActiveModal(null);
    });
}
```

**排序逻辑**：
```typescript
// 回收站不区分文件夹和文件，直接按字段排序
sortedItems = items.sort((a, b) => {
  const valA = a[sortKey] || '';
  const valB = b[sortKey] || '';
  return sortOrder === 'asc' ? valA - valB : valB - valA;
});
```

#### 组件树结构

```
TrashView
├── 工具栏
│   └── Empty Trash 按钮
├── 文件列表区域
│   ├── GridView（网格视图）
│   │   └── FileItem * N
│   └── ListView（列表视图）
│       └── FileItem * N
├── 模态框层
│   ├── DeleteModal（清空回收站）
│   └── DeleteModal（永久删除）
└── SelectionBar（多选操作栏）
```

#### 使用的子组件
- `GridView` / `ListView`: 文件列表展示
- `DeleteModal`: 删除确认模态框
- `SelectionBar`: 多选操作栏（移动功能禁用）

---

## 设计对比

| 特性 | FilesView | TrashView |
|------|-----------|-----------|
| 文件夹导航 | ✅ | ❌ |
| 加密支持 | ✅ | ❌ |
| 预览文件 | ✅ | ❌ |
| 重命名 | ✅ | ❌ |
| 移动 | ✅ | ❌ |
| 删除 | ✅（移入回收站） | ✅（永久删除） |
| 右键菜单 | ✅ | ❌ |
| 多选操作 | ✅ | ✅ |
| 排序 | ✅ | ✅ |
| 搜索 | ✅ | ✅ |

## 最佳实践

### 状态管理
- 页面级状态放在视图组件中
- 服务端状态使用 TanStack Query Hooks
- 避免状态下钻过深（超过 3 层考虑 Context）

### 密码管理
- 使用 sessionStorage 而非 localStorage
- 403 错误必须清除缓存
- 密码通过 useFiles 的参数传递，不直接存储在状态中

### 性能优化
- 使用 useMemo 缓存排序结果
- 使用 useCallback 缓存事件处理函数
- 大列表考虑虚拟滚动（当前未实现）

### 错误处理
- 显示友好的错误提示
- 提供重试和返回按钮
- 403 错误特殊处理（密码相关）

## 扩展指南

### 添加新视图
1. 在 `views/` 目录创建新组件
2. 在 `App.tsx` 中添加路由
3. 在 `Sidebar` 中添加导航链接
4. 遵循现有视图的结构和模式

### 添加新功能
- **新建操作**：在 useDriveMutations 中添加，FilesView 中调用
- **新建模态框**：在 `components/overlays/Modals.tsx` 中添加
- **新的右键菜单项**：在 `ContextMenu` 组件中添加

### 修改布局
- 双视图模式：修改 `GridView` 和 `ListView` 组件
- 工具栏：修改视图组件中的工具栏区域
- 选择栏：修改 `SelectionBar` 组件

## 注意事项

### 密码安全
- 密码不能持久化到 localStorage
- sessionStorage 在关闭浏览器后自动清除
- 密码验证失败必须清除缓存

### API 限制
- 回收站永久删除：后端每次只支持一个 ID
- 需要使用 Promise.all 处理批量删除

### 用户体验
- 删除操作必须有确认提示
- 永久删除要特别警告不可恢复
- 加载状态要有视觉反馈
- 错误信息要清晰明了

