# GeekDrive 构建与部署指南

## 构建配置

### 技术栈
- **构建工具**: Vite 5.x
- **CSS 框架**: Tailwind CSS 3.x（本地化）
- **TypeScript**: 5.x
- **包管理器**: pnpm 10.x

### 目录结构

```
/
├── public/                    # 静态资源目录（构建时自动复制到 dist）
│   ├── fonts/                # 本地字体文件
│   │   ├── inter-var.woff2           # Inter 可变字体
│   │   └── jetbrains-mono-var.woff2  # JetBrains Mono 可变字体
│   ├── css/                  # 本地 CSS 资源
│   │   └── highlight.css             # Highlight.js 代码高亮样式
│   └── service-worker.js     # Service Worker 脚本
├── src/                      # 源代码目录
│   └── index.css            # Tailwind CSS 入口文件
├── tailwind.config.js        # Tailwind 配置
├── postcss.config.js         # PostCSS 配置
└── vite.config.ts           # Vite 构建配置
```

## 本地化资源

### 1. 字体文件
所有字体文件已下载到 `public/fonts/` 目录：

- **Inter Variable Font** (`inter-var.woff2`): 318KB
  - 支持 300-700 字重
  - 用于正文和 UI 元素
  
- **JetBrains Mono Variable Font** (`jetbrains-mono-var.woff2`): 110KB
  - 支持 400-700 字重
  - 用于代码和等宽文本

**优势**：
- 无需外部 CDN，加载速度更快
- 支持离线访问
- 减少 DNS 查询和 HTTP 请求

### 2. CSS 资源
- **Highlight.js CSS** (`public/css/highlight.css`)
  - GitHub Dark 主题
  - 用于代码语法高亮

### 3. Tailwind CSS
- 使用本地 Tailwind CSS 编译
- 配置文件：`tailwind.config.js`
- 入口文件：`src/index.css`
- 构建时生成优化的 CSS 文件

**配置要点**：
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./api/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

## Service Worker 缓存策略

### 缓存版本
- **静态缓存**: `geekdrive-v1`
- **运行时缓存**: `geekdrive-runtime-v1`

### 缓存策略

#### 1. Cache First（静态资源）
适用于：
- HTML 文件（`/`, `/index.html`）
- JavaScript 和 CSS 文件（`/assets/*`）
- 字体文件（`/fonts/*`）
- 图标和图片

**流程**：
1. 优先从缓存读取
2. 缓存未命中时从网络获取
3. 成功响应自动缓存
4. 网络失败时返回缓存的 HTML（导航请求）

#### 2. Network First（API 请求）
适用于：
- 所有 `/api/*` 路径的请求

**流程**：
1. 优先从网络获取最新数据
2. 成功响应自动缓存到运行时缓存
3. 网络失败时尝试使用缓存
4. 缓存也未命中时抛出错误

### Service Worker 生命周期

#### 安装阶段（Install）
```javascript
// 预缓存关键静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/fonts/inter-var.woff2',
  '/fonts/jetbrains-mono-var.woff2',
];
```

#### 激活阶段（Activate）
- 清理旧版本缓存
- 接管所有客户端

#### 拦截请求（Fetch）
- 根据请求类型应用不同缓存策略
- 跳过非 HTTP(S) 请求

### 消息通信
支持从主线程发送消息控制 Service Worker：

```javascript
// 跳过等待，立即激活新 SW
navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });

// 清除所有缓存
navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
```

## 移动端优化

### Viewport 配置
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**功能**：
- `width=device-width`: 宽度适配设备
- `initial-scale=1.0`: 初始缩放比例 1:1
- `maximum-scale=1.0`: 最大缩放比例 1:1
- `user-scalable=no`: 禁止用户缩放

**优势**：
- 提供类原生应用体验
- 防止误触缩放
- 确保 UI 元素大小一致

### 主题色配置
```html
<meta name="theme-color" content="#FDE047">
```
- 设置浏览器地址栏颜色（Android Chrome）
- 使用品牌黄色 #FDE047

