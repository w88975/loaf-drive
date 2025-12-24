# 多语言系统 (i18n)

## 概述

本项目使用 `react-i18next` 实现国际化支持，目前支持中文（简体）和英文两种语言。

## 技术栈

- **i18next**: 核心国际化框架
- **react-i18next**: React 集成库
- **localStorage**: 语言偏好持久化存储

## 文件结构

```
i18n/
├── index.ts           # i18n 配置和初始化
├── locales/
│   ├── zh.ts         # 中文翻译
│   └── en.ts         # 英文翻译
└── README.md         # 本文档
```

## 语言检测逻辑

系统按以下优先级检测和设置语言：

1. **localStorage 缓存** - 用户上次选择的语言（优先级最高）
2. **浏览器语言** - 检测 `navigator.language`
   - `zh-*` 开头 → 使用中文
   - 其他 → 使用英文
3. **默认语言** - 中文（fallback）

## 使用方法

### 在组件中使用翻译

```typescript
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.upload')}</h1>
      <button>{t('common.cancel')}</button>
    </div>
  );
};
```

### 切换语言

```typescript
import { useTranslation } from 'react-i18next';

export const LanguageSwitch = () => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };
  
  return <button onClick={toggleLanguage}>Switch Language</button>;
};
```

### 获取当前语言

```typescript
const { i18n } = useTranslation();
const currentLanguage = i18n.language; // 'zh' 或 'en'
```

## 翻译文件结构

翻译文件采用嵌套对象结构，按功能模块分类：

```typescript
export default {
  common: {
    upload: '上传',
    download: '下载',
    // ...
  },
  nav: {
    files: '文件',
    trash: '回收站',
    // ...
  },
  // 更多模块...
};
```

### 主要模块

- **common**: 通用文本（按钮、操作等）
- **nav**: 导航相关
- **sidebar**: 侧边栏
- **header**: 顶部栏
- **auth**: 认证页面
- **file**: 文件操作
- **contextMenu**: 右键菜单
- **modal**: 模态框
- **trash**: 回收站
- **share**: 分享功能
- **upload**: 上传功能
- **preview**: 预览功能
- **selection**: 多选操作
- **format**: 格式化（文件大小等）
- **message**: 提示消息

## 添加新翻译

### 1. 在翻译文件中添加键值对

**zh.ts**:
```typescript
export default {
  myModule: {
    myKey: '我的翻译',
  },
};
```

**en.ts**:
```typescript
export default {
  myModule: {
    myKey: 'My Translation',
  },
};
```

### 2. 在组件中使用

```typescript
const { t } = useTranslation();
return <div>{t('myModule.myKey')}</div>;
```

## 添加新语言

### 1. 创建新的翻译文件

在 `i18n/locales/` 目录下创建新文件，例如 `ja.ts`（日语）：

```typescript
export default {
  common: {
    upload: 'アップロード',
    download: 'ダウンロード',
    // ...
  },
  // 复制完整的翻译结构
};
```

### 2. 在 i18n 配置中注册

修改 `i18n/index.ts`：

```typescript
import ja from './locales/ja';

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
    ja: { translation: ja }, // 添加新语言
  },
  // ...
});
```

### 3. 更新语言检测逻辑（可选）

如果需要自动检测新语言，修改 `getBrowserLanguage` 函数。

### 4. 更新语言切换按钮

修改 `Header.tsx` 中的语言切换逻辑以支持多语言选择。

## 持久化存储

- **存储键**: `geek_drive_language`
- **存储位置**: `localStorage`
- **存储值**: `'zh'` 或 `'en'`

语言切换后会自动保存到 localStorage，下次访问时自动恢复。

## 注意事项

### 1. 文本大写

许多 UI 元素使用 `uppercase` 样式，在使用翻译时需要注意：

```typescript
// 正确：在 JSX 中使用 CSS 类
<span className="uppercase">{t('common.upload')}</span>

// 或在代码中转换
<span>{t('common.upload').toUpperCase()}</span>
```

### 2. 动态内容

对于包含变量的文本，使用插值：

```typescript
// 翻译文件
{
  selection: {
    selectedItems: '已选择 {{count}} 项',
  }
}

// 使用
t('selection.selectedItems', { count: 5 })
```

### 3. 专有名词

某些专有名词保持英文：
- API Key
- R2
- Cloudflare
- 文件扩展名（.pdf, .jpg 等）

### 4. 文件大小单位

文件大小单位统一使用英文：
- KB, MB, GB, TB

### 5. 日期和时间

如需格式化日期，可以使用 i18next 的格式化功能或根据语言选择不同的日期格式库。

## 测试

### 手动测试清单

- [ ] 点击语言切换按钮，界面文本立即切换
- [ ] 刷新页面，语言设置保持不变
- [ ] 清除 localStorage，首次访问根据浏览器语言自动选择
- [ ] 所有页面的文本都已翻译
- [ ] 模态框、提示信息等动态内容正确翻译
- [ ] 错误消息正确翻译
- [ ] 中英文字符长度差异不会导致 UI 溢出

## 性能优化

- 翻译文件在构建时会被打包到主 bundle 中
- 如果翻译文件过大，可以考虑使用 i18next 的懒加载功能
- 当前两种语言的翻译文件较小，无需额外优化

## 未来扩展

可能的改进方向：

1. **更多语言支持**: 日语、韩语、法语等
2. **语言包懒加载**: 按需加载翻译文件
3. **翻译管理平台**: 使用 Crowdin 等工具管理翻译
4. **复数形式**: 支持不同语言的复数规则
5. **日期/时间本地化**: 根据语言格式化日期时间
6. **货币格式化**: 如果涉及金额显示
7. **RTL 支持**: 支持从右到左的语言（阿拉伯语等）

