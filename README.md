# OmniDrop

OmniDrop 是一个面向个人使用的数字抽屉 Web 应用。它把文本消息、图片、视频、PDF 和常见文件统一收进一条聊天式时间流里，强调单机部署、轻量易用和快速分享。

## 功能特性

- 聊天式统一时间流，桌面和移动端都优先展示内容
- 文本、文件、图片、视频、PDF 混合收纳
- 支持拖拽上传、选择上传、粘贴上传
- 图片缩略图与原图查看
- 视频页内播放
- PDF 页内预览
- 文本消息直接发送
- 搜索与类型筛选
- 单条内容分享链接，支持公网/内网双地址复制与撤销
- 记录发送来源，显示发送者、IPv4、主机名
- 国际化界面：`zh-CN / en / ja / fr / de / es`
- 多存储后端：`local / S3-compatible / WebDAV`
- 支持公网密码门禁，分享链接可独立免密访问

## 文件支持

### 可直接预览

- 图片：`jpg jpeg png gif webp bmp svg`
- 视频：`mp4 mov m4v webm ogg`
- PDF：`pdf`
- Markdown：`md markdown mdx`
- 文本与代码：`txt json yaml yml xml html css js ts tsx jsx py go rs java sh sql log` 等常见文本格式
- 表格：`xlsx xls csv tsv ods`
- Word：`docx`

### 图标增强展示

以下格式当前至少会显示明确的格式图标和下载入口：

- Word / Excel / PowerPoint
- 压缩包：`zip rar 7z tar gz tgz bz2 xz`
- 音频：`mp3 wav flac aac m4a ogg`
- 设计文件：`fig sketch psd ai xd`
- 安装包与应用文件：`apk ipa dmg pkg exe msi appimage`

说明：

- `docx` 当前为正文文本预览
- `xlsx / xls / csv / tsv` 当前预览首个工作表或表格内容
- `doc`、`ppt/pptx`、部分专有二进制格式当前以图标展示和下载为主

## 技术栈

- TypeScript
- Next.js App Router
- PostgreSQL
- Prisma
- Tailwind CSS
- 本地文件系统 / S3-compatible / WebDAV

## 项目结构

```text
.
├── .github/
│   └── workflows/
│       └── build-image.yml
├── docs/
│   └── deployment.md
├── prisma/
│   └── schema.prisma
├── scripts/
│   ├── deploy.sh
│   └── rollback.sh
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assets/[id]/route.ts
│   │   │   ├── auth/unlock/route.ts
│   │   │   ├── entries/[id]/route.ts
│   │   │   ├── entries/[id]/share/route.ts
│   │   │   ├── entries/route.ts
│   │   │   ├── share/[token]/assets/[id]/route.ts
│   │   │   ├── settings/route.ts
│   │   │   └── v1/
│   │   │       ├── assets/[id]/route.ts
│   │   │       ├── entries/[id]/route.ts
│   │   │       ├── entries/[id]/share/route.ts
│   │   │       ├── entries/route.ts
│   │   │       └── settings/route.ts
│   │   ├── settings/page.tsx
│   │   ├── share/[token]/page.tsx
│   │   ├── unlock/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── clipboard-buttons.tsx
│   │   ├── composer.tsx
│   │   ├── entry-actions.tsx
│   │   ├── entry-card.tsx
│   │   ├── i18n-provider.tsx
│   │   ├── locale-switcher.tsx
│   │   ├── settings-form.tsx
│   │   └── timeline-toolbar.tsx
│   ├── middleware.ts
│   └── lib/
│       ├── access-control.ts
│       ├── api-response.ts
│       ├── api-serializers.ts
│       ├── asset-previews.ts
│       ├── asset-response.ts
│       ├── entries.ts
│       ├── env.ts
│       ├── file-types.ts
│       ├── i18n-server.ts
│       ├── i18n.ts
│       ├── prisma.ts
│       ├── request-source.ts
│       ├── settings.ts
│       ├── share-links.ts
│       ├── storage.ts
│       └── utils.ts
├── storage/
│   └── uploads/
├── .env.example
├── .dockerignore
├── Dockerfile
├── docker-compose.prod.yml
├── docker-compose.yml
├── next.config.mjs
├── package.json
└── tailwind.config.ts
```

## 数据模型

核心模型位于 `prisma/schema.prisma`。

