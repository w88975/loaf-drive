# Loaf Server

这是一个基于 Cloudflare Workers, D1 和 R2 的文件存储服务。

## 功能特性

- **文件上传**: 
  - 小文件直接上传（< 100MB）
  - 大文件分片上传（支持断点续传，避免 413 错误）
  - 支持上传文件到 Cloudflare R2，并保存元数据到 D1
- **文件夹管理**: 支持创建虚拟文件夹 (模拟文件系统结构)
- **文件夹加锁**: 支持对文件夹进行加锁保护，访问加锁文件夹需要提供密码
- **文件检索**: 支持按文件夹、文件名搜索、文件类型筛选
- **文件删除**: 
  - 软删除（移入回收站）
  - 递归删除（删除文件夹时自动删除所有子项）
  - 防止幽灵文件
- **回收站**: 
  - 查看已删除的文件
  - 永久删除（彻底清理数据库和 R2 存储）
  - 递归清理（删除文件夹时清理所有子项）
- **文件预览**: 获取文件下载/预览链接
- **分享功能**:
  - 生成分享链接（10位分享码）
  - 支持密码保护
  - 支持过期时间
  - 支持访问次数限制
  - 文件/文件夹分享
  - 独立的分享访问接口

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

如果你已经有现有的数据库，需要运行迁移脚本：

```bash
# 添加 isLocked 字段（文件夹加锁功能）
npx wrangler d1 execute loaf-db --local --file=./migration-add-islocked.sql
npx wrangler d1 execute loaf-db --remote --file=./migration-add-islocked.sql

# 添加 Shares 表（分享功能）
npx wrangler d1 execute loaf-db --local --file=./migration-add-shares.sql
npx wrangler d1 execute loaf-db --remote --file=./migration-add-shares.sql
```

**验证迁移是否成功:**

```bash
# 查看表结构
npx wrangler d1 execute loaf-db --local --command="PRAGMA table_info(Files);"
npx wrangler d1 execute loaf-db --local --command="PRAGMA table_info(Shares);"

# 查看所有表
npx wrangler d1 execute loaf-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
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

#### 4.1 小文件直接上传
`POST /api/files/upload`

**适用场景**: 文件小于 100MB

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

#### 4.2 大文件分片上传
**适用场景**: 文件大于 100MB，避免 413 错误

**步骤 1: 初始化上传**
`POST /api/files/upload/init`

Body (JSON):
- `filename`: 文件名 (必填)
- `folderId`: 文件夹ID (可选)
- `description`: 文件描述 (可选)
- `tags`: 标签数组 (可选)
- `totalSize`: 文件总大小（字节）(必填)
- `mimeType`: 文件 MIME 类型 (可选)

```bash
curl -X POST "http://localhost:8787/api/files/upload/init" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "large-video.mp4",
    "folderId": "root",
    "totalSize": 524288000,
    "mimeType": "video/mp4",
    "tags": ["video", "large"]
  }'
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "file-uuid",
    "uploadId": "upload-id-xxx",
    "r2Key": "root/file-uuid-large-video.mp4",
    "filename": "large-video.mp4",
    "type": "VIDEO"
  }
}
```

**步骤 2: 上传分片**
`POST /api/files/upload/part`

Body (FormData):
- `chunk`: 分片数据 (必填)
- `uploadId`: 上传会话ID (必填)
- `r2Key`: R2存储键 (必填)
- `partNumber`: 分片编号，从 1 开始 (必填)

```bash
# 上传第 1 个分片
curl -X POST "http://localhost:8787/api/files/upload/part" \
  -F "chunk=@./chunk-1" \
  -F "uploadId=upload-id-xxx" \
  -F "r2Key=root/file-uuid-large-video.mp4" \
  -F "partNumber=1"

