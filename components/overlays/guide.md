# Overlays 弹出层组件指南

## 目录结构

```
components/overlays/
├── Modals.tsx          # 各种模态框集合
├── PreviewModal.tsx    # 文件预览弹窗
└── UploadPanel.tsx     # 上传队列面板
```

## 设计理念

### 职责定位
overlays 目录包含所有浮层交互组件，负责：
- 模态框交互（确认、输入、选择）
- 文件预览
- 上传队列管理

### 设计原则
- **层级管理**：使用 z-index 管理浮层优先级
- **背景遮罩**：阻止底层交互
- **焦点管理**：打开时聚焦，关闭时恢复
- **动画过渡**：流畅的进入/退出动画
- **键盘支持**：ESC 键关闭，Enter 键确认

## 核心组件详解

### Modals.tsx - 模态框集合

#### 功能概述
包含 5 种常用模态框，统一设计风格：
1. **NewFolderModal** - 新建文件夹
2. **RenameModal** - 重命名文件/文件夹
3. **DeleteModal** - 删除确认
4. **MoveModal** - 移动文件（树形选择器）
5. **PasswordModal** - 密码输入

#### 通用模态框结构
```tsx
<Modal>
  <Backdrop onClick={onClose} />
  <Dialog>
    <Header>
      <Title />
      <CloseButton onClick={onClose} />
    </Header>
    <Content>
      {/* 模态框内容 */}
    </Content>
    <Footer>
      <CancelButton onClick={onClose} />
      <ConfirmButton onClick={onConfirm} />
    </Footer>
  </Dialog>
</Modal>
```

#### 通用样式
- 背景遮罩：`bg-black/60 backdrop-blur-sm`
- 对话框：白色背景，黑色粗边框，硬核阴影
- 标题栏：黄色背景
- 按钮：黑底白字（确认）+ 白底黑字（取消）

---

#### 1. NewFolderModal - 新建文件夹

**Props**：
```typescript
interface NewFolderModalProps {
  onClose: () => void
  onConfirm: (name: string) => Promise<void>
}
```

**功能**：
- 输入新文件夹名称
- 验证：不能为空
- 默认名称："New Folder"
- Enter 键快速确认

**实现要点**：
```typescript
const [name, setName] = useState('New Folder');

const handleConfirm = async () => {
  if (!name.trim()) {
    alert('Folder name cannot be empty');
    return;
  }
  await onConfirm(name);
};

// 自动选中文本
useEffect(() => {
  inputRef.current?.select();
}, []);
```

---

#### 2. RenameModal - 重命名

**Props**：
```typescript
interface RenameModalProps {
  item: DriveItem              // 要重命名的项目
  onClose: () => void
  onConfirm: (newName: string) => Promise<void>
}
```

**功能**：
- 显示当前名称
- 自动选中文件名（不含扩展名）
- 验证：不能为空，不能与现有名称冲突
- 保留文件扩展名

**实现要点**：
```typescript
const [name, setName] = useState(item.name);

// 自动选中文件名部分（不含扩展名）
useEffect(() => {
  if (inputRef.current) {
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex > 0) {
      inputRef.current.setSelectionRange(0, lastDotIndex);
    } else {
      inputRef.current.select();
    }
  }
}, []);
```

---

#### 3. DeleteModal - 删除确认

**Props**：
```typescript
interface DeleteModalProps {
  title: string               // 标题（"Move to Trash?" / "Delete Permanently?"）
  count: number               // 删除数量
  isPermanent: boolean        // 是否永久删除
  onClose: () => void
  onConfirm: () => Promise<void>
}
```

**功能**：
- 显示删除数量
- 区分软删除（回收站）和永久删除
- 永久删除有额外警告
- 危险操作使用红色按钮

**视觉设计**：
- 软删除：黄色标题栏
- 永久删除：红色标题栏，红色确认按钮
- 警告文案：
  - 软删除："Items will be moved to trash"
  - 永久删除："This action cannot be undone!"

**实现要点**：
```typescript
<Dialog className={isPermanent ? 'danger' : ''}>
  <Header className={isPermanent ? 'bg-red-500' : 'bg-yellow-400'}>
    {title}
  </Header>
  <Content>
    <p>{count} item(s) will be deleted</p>
    {isPermanent && (
      <p className="text-red-500 font-bold">
        ⚠️ This action cannot be undone!
      </p>
    )}
  </Content>
  <Footer>
    <CancelButton />
    <ConfirmButton 
      className={isPermanent ? 'bg-red-600' : 'bg-black'}
    >
      Delete
    </ConfirmButton>
  </Footer>
</Dialog>
```

