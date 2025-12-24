# Constants 常量系统指南

## 概述

`constants.tsx` 定义了应用的全局常量，包括配色方案和图标库。

## 目录结构

```
/constants.tsx          # 全局常量和图标库
```

## 设计语言

### Geek-Brutalism (极客新丑风)

项目采用极客新丑风设计语言，特点：
- 粗黑边框
- 硬核阴影
- 高对比度
- 极简主义
- 功能至上

### 配色方案

```typescript
export const COLORS = {
  primary: '#000000',    // 纯黑色 - 主要文字和边框
  secondary: '#FDE047',  // 明黄色 - Hover/Active 状态的点睛色
  bg: '#FFFFFF',         // 纯白色 - 背景色
  border: '#E5E7EB',     // 浅灰色 - 次要边框
};
```

#### 使用场景

- **primary (黑色)**：
  - 所有文字
  - 主要边框（2px - 4px）
  - 按钮背景
  - 图标颜色

- **secondary (黄色)**：
  - Hover 状态背景
  - Active 状态高亮
  - 重要提示标记
  - 进度条填充

- **bg (白色)**：
  - 页面背景
  - 卡片背景
  - 输入框背景

- **border (灰色)**：
  - 分隔线
  - 次要边框
  - 禁用状态

## 图标系统

### 技术选型

