# Preview 预览组件指南

## 目录结构

```
components/preview/
├── PreviewContent.tsx      # 预览器分发器（策略模式）
├── ImageViewer.tsx         # 图片查看器
├── VideoViewer.tsx         # 视频播放器
├── AudioViewer.tsx         # 音频播放器
├── TextViewer.tsx          # 代码/文本查看器
├── PDFViewer.tsx           # PDF文档查看器
└── UnsupportedViewer.tsx   # 不支持格式的兜底组件
```

## 设计理念

### 职责定位
preview 目录包含所有文件预览器组件，负责：
- 根据文件类型选择合适的查看器
- 提供多种文件格式的预览能力（图片、视频、音频、文本、PDF等）
- 不支持的格式提供下载或文本查看兜底

### 设计模式
- **策略模式**：PreviewContent 作为策略分发器
- **统一接口**：所有查看器接收相同的 Props
- **渐进增强**：优先预览，失败则提供兜底方案

## 核心组件详解

### PreviewContent.tsx - 预览器分发器

#### 功能概述
根据文件的 MIME 类型或扩展名选择合适的预览器组件，是预览系统的核心调度器。

#### Props 接口
```typescript
interface PreviewContentProps {
  item: DriveItem  // 要预览的文件
}
```

#### 分发策略
```typescript
const PreviewContent: React.FC<PreviewContentProps> = ({ item }) => {
  const mimeType = item.mimeType || '';
  const extension = item.extension?.toLowerCase() || '';
  
  // 1. 图片类型
  if (mimeType.startsWith('image/') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return <ImageViewer item={item} />;
  }
  
  // 2. 视频类型
  if (mimeType.startsWith('video/') || 
      ['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
    return <VideoViewer item={item} />;
  }
  
  // 3. 音频类型
  if (mimeType.startsWith('audio/') || 
      ['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(extension)) {
    return <AudioViewer item={item} />;
  }
  
  // 4. 文本/代码类型
  if (mimeType.startsWith('text/') || 
      ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'html', 
       'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'yaml', 'xml'].includes(extension)) {
    return <TextViewer item={item} />;
  }
  
  // 5. PDF文档
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return <PDFViewer item={item} />;
  }
  
  // 6. 不支持的格式
  return <UnsupportedViewer item={item} />;
};
```

#### 设计要点
- **优先 MIME 类型**：更准确的类型判断
- **兜底扩展名**：MIME 缺失时使用扩展名
- **双重匹配**：同时检查两者，提高识别率
- **默认兜底**：不支持的格式统一处理

---

### ImageViewer.tsx - 图片查看器

#### 功能特性
- 响应式图片显示
- 自适应窗口大小
- 保持宽高比
- 加载失败兜底

#### Props 接口
```typescript
interface ImageViewerProps {
  item: DriveItem
}
```

#### 实现要点
```typescript
const ImageViewer: React.FC<ImageViewerProps> = ({ item }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return <UnsupportedViewer item={item} />;
  }
  
  return (
    <div className="image-viewer">
      <img 
        src={item.url}
        alt={item.name}
        onError={() => setError(true)}
        className="max-w-full max-h-full object-contain"
        style={{
          boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)'
        }}
      />
    </div>
  );
};
```

#### 样式特性
- **object-contain**：保持比例，完整显示
- **黑色阴影**：8px 硬核阴影
- **居中对齐**：flex 布局居中
- **最大尺寸**：不超过容器

---

### VideoViewer.tsx - 视频播放器

#### 功能特性
- HTML5 原生视频播放
- 自动播放（可选）
- 播放控制条
- 全屏支持
- 倍速播放

#### Props 接口
```typescript
interface VideoViewerProps {
  item: DriveItem
}
```

#### 实现要点
```typescript
const VideoViewer: React.FC<VideoViewerProps> = ({ item }) => {
  return (
    <div className="video-viewer">
      <video 
        src={item.url}
        controls
        autoPlay
        playsInline
        className="max-w-full max-h-full"
        style={{
          backgroundColor: '#000',
          boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)'
        }}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
};
```

#### 播放器特性
- **controls**：显示播放控制条
- **autoPlay**：自动播放（静音）
- **playsInline**：iOS 内联播放
- **黑色背景**：视频周围填充黑色

#### 支持格式
- MP4 (H.264/H.265)
- WebM (VP8/VP9)
- OGG (Theora)
- MOV (部分支持)

---

### AudioViewer.tsx - 音频播放器

#### 功能特性
- 原生音频播放器
- **旋转唱片动画**：视觉反馈
- 播放控制
- 进度显示
- 音量控制

