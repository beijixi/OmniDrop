# OmniDrop

一个面向个人使用的数字抽屉 Web 应用。它把文本消息、文件、图片、视频和 PDF 都收进同一条时间流里，重点放在极简、可运行、单机部署。

## 1. 方案与项目结构

### MVP 方案

- 前端：`Next.js App Router + TypeScript + Tailwind CSS`
- 数据库：`PostgreSQL + Prisma`
- 文件存储：本地文件系统 `storage/uploads`
- 数据策略：数据库只保存元数据，文件本体写入磁盘
- 页面结构：
  - `/` 统一时间流首页
  - `/share/[token]` 分享页
  - `/settings` 基础设置页
- 上传方式：
  - 拖拽上传
  - 文件选择上传
  - 粘贴上传
- 支持内容：
  - 文本消息
  - 图片缩略图和预览
  - 视频内嵌播放
  - PDF 页面内预览
  - 通用文件打开

### 目录结构

```text
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assets/[id]/route.ts
│   │   │   ├── entries/[id]/route.ts
│   │   │   ├── entries/route.ts
│   │   │   ├── entries/[id]/share/route.ts
│   │   │   └── settings/route.ts
│   │   ├── settings/page.tsx
│   │   ├── share/[token]/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── composer.tsx
│   │   ├── entry-actions.tsx
│   │   ├── entry-card.tsx
│   │   ├── settings-form.tsx
│   │   └── timeline-toolbar.tsx
│   └── lib/
│       ├── entries.ts
│       ├── env.ts
│       ├── file-types.ts
│       ├── prisma.ts
│       ├── request-source.ts
│       ├── settings.ts
│       ├── storage.ts
│       └── utils.ts
├── storage/
│   └── uploads/
├── .env.example
├── docker-compose.yml
├── next.config.mjs
├── package.json
└── tailwind.config.ts
```

## 2. Prisma Schema

Schema 文件在 `prisma/schema.prisma`，核心模型如下：

- `Entry`
  - 时间流中的一条内容
  - 可包含文本消息
  - 记录发送来源 `senderName / senderIp / senderHost`
  - 通过 `type` 标记为 `TEXT / IMAGE / VIDEO / PDF / FILE / MIXED`
- `Asset`
  - 附件元数据
  - 记录原始文件名、存储路径、类型、大小、MIME
- `ShareLink`
  - 分享链接 token
- `AppSetting`
  - 基础设置，如应用名称、分享基础地址

标签相关表仍保留在 schema 中，便于兼容旧数据，但第二阶段 UI 已移除标签功能。

当前 schema 已通过 `prisma validate`。

## 3. 已实现的 MVP

### 首页时间流

- 统一展示文本和附件内容
- 聊天式内容流布局，手机优先展示内容
- 顶部压缩为轻量搜索和类型筛选
- 底部输入栏默认折叠，点击展开

### 上传与发送

- 文本消息可直接发送
- 支持拖拽上传
- 支持文件选择上传
- 支持粘贴图片/文件上传
- 同一个输入区同时支持文本和文件
- 文本按空行拆分成多条内容发送
- 文件按单条消息独立发送
- 上传后写入本地 `storage/uploads/YYYY/MM`

### 预览

- 图片：列表缩略图 + 点击原图
- 视频：页面内播放器
- PDF：页面内 iframe 预览
- 其他文件：打开原文件

### 搜索与筛选

- 搜索文本消息
- 搜索文件名
- 搜索发送 IP
- 搜索主机名
- 类型筛选

### 发送来源

- 每条内容显示发送者名称
- 尝试记录发送 IP
- 尝试通过反向解析映射主机名
- 本机直接访问时默认显示为当前设备

### 分享

- 为单条内容生成分享链接
- 支持撤销分享链接
- `/share/[token]` 公开分享页可直接查看

### 内容管理

- 支持删除条目
- 删除条目时会一并删除对应本地文件

### 设置页

- 应用名称
- 分享基础地址
- 存储目录展示

## 4. 启动说明

### 环境要求

- Node.js 20+，推荐 22+
- PostgreSQL 16+
- 或者使用仓库自带的 `docker-compose.yml`

### 第一步：准备环境变量

```bash
cp .env.example .env
```

默认配置：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omnidrop?schema=public"
APP_NAME="OmniDrop"
STORAGE_DIR="./storage/uploads"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 第二步：启动 PostgreSQL

如果你本机已经有 PostgreSQL，可跳过 Docker。

如果使用 Docker：

```bash
docker compose up -d
```

如果这一步失败，通常是 Docker daemon 没启动。当前仓库这次验证里，`docker compose` 命令可用，但本机 daemon 当时未启动。

### 第三步：安装依赖

```bash
npm install
```

本项目没有额外引入 Redis、MQ、MinIO、Elasticsearch。

### 第四步：生成 Prisma Client 并同步数据库

```bash
npx prisma generate
npx prisma db push
```

### 第五步：启动开发环境

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 可用脚本

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:push
```

## 已完成的验证

- `next build` 已通过
- `prisma validate` 已通过
- `prisma db push` 已通过
- `http://localhost:3000` 已返回 `200`
- 代码已补齐为可运行 MVP

## 已知说明

- 分享链接当前为单条内容公开访问的最小实现
- 标签功能已从当前 UI 移除，但旧表保留在 schema 中以兼容历史数据
- 发送来源识别依赖请求头和本机环境，反向主机名解析属于 best effort
- 权限体系、批量管理和更复杂的分享控制仍刻意保留在 MVP 之外
