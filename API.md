# Loaf Server

这是一个基于 Cloudflare Workers, D1 和 R2 的文件存储服务。

## 功能特性

- **文件上传**: 支持上传文件到 Cloudflare R2，并保存元数据到 D1。
- **文件夹管理**: 支持创建虚拟文件夹 (模拟文件系统结构)。
- **文件夹加锁**: 支持对文件夹进行加锁保护，访问加锁文件夹需要提供密码。
- **文件检索**: 支持按文件夹、文件名搜索、文件类型筛选。
- **文件删除**: 支持软删除。
- **回收站**: 支持查看回收站、永久删除文件。
- **文件预览**: 获取文件下载/预览链接。

## 技术栈

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Language**: TypeScript

## 开发指南

### 1. 环境准备

确保已安装 Node.js 和 pnpm。
全局安装 wrangler (可选，推荐使用 `npx wrangler`):

```bash
npm install -g wrangler
```

### 2. 配置 Cloudflare 资源

在部署或本地开发前，你需要准备好 D1 数据库和 R2 存储桶。

**创建 D1 数据库:**
```bash
npx wrangler d1 create loaf-db
```
记下控制台输出的 `database_id`。

**创建 R2 存储桶:**
```bash
npx wrangler r2 bucket create loaf-files
```

**更新配置:**
修改 `wrangler.toml` 文件：
- 将 `database_id` 替换为你创建的 D1 数据库 ID。
- 将 `bucket_name` 替换为 `loaf-files` (或你创建的名称)。

### 3. 数据库初始化

**本地开发环境:**
```bash
npm run db:init:local
```

**生产环境:**
```bash
npm run db:init:prod
```

**数据库迁移 (如果是从旧版本升级):**

如果你已经有现有的数据库，需要添加 `isLocked` 字段，请运行迁移脚本：

```bash
# 本地环境
npx wrangler d1 execute loaf-db --local --file=./migration-add-islocked.sql

# 生产环境（远程数据库）
npx wrangler d1 execute loaf-db --remote --file=./migration-add-islocked.sql
```

**验证迁移是否成功:**

```bash
# 查看表结构
npx wrangler d1 execute loaf-db --local --command="PRAGMA table_info(Files);"
```

### 4. 启动开发服务

```bash
npm run dev
```
服务将启动在 `http://localhost:8787`。

### 5. 测试

本项目使用 Vitest 进行单元测试和集成测试。

```bash
npm test
```

注意：测试运行在本地模拟环境中，会自动模拟 D1 和 R2。

**测试文件夹加锁功能:**

确保服务已启动，然后运行：

```bash
./test-folder-lock.sh
```

该脚本会自动测试文件夹加锁、解锁和密码验证等功能。

## 文件夹加锁功能说明

### 概述
文件夹加锁功能允许你对敏感文件夹进行保护。加锁后的文件夹需要提供正确的密码才能访问其内容。

### 密码配置
密码配置在 `wrangler.toml` 文件中：
```toml
[vars]
FOLDER_PASSWORD = "456111"
```

**生产环境安全配置（推荐）:**
```bash
# 使用 secret 替代明文密码（更安全）
npx wrangler secret put FOLDER_PASSWORD
# 然后输入密码
```

- 默认密码: `456111`
- 通过 HTTP Header `x-folder-password` 传递
- 可以修改 `wrangler.toml` 中的 `FOLDER_PASSWORD` 值来自定义密码

📖 **详细的密码配置指南**: 参考 [PASSWORD-CONFIG.md](./PASSWORD-CONFIG.md)

### 使用流程

1. **给文件夹加锁（不需要密码）**
```bash
curl -X PATCH "http://localhost:8787/api/files/{folder-id}" \
  -H "Content-Type: application/json" \
  -d '{"isLocked": true}'
```

2. **访问加锁的文件夹（需要密码）**
```bash
curl "http://localhost:8787/api/files?folderId={folder-id}" \
  -H "x-folder-password: 456111"
```