## 构建流程

### 开发环境
```bash
pnpm dev
```
- 启动 Vite 开发服务器
- 端口：3000
- 支持热更新（HMR）

### 生产构建
```bash
pnpm build
```

**构建步骤**：
1. TypeScript 类型检查（`tsc`）
2. Vite 打包（`vite build`）
   - 代码压缩（Terser）
   - CSS 优化（PostCSS + Autoprefixer）
   - 资源哈希化
   - 代码分割（vendor chunk）
3. 复制 `public/` 目录到 `dist/`

**输出结构**：
```
dist/
├── assets/
│   ├── index-[hash].js       # 应用代码
│   ├── vendor-[hash].js      # 第三方依赖
│   └── index-[hash].css      # 样式文件
├── fonts/                    # 字体文件
├── css/                      # CSS 资源
├── service-worker.js         # Service Worker
└── index.html               # 入口 HTML
```

### 预览构建结果
```bash
pnpm preview
```
- 启动本地服务器预览生产构建
- 测试 Service Worker 功能

## 部署配置

### 静态托管
适用于：Cloudflare Pages、Vercel、Netlify、GitHub Pages

**要求**：
- 支持 HTTPS（Service Worker 必需）
- 支持 SPA 路由（HashRouter 无需特殊配置）

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist;
    index index.html;

    # 启用 Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker 不缓存
    location = /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # SPA 路由支持（HashRouter 不需要）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Docker 部署
使用项目根目录的 `Dockerfile` 和 `docker-compose.yml`：

```bash
docker-compose up -d
```

## 性能优化

### 构建优化
1. **代码分割**：
   - Vendor chunk 分离第三方库
   - 减少主 bundle 大小
   
2. **Tree Shaking**：
   - 移除未使用的代码
   - 优化 lucide-react 图标导入

3. **压缩**：
   - JavaScript: Terser
   - CSS: cssnano（通过 PostCSS）

### 运行时优化
1. **Service Worker 缓存**：
   - 首次加载后，静态资源从缓存读取
   - 离线可用
   
2. **字体加载**：
   - `font-display: swap` 避免 FOIT
   - 可变字体减少文件数量

3. **CSS 优化**：
   - Tailwind 仅包含使用的类
   - 自动添加浏览器前缀

## 监控与调试

### Service Worker 调试
1. Chrome DevTools → Application → Service Workers
2. 查看缓存内容：Cache Storage
3. 清除缓存：Clear Storage

### 性能分析
1. Lighthouse 审计
2. Network 面板查看资源加载
3. Performance 面板分析运行时性能

### 常见问题

#### Service Worker 未更新
- 强制刷新：Ctrl/Cmd + Shift + R
- 或在 DevTools 中勾选 "Update on reload"

#### 字体未加载
- 检查 `public/fonts/` 目录是否存在
- 检查 `src/index.css` 中的 `@font-face` 路径

#### Tailwind 样式未生效
- 确认文件路径在 `tailwind.config.js` 的 `content` 中
- 重新构建项目

## 最佳实践

1. **版本管理**：
   - 更新 Service Worker 时修改 `CACHE_NAME`
   - 使用语义化版本号

2. **缓存策略**：
   - 静态资源长期缓存
   - API 数据短期缓存或不缓存
   - Service Worker 脚本不缓存

3. **资源优化**：
   - 使用可变字体减少文件数量
   - 图标按需导入
   - 避免不必要的第三方库

4. **测试**：
   - 本地测试 Service Worker（需 HTTPS 或 localhost）
   - 测试离线功能
   - 测试移动端缩放禁用

## 更新日志

### v1.0.0 (2024-12-24)
- ✅ 禁止页面缩放（移动端优化）
- ✅ Tailwind CSS 本地化
- ✅ 字体文件本地化（Inter、JetBrains Mono）
- ✅ Highlight.js CSS 本地化
- ✅ Service Worker 缓存策略实现
- ✅ 构建流程优化