---

#### 4. MoveModal - 移动文件

**Props**：
```typescript
interface MoveModalProps {
  count: number               // 移动数量
  onClose: () => void
  onConfirm: (targetId: string | null) => Promise<void>
}
```

**功能**：
- 树形展示文件夹结构
- 点击选择目标文件夹
- 支持展开/折叠
- 禁用当前文件夹和子文件夹
- 支持移动到根目录

**树形选择器实现**：
```typescript
const [tree, setTree] = useState<FolderTreeItem[]>([]);
const [expanded, setExpanded] = useState<Set<string>>(new Set());
const [selected, setSelected] = useState<string | null>(null);

// 获取文件夹树
useEffect(() => {
  driveApi.fetchTree().then(res => {
    if (res.code === 0) setTree(res.data);
  });
}, []);

// 递归渲染树节点
const renderTree = (nodes: FolderTreeItem[], level = 0) => (
  <ul className={`pl-${level * 4}`}>
    {nodes.map(node => (
      <li key={node.id}>
        <button 
          onClick={() => toggleExpand(node.id)}
          disabled={isDisabled(node.id)}
        >
          {expanded.has(node.id) ? '▼' : '▶'}
          <Icons.Folder />
          {node.name}
        </button>
        {expanded.has(node.id) && node.children && (
          renderTree(node.children, level + 1)
        )}
      </li>
    ))}
  </ul>
);
```

**禁用逻辑**：
- 不能移动到自己
- 不能移动到自己的子文件夹

---

#### 5. PasswordModal - 密码输入

**Props**：
```typescript
interface PasswordModalProps {
  folderName: string          // 文件夹名称
  onClose: () => void
  onConfirm: (password: string) => void
}
```

**功能**：
- 输入文件夹密码
- 显示/隐藏密码
- 验证：不能为空
- 用途：进入加密文件夹或解锁文件夹

**实现要点**：
```typescript
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);

const handleConfirm = () => {
  if (!password.trim()) {
    alert('Password cannot be empty');
    return;
  }
  onConfirm(password);
};

<input 
  type={showPassword ? 'text' : 'password'}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
  autoFocus
/>
<button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? '👁️' : '👁️‍🗨️'}
</button>
```

---

### PreviewModal.tsx - 文件预览弹窗

#### 功能概述
全屏文件预览弹窗，支持多种文件类型：
- 图片：缩放查看
- 视频：播放控制
- 音频：播放控制 + 旋转唱片动画
- 文本/代码：语法高亮
- 其他：提示下载或尝试文本查看

#### Props 接口
```typescript
interface PreviewModalProps {
  item: DriveItem             // 要预览的文件
  onClose: () => void
}
```

#### 布局结构
```
PreviewModal (全屏)
├── 背景遮罩（半透明黑色）
├── 关闭按钮（右上角）
├── 标题栏（黄色背景）
│   ├── 文件名
│   ├── 文件大小
│   └── 下载按钮
└── 内容区域
    └── PreviewContent（策略分发器）
```

#### 功能特性

**标题栏信息**：
```typescript
<Header className="bg-yellow-400 text-black">
  <div className="file-info">
    <p className="filename">{item.name}</p>
    <p className="metadata">
      {formatSize(item.size)} • {formatDate(item.modifiedAt)}
    </p>
  </div>
  <a 
    href={item.url} 
    download={item.name}
    className="download-button"
  >
    <Icons.Download />
  </a>
</Header>
```

**键盘支持**：
- ESC 键：关闭预览
- 左/右箭头：上一个/下一个（未来可扩展）

**响应式设计**：
- 移动端：全屏显示
- 桌面端：最大化显示，保留边距
- 内容区域：自适应尺寸，居中对齐

---

### UploadPanel.tsx - 上传队列面板

#### 功能概述
悬浮显示上传队列，提供上传管理功能：
- 实时显示所有上传任务
- 显示每个任务的进度和状态
- 支持取消上传
- 清除已完成/失败的任务

#### Props 接口
```typescript
interface UploadPanelProps {
  tasks: UploadTask[]                // 上传任务列表
  onClose: () => void                // 关闭面板
  onCancel: (id: string) => void     // 取消上传
  onClear: () => void                // 清除历史
}
```

