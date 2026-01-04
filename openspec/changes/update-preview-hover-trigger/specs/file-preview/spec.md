## ADDED Requirements

### Requirement: 文件预览轮播交互控制
文件列表中的视频预览轮播 MUST 支持通过外部 prop 控制播放状态，而非始终自动播放。

#### Scenario: 默认显示第一帧
- **WHEN** FilePreviewLoop 组件渲染且 `isPlaying` prop 为 `false` 或 `undefined`
- **THEN** 组件显示预览数组的第一帧（index 0）
- **AND** 不启动 interval 计时器
- **AND** 不触发帧切换

#### Scenario: 鼠标悬停触发播放
- **WHEN** 用户将鼠标悬停在包含 FilePreviewLoop 的文件卡片上
- **THEN** 父组件（FileItem）设置 hover 状态为 true
- **AND** 将 `isPlaying={true}` 传递给 FilePreviewLoop
- **AND** FilePreviewLoop 启动 300ms interval 循环播放所有预览帧

#### Scenario: 鼠标移出停止播放
- **WHEN** 用户将鼠标移出文件卡片
- **THEN** 父组件设置 hover 状态为 false
- **AND** 将 `isPlaying={false}` 传递给 FilePreviewLoop
- **AND** FilePreviewLoop 停止 interval 计时器
- **AND** 重置 currentIndex 为 0（显示第一帧）

#### Scenario: 移动端触摸设备
- **WHEN** 用户在触摸设备上浏览文件列表
- **THEN** 预览始终显示第一帧（因为触摸设备无 hover 状态）
- **AND** 不自动播放预览轮播

#### Scenario: 多个文件卡片的独立状态
- **WHEN** 页面中有多个包含预览的文件卡片
- **THEN** 每个卡片的播放状态独立管理
- **AND** 仅当前 hover 的卡片播放预览
- **AND** 其他卡片保持显示第一帧

### Requirement: 保持图片预加载机制
FilePreviewLoop 组件 MUST 保持现有的图片预加载逻辑不变，与播放控制无关。

#### Scenario: 预加载所有预览帧
- **WHEN** FilePreviewLoop 组件挂载且接收到 `previews` 数组
- **THEN** 组件使用 Promise.all 预加载所有图片到内存
- **AND** 在加载完成前显示 loading 状态
- **AND** 加载完成后才允许播放（如果 `isPlaying` 为 true）

