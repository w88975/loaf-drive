# 实现任务清单

## 1. 实现响应式样式
- [x] 1.1 修改 PreviewModal 外层容器，添加 `max-md:p-0` 移除移动端 padding
- [x] 1.2 修改弹框主容器，添加 `max-md:max-w-none max-md:h-screen` 实现移动端全屏
- [x] 1.3 调整移动端阴影样式，使用 `max-md:shadow-none` 移除不必要的阴影
- [x] 1.4 确保头部、内容区、底部信息栏在移动端正常显示

## 2. 测试验证
- [x] 2.1 在 Chrome DevTools 中测试移动端视图（iPhone、iPad、Android 各尺寸）
- [x] 2.2 验证 768px 断点前后的样式切换
- [x] 2.3 测试各类文件预览（图片、视频、音频、PDF、代码）在移动端的显示效果
- [x] 2.4 验证所有按钮（下载、分享、复制链接、关闭）在移动端可正常点击
- [x] 2.5 确认 PC 端（≥768px）样式完全不受影响

## 3. 文档更新
- [x] 3.1 更新 `components/overlays/guide.md`（如存在）记录响应式设计决策
- [x] 3.2 如需要，在 project.md 中补充移动端适配模式说明