- `Entry`
  - 时间流中的一条消息或一组附件
  - 记录发送者名称、IPv4、主机名、文本内容和类型
- `Asset`
  - 附件元数据
  - 记录原始文件名、MIME、大小、存储驱动和相对路径
- `ShareLink`
  - 单条内容的分享 token 与撤销状态
- `AppSetting`
  - 基础设置，如语言、公网分享地址、内网分享地址

## API 概览

当前同时保留页面内部 API 和版本化 API。多客户端接入建议优先使用 `/api/v1/*`。

### 主要接口

- `GET /api/v1/entries`
- `POST /api/v1/entries`
- `GET /api/v1/entries/:id`
- `DELETE /api/v1/entries/:id`
- `POST /api/v1/entries/:id/share`
- `DELETE /api/v1/entries/:id/share`
- `GET /api/v1/assets/:id`
- `GET /api/v1/settings`
- `PUT /api/v1/settings`

### 返回格式

```json
{
  "ok": true,
  "data": {}
}
```

或

```json
{
  "ok": false,
  "error": {
    "message": "..."
  }
}
```

## 快速开始

### 1. 准备环境变量

```bash
cp .env.example .env
```

默认配置：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omnidrop?schema=public"
APP_NAME="OmniDrop"
DEFAULT_LOCALE="zh-CN"
STORAGE_DRIVER="local"
STORAGE_DIR="./storage/uploads"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INTERNAL_APP_URL=""
PUBLIC_ACCESS_PASSWORD=""
ACCESS_AUTH_SECRET=""

S3_ENDPOINT=""
S3_REGION="auto"
S3_BUCKET=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_FORCE_PATH_STYLE="true"

WEBDAV_BASE_URL=""
WEBDAV_ROOT="omnidrop"
WEBDAV_USERNAME=""
WEBDAV_PASSWORD=""
```

### 2. 启动 PostgreSQL

如果本机没有 PostgreSQL，可以直接使用仓库自带的 Docker Compose：

```bash
docker compose up -d
```

### 3. 安装依赖

```bash
npm install
```

### 4. 生成 Prisma Client 并同步数据库

```bash
npx prisma generate
npx prisma db push
```

### 5. 启动开发环境

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 存储配置

### 本地文件系统

```env
STORAGE_DRIVER="local"
STORAGE_DIR="./storage/uploads"
```

### S3-compatible

```env
STORAGE_DRIVER="s3"
S3_ENDPOINT="https://your-s3-endpoint"
S3_REGION="auto"
S3_BUCKET="omnidrop"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_FORCE_PATH_STYLE="true"
```

### WebDAV

```env
STORAGE_DRIVER="webdav"
WEBDAV_BASE_URL="https://dav.example.com/remote.php/dav/files/you"
WEBDAV_ROOT="omnidrop"
WEBDAV_USERNAME="..."
WEBDAV_PASSWORD="..."
```

## 分享配置

```env
NEXT_PUBLIC_APP_URL="https://drop.example.com"
INTERNAL_APP_URL="http://192.168.1.10:3000"
```

- `NEXT_PUBLIC_APP_URL` 用于公网分享链接
- `INTERNAL_APP_URL` 用于内网分享链接
- 分享菜单会同时提供公网和内网两个复制入口

## 访问控制

```env
PUBLIC_ACCESS_PASSWORD=""
ACCESS_AUTH_SECRET=""
```

- 未设置 `PUBLIC_ACCESS_PASSWORD` 时，不启用公网密码门禁
- 设置后：
  - 内网主机地址可直接访问
  - 公网主机地址需要先通过 `/unlock`
  - `/share/:token` 和对应的分享资源访问保持免密
- `ACCESS_AUTH_SECRET` 建议单独设置，用于签名公网访问 cookie；未设置时会回退使用 `PUBLIC_ACCESS_PASSWORD`

## 生产部署

- 生产环境变量应保存在部署主机，不提交到仓库
- GitHub Actions 负责构建并推送镜像
- 部署主机负责保存 `.env`、挂载上传目录并执行部署脚本
- 详细部署步骤见 [docs/deployment.md](./docs/deployment.md)

## 可用脚本

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:push
```

## 说明

- 发送来源识别依赖请求头和本机环境，主机名解析属于 best effort
- 文件内容预览为按需解析，不做数据库缓存
- 切换存储后端不会自动迁移已有附件
- 当前版本聚焦个人使用与多客户端接入基础能力，不包含复杂权限系统