# 上传第 2 个分片
curl -X POST "http://localhost:8787/api/files/upload/part" \
  -F "chunk=@./chunk-2" \
  -F "uploadId=upload-id-xxx" \
  -F "r2Key=root/file-uuid-large-video.mp4" \
  -F "partNumber=2"
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "partNumber": 1,
    "etag": "etag-xxx"
  }
}
```

**步骤 3: 完成上传**
`POST /api/files/upload/complete`

Body (JSON):
- `id`: 文件ID (必填)
- `uploadId`: 上传会话ID (必填)
- `r2Key`: R2存储键 (必填)
- `parts`: 分片信息数组 (必填)
- `previews`: 预览图列表 (可选)

```bash
curl -X POST "http://localhost:8787/api/files/upload/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "file-uuid",
    "uploadId": "upload-id-xxx",
    "r2Key": "root/file-uuid-large-video.mp4",
    "parts": [
      {"partNumber": 1, "etag": "etag-1"},
      {"partNumber": 2, "etag": "etag-2"}
    ],
    "previews": ["previews/frame1.jpg"]
  }'
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "file-uuid",
    "filename": "large-video.mp4",
    "status": "success",
    "type": "VIDEO",
    "size": 524288000
  }
}
```

**步骤 4（可选）: 取消上传**
`POST /api/files/upload/abort`

Body (JSON):
- `id`: 文件ID (可选)
- `uploadId`: 上传会话ID (必填)
- `r2Key`: R2存储键 (必填)

```bash
curl -X POST "http://localhost:8787/api/files/upload/abort" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "file-uuid",
    "uploadId": "upload-id-xxx",
    "r2Key": "root/file-uuid-large-video.mp4"
  }'
```

### 5. 选择上传方式

| 文件大小 | 推荐方式 | 说明 |
|---------|---------|------|
| < 100MB | 直接上传 | 简单快速 |
| 100MB - 5GB | 分片上传 | 避免超时和 413 错误 |
| > 5GB | 分片上传 | 必须使用分片（R2 单次上传限制 5GB）|

**分片大小建议**: 5MB - 100MB 每片

📖 **完整的分片上传指南**: 参考 [CHUNKED-UPLOAD-GUIDE.md](./CHUNKED-UPLOAD-GUIDE.md)
  - 详细的工作原理说明
  - 完整的前端实现示例（JavaScript + React Native）
  - 最佳实践和性能优化
  - 错误处理和断点续传
  - 故障排查指南

📖 **递归删除功能说明**: 参考 [RECURSIVE-DELETE-GUIDE.md](./RECURSIVE-DELETE-GUIDE.md)
  - 递归删除的工作原理
  - 防止幽灵文件的机制
  - 性能优化和批量处理
  - 前端集成示例
  - 测试和最佳实践

## 分享功能

### 创建分享
`POST /api/shares`

Body (JSON):
- `fileId`: 文件或文件夹ID (必填)
- `password`: 访问密码 (可选)
- `expiresAt`: 过期时间 ISO 8601 格式 (可选)
- `maxViews`: 最大访问次数 (可选)

**示例:**
```bash
# 创建无密码分享
curl -X POST "http://localhost:8787/api/shares" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "file-uuid",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'

