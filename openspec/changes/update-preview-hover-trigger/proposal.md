# Change: 文件预览轮播改为悬停触发

## Why
当前文件列表中的视频预览帧会在页面加载后立即自动循环播放（每 300ms 切换一帧）。这会导致：
1. 视觉干扰：当列表中有多个视频文件时，所有预览同时播放造成视觉混乱
2. 性能浪费：即使用户未关注某个文件，预览也在不断更新 DOM
3. 用户体验不佳：缺乏明确的交互意图，用户可能对自动播放感到困扰

通过改为"悬停触发"，可以提供更清晰、更节省资源的交互体验。

## What Changes
- FilePreviewLoop 组件默认显示第一帧（`currentIndex = 0`），不自动播放
- 当鼠标悬停在文件卡片上时，开始循环播放预览帧（300ms 间隔）
- 鼠标移出时，停止播放并重置回第一帧
- 保持现有的图片预加载逻辑和加载状态不变

## Impact
- Affected specs: file-preview（新建）
- Affected code: 
  - `components/drive/FilePreviewLoop.tsx` - 添加播放控制逻辑
  - `components/drive/FileItem.tsx` - 传递 hover 状态到 FilePreviewLoop
- 用户体验：更清晰的交互反馈，减少视觉干扰
- 性能：减少不必要的 DOM 更新，降低 CPU 占用