#### Props 接口
```typescript
interface AudioViewerProps {
  item: DriveItem
}
```

#### 实现要点
```typescript
const AudioViewer: React.FC<AudioViewerProps> = ({ item }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  return (
    <div className="audio-viewer">
      {/* 旋转唱片动画 */}
      <div className={`record ${isPlaying ? 'spinning' : ''}`}>
        <div className="record-inner">
          <Icons.Audio />
        </div>
      </div>
      
      {/* 音频元素 */}
      <audio 
        ref={audioRef}
        src={item.url}
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full max-w-md"
      />
      
      {/* 文件信息 */}
      <div className="audio-info">
        <p className="font-bold">{item.name}</p>
        <p className="text-sm">{formatSize(item.size)}</p>
      </div>
    </div>
  );
};
```

#### 旋转动画实现
```css
.record {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(to bottom, #333, #000);
  border: 4px solid #000;
  position: relative;
  transition: transform 0.3s ease;
}

.record.spinning {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.record-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### 支持格式
- MP3
- WAV
- FLAC
- AAC
- M4A
- OGG Vorbis

---

### PDFViewer.tsx - PDF文档查看器

#### 功能特性
- 浏览器原生PDF查看
- 无需额外依赖
- 支持缩放、搜索、打印
- 完整PDF功能支持

#### Props 接口
```typescript
interface PDFViewerProps {
  item: DriveItem
}
```

#### 实现要点
```typescript
const PDFViewer: React.FC<PDFViewerProps> = ({ item }) => {
  return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <iframe
        src={item.url}
        title={item.name}
        className="w-full h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      />
    </div>
  );
};
```

#### 技术方案
- **iframe嵌入**：使用iframe加载PDF文件
- **浏览器原生**：利用浏览器内置PDF查看器
- **零依赖**：不需要pdf.js等第三方库
- **全功能**：支持所有浏览器原生功能

#### 优势
- ✅ 零额外依赖，打包体积小
- ✅ 所有现代浏览器内置支持
- ✅ 完整的PDF交互功能
- ✅ 性能优秀，渲染快速

#### 注意事项
- ⚠️ 需要正确的CORS头配置
- ⚠️ 需要允许iframe嵌入（X-Frame-Options）
- ⚠️ 部分旧版浏览器可能不支持

#### 样式特性
- **极客新丑风**：黑色粗边框 + 硬核阴影
- **全屏显示**：充分利用预览空间
- **响应式**：自适应窗口大小

---

### TextViewer.tsx - 代码/文本查看器

#### 功能特性
- 语法高亮（highlight.js）
- 自动识别编程语言
- 行号显示
- 可复制内容
- 支持大文件（流式加载）

#### Props 接口
```typescript
interface TextViewerProps {
  item: DriveItem
  forceText?: boolean  // 强制文本模式（用于 PDF 等）
}
```

#### 实现要点
```typescript
const TextViewer: React.FC<TextViewerProps> = ({ item, forceText }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // 获取文件内容
    // 如果文件在加密文件夹中，需要从 localStorage 读取缓存的密码
    const fetchContent = async () => {
      const headers: Record<string, string> = {};
      
      // 读取加密文件夹密码（从 localStorage 永久缓存）
      if (item.parentId) {
        try {
          const stored = localStorage.getItem('geek_drive_folder_passwords');
          if (stored) {
            const passwords = JSON.parse(stored);
            if (passwords[item.parentId]) {
              headers['x-folder-password'] = passwords[item.parentId];
            }
          }
        } catch (e) {
          console.warn('Failed to read password cache', e);
        }
      }
      
      try {
        const response = await fetch(item.url, { headers });
        const text = await response.text();
        setContent(text);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [item.url, item.parentId]);
  
  // 语法高亮
  useEffect(() => {
    if (content && !forceText) {
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block as HTMLElement);
      });
    }
  }, [content, forceText]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <UnsupportedViewer item={item} />;
  
  return (
    <div className="text-viewer">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-[80vh]">
        <code className={!forceText ? `language-${item.extension}` : ''}>
          {content}
        </code>
      </pre>
    </div>
  );
};
```

#### 语言识别
```typescript
// 根据扩展名映射到 highlight.js 语言名
const languageMap: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'jsx': 'javascript',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'cpp': 'cpp',
  'c': 'c',
  'java': 'java',
  'sh': 'bash',
  // ... 更多映射
};