# 创建带密码的分享
curl -X POST "http://localhost:8787/api/shares" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "folder-uuid",
    "password": "123456",
    "maxViews": 100
  }'
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "share-uuid",
    "code": "AbCd123456",
    "fileId": "file-uuid",
    "hasPassword": true,
    "expiresAt": "2024-12-31T23:59:59Z",
    "maxViews": 100,
    "shareUrl": "/share/AbCd123456"
  }
}
```

### 获取分享信息
`GET /api/shares/:code`

获取分享的基本信息，不需要密码。

**示例:**
```bash
curl "http://localhost:8787/api/shares/AbCd123456"
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "code": "AbCd123456",
    "hasPassword": true,
    "expiresAt": "2024-12-31T23:59:59Z",
    "views": 5,
    "maxViews": 100,
    "file": {
      "id": "file-uuid",
      "filename": "document.pdf",
      "type": "DOCUMENT",
      "size": 1024000
    }
  }
}
```

### 验证分享密码
`POST /api/shares/:code/verify`

验证分享密码，成功后返回访问凭证。

Body (JSON):
- `password`: 密码 (必填)

**示例:**
```bash
curl -X POST "http://localhost:8787/api/shares/AbCd123456/verify" \
  -H "Content-Type: application/json" \
  -d '{"password": "123456"}'
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "Password verified",
    "accessToken": "AbCd123456:token-uuid"
  }
}
```

**重要**: 请保存返回的 `accessToken`，在后续请求中通过 Header `x-share-token` 传递。

### 获取分享的文件列表
`GET /api/shares/:code/files`

获取分享的文件内容。如果是文件夹，返回文件列表；如果是文件，返回文件信息。

参数:
- `subFolderId`: 子文件夹ID (可选，用于浏览文件夹内容)
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 50)

Headers:
- `x-share-token`: 如果分享有密码，需要携带验证后的访问凭证

**示例:**
```bash
# 获取分享内容（无密码）
curl "http://localhost:8787/api/shares/AbCd123456/files"

# 获取分享内容（有密码，需要访问凭证）
curl "http://localhost:8787/api/shares/AbCd123456/files" \
  -H "x-share-token: AbCd123456:token-uuid"

# 浏览子文件夹
curl "http://localhost:8787/api/shares/AbCd123456/files?subFolderId=subfolder-uuid" \
  -H "x-share-token: AbCd123456:token-uuid"
```

**响应（文件夹）:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "folder": {
      "id": "folder-uuid",
      "filename": "My Folder",
      "type": "FOLDER"
    },
    "items": [
      {
        "id": "file1-uuid",
        "filename": "image.jpg",
        "type": "IMAGE",
        "size": 2048000
      }
    ],
    "isFolder": true,
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

**响应（单个文件）:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "file": {
      "id": "file-uuid",
      "filename": "document.pdf",
      "type": "DOCUMENT",
      "size": 1024000
    },
    "isFolder": false
  }
}
```

### 下载分享的文件
`GET /api/shares/:code/download/:fileId`

下载分享的文件。

Headers:
- `x-share-token`: 如果分享有密码，需要携带验证后的访问凭证

**示例:**
```bash
# 下载文件（无密码）
curl "http://localhost:8787/api/shares/AbCd123456/download/file-uuid" --output file.pdf

# 下载文件（有密码）
curl "http://localhost:8787/api/shares/AbCd123456/download/file-uuid" \
  -H "x-share-token: AbCd123456:token-uuid" \
  --output file.pdf
```

### 获取所有分享列表
`GET /api/shares`

获取已创建的所有分享列表，支持分页和过滤。

参数:
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)
- `fileId`: 按文件ID过滤 (可选)

**示例:**
```bash
# 获取所有分享
curl "http://localhost:8787/api/shares"

# 分页查询
curl "http://localhost:8787/api/shares?page=2&limit=10"

# 查询特定文件的分享
curl "http://localhost:8787/api/shares?fileId=file-uuid"
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "share1-uuid",
        "code": "AbCd123456",
        "fileId": "file-uuid",
        "file": {
          "id": "file-uuid",
          "filename": "document.pdf",
          "type": "DOCUMENT",
          "size": 1024000
        },
        "hasPassword": true,
        "expiresAt": "2024-12-31T23:59:59Z",
        "views": 5,
        "maxViews": 100,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "shareUrl": "/share/AbCd123456"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 更新分享
`PATCH /api/shares/:code`

更新分享的密码、过期时间或最大访问次数。

Body (JSON):
- `password`: 新密码 (可选，传 `null` 可移除密码)
- `expiresAt`: 新过期时间 (可选，传 `null` 可移除过期时间)
- `maxViews`: 新的最大访问次数 (可选，传 `null` 可移除限制)

**示例:**
```bash
# 更新密码
curl -X PATCH "http://localhost:8787/api/shares/AbCd123456" \
  -H "Content-Type: application/json" \
  -d '{"password": "newpass123"}'

