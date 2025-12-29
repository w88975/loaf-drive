# Video 视频组件指南

## 目录结构

```
components/video/
└── CanvasVideo.tsx    # 高性能视频播放器组件（HLS + Canvas 渲染）
```

## 设计理念

### 职责定位
video 目录包含视频播放相关的专用组件，提供高性能、功能完整的视频播放解决方案。

### 核心特性
- **HLS 流媒体支持**：使用 HLS.js 实现分段加载
- **Canvas 渲染**：通过虚拟 video 元素解码，Canvas 输出
- **积极的内存管理**：严格控制缓冲区大小，防止内存泄漏
- **完整的播放器控制**：播放/暂停、进度条、音量、全屏
- **极客新丑风格 UI**：符合项目整体设计风格

---

## CanvasVideo.tsx - 高性能视频播放器

### 功能概述
CanvasVideo 是一个功能完整的视频播放器组件，支持 HLS 流媒体和多种视频格式，通过 Canvas 渲染实现高性能播放，并提供符合项目风格的完整控制界面。

### Props 接口

```typescript
interface CanvasVideoProps {
  src: string | File;                           // 视频源（URL 或本地 File 对象）
  autoplay?: boolean;                           // 是否自动播放（默认 false）
  loop?: boolean;                               // 是否循环播放（默认 false）
  className?: string;                           // 自定义样式类名
  onReady?: (info: any) => void;               // 视频就绪回调
  onPlay?: () => void;                         // 播放回调
  onPause?: () => void;                        // 暂停回调
  onEnd?: () => void;                          // 播放结束回调
  onError?: (error: string) => void;           // 错误回调
  onProgress?: (currentTime: number, duration: number) => void;  // 播放进度回调
}
```

### Ref 接口

```typescript
interface CanvasVideoRef {
  play: () => void;              // 播放方法
  pause: () => void;             // 暂停方法
  seek: (time: number) => void;  // 跳转到指定时间
  currentTime: number;           // 当前播放时间
  duration: number;              // 视频总时长
  isPlaying: boolean;            // 是否正在播放
}
```

### 核心技术实现

#### 1. HLS 流媒体支持

```typescript
// 动态加载 HLS.js
const loadHlsScript = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Hls) {
      resolve((window as any).Hls);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.onload = () => resolve((window as any).Hls);
    script.onerror = () => reject(new Error("Failed to load HLS engine."));
    document.head.appendChild(script);
  });
};

// HLS 配置（积极的内存管理）
const hls = new Hls({
  maxBufferLength: 10,          // 最大前向缓冲 10 秒
  maxMaxBufferLength: 20,       // 绝对最大缓冲长度
  backBufferLength: 5,          // 后向缓冲保留 5 秒
  maxBufferSize: 30 * 1000 * 1000,  // 缓冲上限 30MB
  enableWorker: true,           // 使用 Worker 线程解码
});
```

#### 2. Canvas 渲染循环

```typescript
const renderLoop = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  
  if (video && canvas && !video.paused) {
    const ctx = canvas.getContext("2d", {
      alpha: false,           // 禁用透明通道，提升性能
      desynchronized: true,   // 异步渲染，减少延迟
    });
    
    if (ctx) {
      // 自动调整 Canvas 尺寸匹配视频
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      // 绘制当前帧
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCurrentTime(video.currentTime);
      onProgress?.(video.currentTime, video.duration);
    }
  }
  
  animationFrameRef.current = requestAnimationFrame(renderLoop);
};
```

#### 3. 资源清理

```typescript
const cleanup = () => {
  // 取消渲染循环
  cancelAnimationFrame(animationFrameRef.current);
  
  // 清理控制栏定时器
  if (controlsTimeoutRef.current) {
    clearTimeout(controlsTimeoutRef.current);
  }

  // 销毁 HLS 实例
  if (hlsRef.current) {
    hlsRef.current.destroy();
    hlsRef.current = null;
  }

  // 清理 video 元素
  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.removeAttribute("src");
    videoRef.current.load();
    videoRef.current = null;
  }
};
```

---

### 播放器控制功能

#### 1. 播放/暂停控制

```typescript
const handlePlayPause = () => {
  if (videoRef.current?.paused) {
    videoRef.current?.play();
  } else {
    videoRef.current?.pause();
  }
};
```

- **点击 Canvas 播放**：点击视频画面切换播放状态
- **控制按钮**：专用播放/暂停按钮
- **图标切换**：根据播放状态显示 Play 或 Pause 图标

#### 2. 进度条控制

