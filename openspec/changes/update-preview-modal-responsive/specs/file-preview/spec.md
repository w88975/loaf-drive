## ADDED Requirements

### Requirement: 文件预览弹框响应式布局
文件预览弹框 MUST 根据屏幕尺寸提供不同的布局模式：PC端居中弹框，移动端全屏显示。

#### Scenario: PC端居中弹框（≥768px）
- **WHEN** 用户在屏幕宽度 ≥768px 的设备上打开文件预览
- **THEN** PreviewModal 以居中弹框形式显示
- **AND** 弹框最大宽度为 `max-w-5xl`（1024px）
- **AND** 弹框高度为 `h-[90vh]`
- **AND** 背景遮罩使用 `bg-black/80 backdrop-blur-sm`
- **AND** 弹框四周有 padding（`p-4`）
- **AND** 弹框带有硬阴影 `shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]`

#### Scenario: 移动端全屏显示（<768px）
- **WHEN** 用户在屏幕宽度 <768px 的设备上打开文件预览
- **THEN** PreviewModal 全屏显示
- **AND** 弹框宽度为 100%（移除 `max-w-5xl` 限制）
- **AND** 弹框高度为 `h-screen`（100vh）
- **AND** 外层容器无 padding（`p-0`）
- **AND** 不显示阴影（`shadow-none`）
- **AND** 背景遮罩保持不变

#### Scenario: 响应式断点切换
- **WHEN** 用户调整浏览器窗口大小跨越 768px 断点
- **THEN** 预览弹框样式自动切换（PC 模式 ↔ 移动模式）
- **AND** 预览内容和功能按钮保持正常工作
- **AND** 无需刷新页面

#### Scenario: 移动端交互保持完整
- **WHEN** 用户在移动端全屏预览文件
- **THEN** 所有功能按钮（下载、分享、复制链接、关闭）正常显示和可点击
- **AND** 顶部文件名和底部文件信息正常显示
- **AND** 预览内容区域自适应占据剩余空间
- **AND** 点击背景遮罩或关闭按钮可正常关闭预览

#### Scenario: 保持现有功能不变
- **WHEN** 实现响应式布局后
- **THEN** 所有现有功能保持不变：
  - 文件预览渲染逻辑（PreviewContent）
  - 下载功能（直接下载或通过 onDownload 回调）
  - 分享功能（ShareModal 弹出逻辑）
  - 复制链接功能
  - 关闭弹框逻辑
- **AND** 无破坏性变更