# 延期（更新过期时间）
curl -X PATCH "http://localhost:8787/api/shares/AbCd123456" \
  -H "Content-Type: application/json" \
  -d '{"expiresAt": "2025-12-31T23:59:59Z"}'

# 移除密码
curl -X PATCH "http://localhost:8787/api/shares/AbCd123456" \
  -H "Content-Type: application/json" \
  -d '{"password": null}'

# 同时更新多个字段
curl -X PATCH "http://localhost:8787/api/shares/AbCd123456" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpass",
    "expiresAt": "2025-12-31T23:59:59Z",
    "maxViews": 200
  }'
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "share1-uuid",
    "code": "AbCd123456",
    "hasPassword": true,
    "expiresAt": "2025-12-31T23:59:59Z",
    "maxViews": 200,
    "views": 5,
    "updatedAt": "2024-01-02T10:30:00Z",
    "message": "Share updated successfully"
  }
}
```

### 删除分享（取消分享）
`DELETE /api/shares/:code`

删除一个分享链接，取消分享。

**示例:**
```bash
curl -X DELETE "http://localhost:8787/api/shares/AbCd123456"
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "code": "AbCd123456",
    "message": "Share deleted"
  }
}
```

### 获取文件的所有分享
`GET /api/files/:id/shares`

获取某个文件或文件夹的所有分享链接。

**示例:**
```bash
curl "http://localhost:8787/api/files/file-uuid/shares"
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "share1-uuid",
      "code": "AbCd123456",
      "hasPassword": true,
      "expiresAt": "2024-12-31T23:59:59Z",
      "views": 5,
      "maxViews": 100,
      "createdAt": "2024-01-01T00:00:00Z",
      "shareUrl": "/share/AbCd123456"
    }
  ]
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

### 8. 删除文件/文件夹（软删除）
`DELETE /api/files/:id`

**行为说明**:
- 将文件/文件夹标记为删除（`isDeleted = 1`），移入回收站
- **如果删除的是文件夹**：会递归标记该文件夹下的所有文件和子文件夹为删除
- 删除的文件可以在回收站中查看和恢复

**示例:**
```bash
# 删除文件
curl -X DELETE "http://localhost:8787/api/files/12345678-1234-1234-1234-1234567890ab"

# 删除文件夹（会递归标记所有子项）
curl -X DELETE "http://localhost:8787/api/files/folder-id-xxx"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "folder-id-xxx",
    "deletedCount": 15,
    "message": "Folder and all contents moved to recycle bin"
  }
}
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

### 12. 清空回收站（永久删除）
`DELETE /api/recycle-bin`

永久删除回收站中的文件（包括数据库记录和 R2 存储的实际文件）。

参数:
- `id`: 文件ID (可选，如果提供则只删除指定文件，否则清空整个回收站)

**重要说明**:
- **删除文件夹**：会递归删除该文件夹下的所有文件和子文件夹（即使子项未标记为删除）
- **清空回收站**：会删除所有标记为删除的文件，以及这些文件夹下的所有子项
- **彻底删除**：同时删除 R2 存储中的实际文件和数据库记录，操作不可恢复
- **防止幽灵文件**：确保不会留下孤立的子文件占用存储空间

**示例:**
```bash
# 永久删除单个文件（如果是文件夹，会递归删除所有子项）
curl -X DELETE "http://localhost:8787/api/recycle-bin?id=12345678-1234-1234-1234-1234567890ab"

# 清空整个回收站（递归删除所有相关文件）
curl -X DELETE "http://localhost:8787/api/recycle-bin"
```

**响应示例 (删除单个文件夹):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "12345678-1234-1234-1234-1234567890ab",
    "deletedCount": 25,
    "message": "File and all contents permanently deleted"
  }
}
```

**响应示例 (清空回收站):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deletedCount": 50,
    "message": "Recycle bin cleared"
  }
}
```
