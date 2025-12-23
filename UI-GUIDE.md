# 🎨 GeekDrive UI 设计指南 (极客新丑风)

本指南旨在引导 AI Agent 在开发 GeekDrive 时保持统一的 **极客新丑风 (Geek-Brutalism)** 审美。这种风格强调功能性、高对比度和原始的工业感。

---

## 🏗️ 1. 核心设计原则

1.  **功能优先**：不要隐藏交互元素，所有操作应直观且具有物理感。
2.  **硬核边框**：放弃圆角和渐变，使用粗重的黑色实线边框。
3.  **非侵入性阴影**：不使用模糊阴影，只使用具有位移的 100% 不透明度黑色色块阴影。
4.  **极高对比度**：纯黑 (#000000)、纯白 (#FFFFFF) 与明黄 (#FDE047) 的碰撞。
5.  **排版力量**：大量使用等宽字体 (JetBrains Mono) 和全大写英文字符。

---

## 🎨 2. 色彩规范 (Color Palette)

| 用途 | HEX 代码 | Tailwind 类名 | 说明 |
| :--- | :--- | :--- | :--- |
| **主背景** | `#FFFFFF` | `bg-white` | 全局背景，保持洁净。 |
| **主色/文字** | `#000000` | `text-black` | 边框、文字、主要按钮。 |
| **点睛色** | `#FDE047` | `bg-yellow-400` | Hover 状态、Active 状态、标题栏。 |
| **警告色** | `#DC2626` | `bg-red-600` | 删除操作、错误提示。 |
| **次要信息** | `#9CA3AF` | `text-gray-400` | 辅助文字、禁用状态。 |

---

## 📐 3. 布局与尺寸 (Layout & Dimensions)

### 核心间距
*   **网格单元**：基于 `4px` (Tailwind `1` 单位)。
*   **容器内边距**：移动端 `p-4` (16px)，桌面端 `p-6` (24px)。
*   **组件间距**：网格视图 `gap-4` (16px)。

### 组件尺寸
*   **Header 高度**：`h-16` (64px)。
*   **Sidebar 宽度**：`w-64` (256px)。
*   **网格缩略图**：最小宽度 `150px`。
*   **模态框宽度**：常规 `max-w-sm` (384px)，大型预览 `max-w-5xl` (1024px)。

---

## 🧱 4. UI 组件规范 (Component Specs)

### 🔲 边框与阴影 (Borders & Shadows)
这是风格的灵魂。所有 UI 元素必须遵循：
*   **边框**：`border-2 border-black` 或 `border-4 border-black`。
*   **圆角**：`rounded-none` (禁止使用圆角)。
*   **硬阴影**：
    *   按钮/菜单：`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
    *   模态框：`shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]` 或 `shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]`

### 🖱️ 按钮 (Buttons)
*   **基础态**：白底黑字 + 粗黑边。
*   **悬停态 (Hover)**：`hover:bg-yellow-400`。
*   **按下态 (Active)**：`active:scale-95`。
*   **文字**：`font-bold uppercase italic`。

### ⌨️ 输入框 (Inputs)
*   **样式**：`border-2 border-black p-3 outline-none`。
*   **聚焦态 (Focus)**：`focus:bg-yellow-100`。
*   **文字**：`font-bold uppercase tracking-widest`。

### 🖼️ 文件项 (File Items)
*   **网格态**：`aspect-square` 比例，封面图充满 `p-1` 的留白。
*   **选中态**：`bg-yellow-200 ring-4 ring-black`。
*   **视频预览**：覆盖层使用 `bg-black/40`。

---

## 🔡 5. 字体排印 (Typography)

*   **UI 标签/数据**：使用 `font-mono` (JetBrains Mono)。
*   **正文/阅读**：使用 `font-sans` (Inter)。
*   **层级**：
    *   标题：`text-lg font-bold uppercase italic tracking-tighter`
    *   元数据：`text-[8px] font-black uppercase text-gray-400`

---

## 🎞️ 6. 交互动效 (Animation)

*   **切换时间**：全局统一使用 `duration-150` 或 `duration-200`。
*   **缓动函数**：使用 `ease-in-out`。
*   **特殊效果**：
    *   **脉冲**：`animate-pulse` 用于上传中。
    *   **旋转**：`animate-spin` 用于加载中。
    *   **滑入**：`animate-in slide-in-from-bottom` 用于 SelectionBar。

---

## 📱 7. 响应式准则 (Responsive)

*   **移动端 (320px - 767px)**：
    *   侧边栏转为 `fixed` 抽屉。
    *   面包屑导航截断为仅显示当前级。
    *   隐藏“修改时间”列。
*   **平板端 (768px - 1023px)**：
    *   网格变为 4 列。
*   **桌面端 (1024px+)**：
    *   开启 Hover 特效。
    *   全功能右键菜单。

---
**记住：如果它看起来太“现代”或太“圆润”，请加粗它的边框并把它变黄。**