3. **解锁文件夹（需要密码）**
```bash
curl -X PATCH "http://localhost:8787/api/files/{folder-id}" \
  -H "Content-Type: application/json" \
  -H "x-folder-password: 456111" \
  -d '{"isLocked": false}'
```

### 注意事项
- 只有文件夹可以加锁，普通文件不支持此功能
- **加锁操作**：不需要密码，任何人都可以加锁
- **解锁操作**：需要提供正确的密码，密码错误或未提供时返回 403 错误
- **访问加锁文件夹**：需要提供正确的密码才能查看文件列表
- 加锁只影响文件列表查询，不影响直接通过文件 ID 访问单个文件

## API 文档

所有示例均假设服务运行在本地 `http://localhost:8787`。

**通用响应格式:**

```json
{
  "code": 0, // 0 表示成功，非 0 表示错误
  "message": "success",
  "data": { ... } // 具体数据
}
```

### 1. 获取文件列表
`GET /api/files`

参数:
- `folderId`: 文件夹ID (可选，'root' 或不传表示根目录)
- `search`: 文件名搜索关键字 (可选)
- `type`: 文件类型 (可选, e.g. 'IMAGE', 'VIDEO')
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)

Headers:
- `x-folder-password`: 文件夹密码 (当访问加锁的文件夹时必填，密码为 `456111`)

**示例:**
```bash
# 获取根目录文件列表
curl "http://localhost:8787/api/files?folderId=root&page=1&limit=20"

# 搜索文件
curl "http://localhost:8787/api/files?search=report"

# 访问加锁的文件夹（需要密码）
curl "http://localhost:8787/api/files?folderId=folder-id-xxx" \
  -H "x-folder-password: 456111"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. 创建文件夹
`POST /api/files/folder`

Body (JSON):
- `name`: 文件夹名称 (必填)
- `folderId`: 父文件夹ID (可选，默认 'root')

**示例:**
```bash
curl -X POST "http://localhost:8787/api/files/folder" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Documents", "folderId": "root"}'
```

### 3. 上传预览图
`POST /api/files/upload-preview`

上传预览图到 R2 存储，返回 r2Key。此接口不会创建数据库记录，仅用于上传视频预览帧等场景。

Body (FormData):
- `file`: 图片文件对象 (必填)

**示例:**
```bash
curl -X POST "http://localhost:8787/api/files/upload-preview" \
  -F "file=@./preview.jpg"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "r2Key": "previews/abc123-preview.jpg",
    "size": 12345
  }
}
```

### 4. 上传文件
`POST /api/files/upload`

Body (FormData):
- `file`: 文件对象 (必填)
- `folderId`: 文件夹ID (可选)
- `filename`: 文件名 (可选，默认为原始文件名)
- `description`: 文件描述 (可选)
- `tags`: 标签列表 (可选，格式为 JSON 数组字符串 `["tag1", "tag2"]` 或逗号分隔字符串 `"tag1,tag2"`)
- `previews`: 预览图 r2Key 列表 (可选，格式为 JSON 数组字符串 `["previews/xxx.jpg", "previews/yyy.jpg"]`，通常用于视频文件)

**示例:**
```bash
# 上传普通图片
curl -X POST "http://localhost:8787/api/files/upload" \
  -F "file=@./test.png" \
  -F "folderId=root" \
  -F "description=这是一张测试图片" \
  -F "tags=[\"test\", \"image\"]"