```typescript
const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!videoRef.current || !duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  videoRef.current.currentTime = pos * duration;
  setCurrentTime(pos * duration);
};
```

- **点击跳转**：点击进度条任意位置快速跳转
- **拖动支持**：支持拖动进度手柄
- **视觉反馈**：黄色进度指示器 + 悬停时显示手柄

#### 3. 音量控制

```typescript
const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newVolume = parseFloat(e.target.value);
  setVolume(newVolume);
  if (videoRef.current) {
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    setIsMuted(newVolume === 0);
  }
};

const toggleMute = () => {
  if (videoRef.current) {
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }
};
```

- **静音切换**：一键静音/取消静音
- **音量滑块**：悬停音量按钮展开滑块
- **范围控制**：0-100% 连续音量调节

#### 4. 全屏控制

```typescript
const toggleFullscreen = () => {
  if (!containerRef.current) return;
  
  if (!document.fullscreenElement) {
    containerRef.current.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
```

- **全屏切换**：支持进入/退出全屏
- **状态监听**：监听全屏变化事件同步 UI
- **图标切换**：根据全屏状态显示不同图标

#### 5. 自动隐藏控制栏

```typescript
const handleMouseMove = () => {
  setShowControls(true);
  if (controlsTimeoutRef.current) {
    clearTimeout(controlsTimeoutRef.current);
  }
  controlsTimeoutRef.current = setTimeout(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, 3000);
};
```

- **自动隐藏**：播放时 3 秒无操作自动隐藏
- **鼠标唤醒**：鼠标移动重新显示控制栏
- **暂停保持**：暂停时控制栏保持显示

---

### UI 风格设计（极客新丑风）

#### 加载状态

```tsx
<div className="flex flex-col items-center gap-4 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
  <div className="w-12 h-12 border-4 border-black border-t-yellow-400 animate-spin"></div>
  <span className="text-[10px] uppercase tracking-widest text-black font-bold font-mono">
    Loading Video
  </span>
</div>
```

- **白色卡片**：白底黑边，8px 硬核阴影
- **旋转加载器**：黑色边框，顶部黄色点缀
- **等宽字体**：大写加粗的加载提示

#### 进度条

```tsx
<div className="h-3 bg-gray-200 border-b-2 border-black cursor-pointer relative group">
  <div 
    className="h-full bg-yellow-400 border-r-2 border-black"
    style={{ width: `${(currentTime / duration) * 100}%` }}
  />
  <div 
    className="absolute w-4 h-4 bg-black border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100"
  />
</div>
```

- **灰色背景**：未播放部分为浅灰色
- **黄色进度**：已播放部分为明黄色（#FDE047）
- **黑色分隔**：进度条右侧黑色边框
- **悬停手柄**：黑色方块 + 白色边框 + 2px 硬核阴影

#### 控制按钮

```tsx
<button className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black hover:bg-yellow-400 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
  <Play className="w-5 h-5" fill="black" />
</button>
```

- **尺寸**：40x40px 方形按钮
- **边框**：2px 纯黑边框
- **阴影**：2px 偏移硬核阴影
- **悬停**：黄色背景 `bg-yellow-400`
- **按压**：缩小到 95% `active:scale-95`
- **图标**：黑色填充，lucide-react 图标

#### 音量滑块

```tsx
<input
  type="range"
  className="w-24 h-2 bg-gray-200 border-2 border-black appearance-none cursor-pointer
    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
    [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
    [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
/>
```

- **轨道**：灰色背景 + 2px 黑色边框
- **手柄**：4x4px 黑色方块
- **手柄边框**：2px 白色边框
- **手柄阴影**：2px 硬核阴影
- **无圆角**：完全方正设计

#### 时间显示

```tsx
<div className="font-mono font-bold text-xs uppercase tracking-wider">
  00:42 / 03:25
</div>
```

- **等宽字体**：`font-mono` (JetBrains Mono)
- **粗体大写**：`font-bold uppercase`
- **字母间距**：`tracking-wider` 增加可读性
- **格式**：MM:SS / MM:SS

---

### 性能优化

#### 1. 内存管理
- **严格的缓冲限制**：前向 10s，后向 5s，总上限 30MB
- **及时资源释放**：组件卸载时清理所有引用
- **HLS 实例销毁**：正确调用 `hls.destroy()`

#### 2. 渲染优化
- **Canvas 优化配置**：`alpha: false`, `desynchronized: true`
- **requestAnimationFrame**：使用浏览器原生渲染循环
- **条件渲染**：暂停时停止 Canvas 更新