const language = languageMap[item.extension] || item.extension;
```

#### 支持语言
- JavaScript/TypeScript
- Python
- Java
- C/C++
- Rust
- Go
- Ruby
- Shell
- HTML/CSS
- JSON/YAML/XML
- Markdown
- 更多...

---

### UnsupportedViewer.tsx - 兜底查看器

#### 功能特性
- 显示不支持提示
- 提供下载按钮
- 提供"尝试文本查看"选项
- 显示文件元信息

#### Props 接口
```typescript
interface UnsupportedViewerProps {
  item: DriveItem
}
```

#### 实现要点
```typescript
const UnsupportedViewer: React.FC<UnsupportedViewerProps> = ({ item }) => {
  const [tryText, setTryText] = useState(false);
  
  if (tryText) {
    return <TextViewer item={item} forceText />;
  }
  
  return (
    <div className="unsupported-viewer">
      <div className="icon">
        <Icons.File className="w-24 h-24" />
      </div>
      
      <h3 className="font-bold text-xl">Preview Not Available</h3>
      <p className="text-gray-600">
        This file type is not supported for preview
      </p>
      
      <div className="file-info">
        <p><strong>Name:</strong> {item.name}</p>
        <p><strong>Type:</strong> {item.mimeType || 'Unknown'}</p>
        <p><strong>Size:</strong> {formatSize(item.size)}</p>
      </div>
      
      <div className="actions">
        <a 
          href={item.url} 
          download={item.name}
          className="btn-primary"
        >
          <Icons.Download />
          Download File
        </a>
        
        <button 
          onClick={() => setTryText(true)}
          className="btn-secondary"
        >
          Try Text View
        </button>
      </div>
    </div>
  );
};
```

#### 兜底策略
1. 显示不支持提示
2. 提供下载选项
3. 提供文本查看尝试
4. 显示文件基本信息

---

## 预览器选择流程

```
文件
  ↓
PreviewContent 分发器
  ↓
检查 MIME 类型 / 扩展名
  ├─ image/* → ImageViewer
  ├─ video/* → VideoViewer
  ├─ audio/* → AudioViewer
  ├─ text/*  → TextViewer
  ├─ .pdf    → PDFViewer
  └─ 其他
       ↓
    检查扩展名
      ├─ 已知扩展 → 对应 Viewer
      └─ 未知扩展 → UnsupportedViewer
```

---

## 性能优化

### 大文件处理
- 视频：使用流式播放，不预加载
- 音频：使用流式播放
- 文本：限制显示前 100KB，提供"查看更多"
- 图片：使用预览图，点击查看原图

### 懒加载
- 图片：Intersection Observer 延迟加载
- 视频：preload="metadata" 只加载元数据
- 文本：分页加载或虚拟滚动

### 内存管理
- 关闭预览时释放资源
- 视频/音频：暂停并清理
- 大文本：清除 DOM 引用

---

## 最佳实践

### 错误处理
- 所有 Viewer 都要有错误兜底
- 加载失败显示 UnsupportedViewer
- 提供清晰的错误信息

### 用户体验
- 加载状态及时反馈
- 大文件显示进度
- 控制器易于操作
- 支持键盘快捷键

### 可访问性
- 图片有 alt 属性
- 视频有字幕轨道（可选）
- 音频有播放状态提示
- 键盘可操作

---

## 扩展指南

### 添加新的预览器
1. 创建新的 Viewer 组件
2. 实现统一的 Props 接口
3. 在 PreviewContent 中添加分发逻辑
4. 测试各种边界情况

### 支持新的文件类型
1. 更新 PreviewContent 的分发策略
2. 添加对应的 MIME 类型或扩展名
3. 选择或创建合适的 Viewer
4. 测试预览效果

### 集成第三方库
- **PDF 预览**：已实现（浏览器原生支持）
- **Office 文档**：Office Online Viewer API
- **3D 模型**：Three.js
- **Markdown**：marked + highlight.js

---

## 注意事项

### 浏览器兼容性
- 视频格式：优先使用 MP4 (H.264)
- 音频格式：优先使用 MP3
- 图片格式：WebP 需要兼容性检查
- 代码高亮：highlight.js 兼容所有现代浏览器

### 安全考虑
- 用户上传的内容不可信
- HTML/SVG 可能包含 XSS
- 使用 Content-Security-Policy
- 沙箱化预览（iframe）

### 性能警告
- 大图片可能占用大量内存
- 4K 视频可能卡顿
- 大文本文件可能阻塞渲染
- 语法高亮可能耗时

### 移动端适配
- 触摸手势支持
- 全屏播放体验
- 控制器大小适配
- 性能优化（降低质量）

