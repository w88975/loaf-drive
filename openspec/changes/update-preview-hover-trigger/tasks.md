## 1. 实现

- [x] 1.1 修改 `FilePreviewLoop.tsx`：添加 `isPlaying` prop 控制播放状态
- [x] 1.2 修改 `FilePreviewLoop.tsx`：当 `isPlaying` 为 false 时，始终显示第一帧（`currentIndex = 0`）
- [x] 1.3 修改 `FilePreviewLoop.tsx`：仅在 `isPlaying` 为 true 时启动 interval 轮播
- [x] 1.4 修改 `FileItem.tsx`：在网格视图中添加 hover 状态管理
- [x] 1.5 修改 `FileItem.tsx`：将 hover 状态作为 `isPlaying` prop 传递给 `FilePreviewLoop`
- [ ] 1.6 测试：验证鼠标悬停时预览开始播放
- [ ] 1.7 测试：验证鼠标移出时预览停止并重置到第一帧
- [ ] 1.8 测试：验证多个文件卡片的 hover 状态互不干扰

## 2. 验证

- [ ] 2.1 浏览器测试：Chrome、Firefox、Safari 验证 hover 交互
- [ ] 2.2 移动端测试：确认触摸设备上的行为（建议保持默认不播放）
- [ ] 2.3 性能测试：确认 CPU 占用相比之前有所降低