#### 3. Worker 线程
- **HLS Worker**：`enableWorker: true` 解码不阻塞主线程
- **异步初始化**：HLS.js 动态加载不阻塞首屏

---

### 使用示例

#### 基础使用

```tsx
import CanvasVideo from '../video/CanvasVideo';

<CanvasVideo 
  src="https://example.com/video.mp4" 
  autoplay={false}
  className="w-full h-full"
/>
```

#### HLS 流媒体

```tsx
<CanvasVideo 
  src="https://example.com/stream.m3u8" 
  autoplay={true}
  loop={false}
  onReady={(info) => console.log('Duration:', info.duration)}
  onError={(error) => console.error('Error:', error)}
/>
```

#### 使用 Ref 控制

```tsx
const videoRef = useRef<CanvasVideoRef>(null);

<CanvasVideo 
  ref={videoRef}
  src="video.mp4" 
/>

<button onClick={() => videoRef.current?.play()}>播放</button>
<button onClick={() => videoRef.current?.pause()}>暂停</button>
<button onClick={() => videoRef.current?.seek(30)}>跳转到 30 秒</button>
```

#### 本地文件播放

```tsx
const [file, setFile] = useState<File | null>(null);

<input 
  type="file" 
  accept="video/*"
  onChange={(e) => setFile(e.target.files?.[0] || null)}
/>

{file && <CanvasVideo src={file} autoplay={true} />}
```

---

### 支持的视频格式

| 格式 | 扩展名 | 浏览器支持 | HLS 支持 |
|------|--------|-----------|----------|
| MP4 | .mp4 | ✅ 所有现代浏览器 | ❌ 直接播放 |
| WebM | .webm | ✅ Chrome/Firefox | ❌ 直接播放 |
| OGG | .ogg | ✅ Firefox | ❌ 直接播放 |
| HLS | .m3u8 | ✅ Safari 原生 | ✅ HLS.js |
| MOV | .mov | ⚠️ 部分支持 | ❌ 直接播放 |

---

### 浏览器兼容性

| 浏览器 | 版本要求 | Canvas 渲染 | HLS 支持 | 全屏支持 |
|--------|----------|------------|----------|----------|
| Chrome | 90+ | ✅ | ✅ HLS.js | ✅ |
| Firefox | 88+ | ✅ | ✅ HLS.js | ✅ |
| Safari | 14+ | ✅ | ✅ 原生 | ✅ |
| Edge | 90+ | ✅ | ✅ HLS.js | ✅ |

---

### 注意事项

#### 自动播放限制
- **浏览器策略**：大多数浏览器要求自动播放必须静音
- **解决方案**：autoplay 时自动设置 `muted: true`
- **用户控制**：提供音量按钮让用户手动打开声音

#### 跨域资源
- **CORS 问题**：Canvas 渲染需要视频资源支持 CORS
- **解决方案**：确保视频服务器返回正确的 CORS 头
- **错误处理**：捕获并提示 CORS 错误

#### 移动端适配
- **全屏播放**：iOS 需要 `playsInline` 属性
- **触摸支持**：控制按钮有足够的点击区域（40x40px）
- **性能考虑**：移动端可能需要降低视频质量

#### 内存泄漏防护
- **组件卸载**：确保调用 cleanup 清理所有资源
- **事件监听器**：移除所有事件监听器
- **定时器清理**：清理所有 setTimeout/setInterval

---

### 最佳实践

1. **提供加载状态**：使用 `onReady` 回调显示加载完成
2. **错误处理**：使用 `onError` 回调处理播放错误
3. **进度追踪**：使用 `onProgress` 回调实现自定义进度显示
4. **资源预加载**：对于重要视频可以提前初始化
5. **响应式设计**：使用 `className` 传入响应式类名
6. **可访问性**：考虑添加键盘快捷键支持（空格播放/暂停等）

---

## 扩展指南

### 添加新功能
1. **倍速播放**：添加 `playbackRate` 控制
2. **画中画**：集成 Picture-in-Picture API
3. **字幕支持**：添加 WebVTT 字幕轨道
4. **截图功能**：使用 Canvas 导出当前帧
5. **播放列表**：支持多个视频连续播放

### 自定义样式
- 通过 `className` 传入自定义样式
- 修改内部 Tailwind 类名适配不同主题
- 保持极客新丑风格的核心元素（黑边框、硬核阴影、黄色点缀）

---

**记住：这是一个高性能、功能完整且风格独特的视频播放器组件！**