**图标库**: [lucide-react](https://lucide.dev/)

**选择理由**：
1. **一致性**：统一的设计风格，线条粗细一致
2. **现代化**：简洁清晰的现代图标设计
3. **可定制**：支持 size、color、strokeWidth 等属性
4. **轻量级**：Tree-shaking 友好，按需引入
5. **React 原生**：专为 React 优化的组件
6. **活跃维护**：持续更新，社区活跃

### 图标列表

#### 文件类型图标

```typescript
Icons.Folder        // 文件夹
Icons.File          // 通用文件
Icons.Image         // 图片文件
Icons.Video         // 视频文件
Icons.Audio         // 音频文件 (Music)
Icons.Code          // 代码文件 (Code2)
Icons.Pdf           // PDF 文件 (FileType)
Icons.Archive       // 压缩包
```

#### 操作图标

```typescript
Icons.Plus          // 添加/新建
Icons.Trash         // 删除 (Trash2)
Icons.Download      // 下载
Icons.Upload        // 上传
Icons.Search        // 搜索
Icons.Share         // 分享 (Share2)
Icons.Copy          // 复制
Icons.Edit          // 编辑
Icons.Move          // 移动
```

#### 导航图标

```typescript
Icons.ChevronRight  // 右箭头
Icons.Close         // 关闭 (X)
Icons.Grid3x3       // 网格视图
Icons.List          // 列表视图
Icons.More          // 更多选项 (MoreVertical)
```

#### 状态图标

```typescript
Icons.Lock          // 已加锁
Icons.Unlock        // 未加锁
Icons.Eye           // 显示
Icons.EyeOff        // 隐藏
Icons.Alert         // 警告 (AlertCircle)
Icons.Check         // 完成/确认
Icons.Loader        // 加载动画 (Loader2)
Icons.Grid          // 加载动画 (Loader2，向后兼容)
```

### 使用方法

#### 基础使用

```typescript
import { Icons } from './constants';

// 简单使用
<Icons.Folder />

// 自定义样式
<Icons.File className="w-6 h-6 text-red-500" />

// 旋转动画（用于加载状态）
<Icons.Loader className="w-8 h-8 animate-spin" />
<Icons.Grid className="w-8 h-8 animate-spin" />  // 向后兼容
```

#### 在组件中使用

```typescript
// FileItem.tsx
const iconKey = item.type === 'folder' ? 'Folder' : 'File';
const IconComponent = Icons[iconKey] || Icons.File;

return (
  <div className="flex items-center">
    <IconComponent className="w-5 h-5 mr-2" />
    <span>{item.name}</span>
  </div>
);
```

#### 动态图标选择

```typescript
// 根据文件类型选择图标
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Icons.Image;
  if (mimeType.startsWith('video/')) return Icons.Video;
  if (mimeType.startsWith('audio/')) return Icons.Audio;
  if (mimeType.includes('pdf')) return Icons.Pdf;
  return Icons.File;
};
```

### 图标命名映射

| 项目中的名称 | lucide-react 原名 | 说明 |
|------------|------------------|------|
| Audio | Music | 音乐/音频图标 |
| Code | Code2 | 代码文件图标 |
| Pdf | FileType | PDF文档图标 |
| Trash | Trash2 | 垃圾桶图标 |
| Close | X | 关闭/删除图标 |
| Grid | Loader2 | 加载动画（旋转） |
| Loader | Loader2 | 加载动画 |
| More | MoreVertical | 更多选项（竖向） |
| Share | Share2 | 分享图标 |
| Alert | AlertCircle | 警告提示图标 |

### 样式定制

#### 尺寸控制

```typescript
// Tailwind 类名
<Icons.File className="w-4 h-4" />   // 16px
<Icons.File className="w-5 h-5" />   // 20px
<Icons.File className="w-6 h-6" />   // 24px
<Icons.File className="w-8 h-8" />   // 32px
<Icons.File className="w-10 h-10" /> // 40px

// 自定义尺寸
<Icons.File className="w-12 h-12" /> // 48px
```

#### 颜色控制

```typescript
// 使用 text-* 类名
<Icons.File className="text-black" />
<Icons.File className="text-gray-500" />
<Icons.File className="text-red-500" />
<Icons.File className="text-yellow-400" />

// 使用 currentColor（继承父元素颜色）
<div className="text-red-500">
  <Icons.File />  {/* 自动为红色 */}
</div>
```

#### 动画效果

```typescript
// 旋转动画（加载状态）
<Icons.Loader className="animate-spin" />
<Icons.Grid className="animate-spin" />

// 弹跳动画
<Icons.Plus className="animate-bounce" />

// 脉冲动画
<Icons.Alert className="animate-pulse" />

// 自定义动画
<Icons.File className="transition-transform hover:scale-110" />
```

## 添加新图标

### 步骤

1. **查找图标**：访问 [lucide.dev](https://lucide.dev/) 查找需要的图标

2. **导入图标**：在 `constants.tsx` 中导入
   ```typescript
   import { 
     // ... 现有图标
     NewIcon  // 添加新图标
   } from 'lucide-react';
   ```

3. **添加到 Icons 对象**：
   ```typescript
   export const Icons = {
     // ... 现有图标
     NewIcon,  // 直接使用原名
     // 或
     CustomName: NewIcon  // 使用自定义名称
   };
   ```

4. **更新文档**：在本文档中添加新图标的说明

### 示例

假设要添加 Calendar 图标：

```typescript
// constants.tsx
import { 
  // ... 现有导入
  Calendar
} from 'lucide-react';

export const Icons = {
  // ... 现有图标
  Calendar
};
```

使用：
```typescript
<Icons.Calendar className="w-5 h-5" />
```

## 最佳实践

### 一致性

1. **尺寸标准化**：
   - 列表项图标：`w-4 h-4` 或 `w-5 h-5`
   - 按钮图标：`w-4 h-4`
   - 标题图标：`w-6 h-6`
   - 空状态图标：`w-16 h-16` 或更大

2. **颜色使用**：
   - 默认使用 `currentColor`（继承父元素）
   - 需要特殊颜色时明确指定
   - 保持高对比度

3. **间距处理**：
   ```typescript
   // 图标在文字左侧
   <div className="flex items-center">
     <Icons.File className="w-4 h-4 mr-2" />
     <span>文件名</span>
   </div>
   
   // 图标在文字右侧
   <div className="flex items-center">
     <span>文件名</span>
     <Icons.ChevronRight className="w-4 h-4 ml-2" />
   </div>
   ```

### 性能优化

1. **Tree-shaking**：
   - lucide-react 支持按需引入
   - 只导入实际使用的图标
   - 构建时自动移除未使用的图标

2. **避免内联 SVG**：
   - 使用 Icons 对象统一管理
   - 避免在组件中直接写 SVG 代码
   - 便于维护和替换

3. **组件缓存**：
   ```typescript
   // 在组件外部缓存图标组件
   const IconComponent = Icons.File;
   
   // 在渲染中使用
   return <IconComponent className="w-5 h-5" />;
   ```

### 可访问性

1. **添加语义**：
   ```typescript
   <Icons.File aria-hidden="true" />  // 装饰性图标
   <Icons.Alert aria-label="警告" />  // 语义图标
   ```

2. **与文字配合**：
   ```typescript
   <button>
     <Icons.Download className="w-4 h-4" />
     <span className="ml-2">下载</span>  // 提供文字说明
   </button>
   ```

## 迁移指南

### 从自定义 SVG 迁移到 lucide-react

**之前**（自定义 SVG）：
```typescript
export const Icons = {
  Folder: ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  )
};
```

**现在**（lucide-react）：
```typescript
import { Folder } from 'lucide-react';

export const Icons = {
  Folder
};
```

**优势**：
- ✅ 代码量减少 90%
- ✅ 图标风格统一
- ✅ 维护成本降低
- ✅ 性能更优（Tree-shaking）
- ✅ 更多图标可选（1000+ 图标）

### 兼容性说明

项目已完全迁移到 lucide-react，所有旧的自定义 SVG 图标已被替换。

**注意事项**：
- `Icons.Grid` 现在指向 `Loader2`（用于旋转动画）
- 实际的网格图标使用 `Icons.Grid3x3`
- 其他图标保持相同的 API，直接替换即可

## 参考资源

- [lucide-react 官方文档](https://lucide.dev/guide/packages/lucide-react)
- [lucide 图标库](https://lucide.dev/icons/)
- [React 图标最佳实践](https://react-icons.github.io/react-icons/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 更新日志

### 2024-12-24 (当前版本)
- ✨ 更新PDF图标为 FileType（更专业的文档图标）
- ✨ 新增PDF预览功能支持
- 📝 更新相关文档

### 2024-12
- ✨ 全面迁移到 lucide-react 图标库
- ✨ 添加 30+ 常用图标
- 📝 完善图标使用文档
- 🔧 优化图标命名和分类

### 之前版本
- 使用自定义 SVG 图标（13 个图标）