#### 布局结构
```
UploadPanel (右下角悬浮, fixed)
├── 标题栏
│   ├── "Upload Queue ({count})"
│   ├── 清除按钮
│   └── 关闭按钮
└── 任务列表（滚动）
    └── UploadTask * N
        ├── 文件图标
        ├── 文件名
        ├── 进度条
        ├── 状态文本
        └── 取消按钮
```

#### 任务状态显示

**状态图标和颜色**：
```typescript
const statusConfig = {
  pending: { icon: '⏳', color: 'text-gray-400', text: 'Waiting...' },
  processing: { icon: '⚙️', color: 'text-blue-500', text: 'Processing...' },
  uploading: { icon: '📤', color: 'text-yellow-500', text: `${progress}%` },
  completed: { icon: '✅', color: 'text-green-500', text: 'Completed' },
  error: { icon: '❌', color: 'text-red-500', text: 'Failed' },
  cancelled: { icon: '🚫', color: 'text-gray-500', text: 'Cancelled' }
};
```

**进度条**：
```typescript
<div className="progress-bar">
  <div 
    className="progress-fill bg-yellow-400"
    style={{ width: `${task.progress}%` }}
  />
</div>
```

#### 功能按钮

**取消上传**：
- 仅 uploading 状态可用
- 点击调用 onCancel(task.id)
- 会中止 XHR 请求

**清除历史**：
- 清除 completed / error / cancelled 状态的任务
- 保留 pending / uploading / processing 任务

**关闭面板**：
- 仅关闭面板，不影响上传
- 上传继续在后台进行

#### 视觉设计
- 固定位置：右下角，距离边缘 16px
- 尺寸：宽度 360px，最大高度 480px
- 阴影：8px 硬核阴影
- 边框：4px 黑色实线
- 滚动：内容区域独立滚动

#### 响应式设计
**移动端**：
- 全宽显示（bottom sheet）
- 从底部滑入
- 最大高度 70vh

**桌面端**：
- 固定宽度 360px
- 右下角悬浮
- 最大高度 480px

---

## 浮层管理

### Z-Index 层级
```
z-[150] - PreviewModal
z-[140] - ContextMenu
z-[130] - Modals
z-[120] - UploadPanel
z-[110] - SelectionBar
z-[100] - DragOverlay
```

### 背景遮罩
**作用**：
- 阻止底层交互
- 提供视觉分隔
- 点击关闭模态框

**实现**：
```typescript
<div 
  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130]"
  onClick={onClose}
/>
```

**注意**：内容区域需要阻止事件冒泡
```typescript
<div onClick={(e) => e.stopPropagation()}>
  {/* 模态框内容 */}
</div>
```

---

## 动画效果

### 淡入淡出
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  animation: fadeIn 0.2s ease;
}
```

### 缩放进入
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-dialog {
  animation: scaleIn 0.2s ease;
}
```

### 滑入动画
```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.upload-panel {
  animation: slideUp 0.3s ease;
}
```

---

## 最佳实践

### 焦点管理
- 打开时：聚焦到第一个输入框
- 关闭时：恢复到触发元素
- Tab 键：在模态框内循环

### 键盘支持
- ESC 键：关闭模态框
- Enter 键：确认操作
- Tab 键：焦点导航

### 性能优化
- 使用条件渲染而非 display:none
- 大列表使用虚拟滚动
- 避免频繁更新 DOM

### 用户体验
- 危险操作二次确认
- 操作按钮位置一致
- 加载状态及时反馈
- 错误信息清晰明了

---

## 扩展指南

### 添加新的模态框
1. 在 Modals.tsx 中添加新组件
2. 遵循通用模态框结构
3. 定义 Props 接口
4. 在父组件中添加调用逻辑

### 自定义动画
1. 定义 CSS 动画
2. 添加到组件 className
3. 使用 transition 属性控制
4. 考虑性能影响（transform vs position）

### 优化性能
1. 大型模态框使用懒加载
2. 复杂内容分块渲染
3. 避免不必要的重渲染
4. 使用 React.memo 包裹

---

## 注意事项

### 常见问题
- 遮罩点击穿透：使用 stopPropagation
- 滚动穿透：打开时禁用 body 滚动
- 焦点陷阱：确保 Tab 键在模态框内循环
- Z-index 冲突：统一管理层级

### 性能警告
- 避免在模态框中执行复杂计算
- 上传面板频繁更新：使用 throttle
- 树形选择器：大量节点考虑虚拟滚动

### 可访问性
- 所有模态框有 role="dialog"
- 标题有 aria-labelledby
- 关闭按钮有 aria-label
- 支持键盘导航