# 上传视频 (带预览图)
curl -X POST "http://localhost:8787/api/files/upload" \
  -F "file=@./video.mp4" \
  -F "folderId=root" \
  -F "previews=[\"previews/frame1.jpg\", \"previews/frame2.jpg\"]"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "uuid-xxxx",
    "filename": "video.mp4",
    "status": "success",
    "type": "VIDEO",
    "size": 1234567,
    "description": null,
    "tags": [],
    "previews": ["previews/frame1.jpg", "previews/frame2.jpg"]
  }
}
```

### 6. 更新文件信息
`PATCH /api/files/:id`

Body (JSON):
- `folderId`: 移动到新文件夹 (可选，'root' 或文件夹ID)
- `filename`: 重命名 (可选)
- `status`: 状态 (可选)
- `description`: 描述 (可选)
- `isStarred`: 是否收藏 (可选, boolean)
- `isDeleted`: 是否软删除 (可选, boolean)
- `isLocked`: 是否加锁（仅文件夹有效）(可选, boolean)
- `tags`: 标签列表 (可选, string[])
- `previews`: 预览图列表 (可选, string[])

**示例:**
```bash
# 更新文件信息
curl -X PATCH "http://localhost:8787/api/files/12345678-1234-1234-1234-1234567890ab" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "new-name.png",
    "isStarred": true,
    "tags": ["important", "work"]
  }'

# 给文件夹加锁（不需要密码）
curl -X PATCH "http://localhost:8787/api/files/folder-id-xxx" \
  -H "Content-Type: application/json" \
  -d '{"isLocked": true}'

# 给文件夹解锁（需要密码）
curl -X PATCH "http://localhost:8787/api/files/folder-id-xxx" \
  -H "Content-Type: application/json" \
  -H "x-folder-password: 456111" \
  -d '{"isLocked": false}'
```

### 7. 获取文件详情
`GET /api/files/:id`

**示例:**
```bash
# 请替换 :id 为真实的文件 ID
curl "http://localhost:8787/api/files/12345678-1234-1234-1234-1234567890ab"
```

### 8. 删除文件/文件夹
`DELETE /api/files/:id`

**示例:**
```bash
# 请替换 :id 为真实的文件 ID
curl -X DELETE "http://localhost:8787/api/files/12345678-1234-1234-1234-1234567890ab"
```

### 9. 获取文件内容 (下载)
`GET /api/files/:id/content`

**注意**: 此接口直接返回文件流，不遵循通用 JSON 响应格式。

**示例:**
```bash
# 下载文件并保存为 downloaded_file (或者使用 -O 保持原名)
curl "http://localhost:8787/api/files/12345678-1234-1234-1234-1234567890ab/content" --output downloaded_file
```

### 10. 获取文件夹树
`GET /api/folders/tree`

获取所有文件夹及其层级关系，用于前端展示文件夹树。

**示例:**
```bash
curl "http://localhost:8787/api/folders/tree"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "folder-1-uuid",
      "name": "Documents",
      "parentId": null,
      "children": [
        {
          "id": "folder-2-uuid",
          "name": "Work",
          "parentId": "folder-1-uuid",
          "children": []
        }
      ]
    }
  ]
}
```

### 11. 获取回收站列表
`GET /api/recycle-bin`

获取已删除的文件列表（isDeleted = 1），支持分页和搜索。

参数:
- `search`: 文件名搜索关键字 (可选)
- `type`: 文件类型 (可选, e.g. 'IMAGE', 'VIDEO')
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)

**示例:**
```bash
# 获取回收站文件列表
curl "http://localhost:8787/api/recycle-bin?page=1&limit=20"

# 搜索回收站中的文件
curl "http://localhost:8787/api/recycle-bin?search=report"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid-xxxx",
        "filename": "deleted-file.pdf",
        "type": "DOCUMENT",
        "size": 123456,
        "isDeleted": true,
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 12. 清空回收站
`DELETE /api/recycle-bin`

永久删除回收站中的文件（包括数据库记录和 R2 存储的实际文件）。

参数:
- `id`: 文件ID (可选，如果提供则只删除指定文件，否则清空整个回收站)

**示例:**
```bash
# 永久删除单个文件
curl -X DELETE "http://localhost:8787/api/recycle-bin?id=12345678-1234-1234-1234-1234567890ab"

# 清空整个回收站
curl -X DELETE "http://localhost:8787/api/recycle-bin"
```

**响应示例 (删除单个文件):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "12345678-1234-1234-1234-1234567890ab",
    "message": "File permanently deleted"
  }
}
```

**响应示例 (清空回收站):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 5,
    "message": "Recycle bin cleared"
  }
}
```
