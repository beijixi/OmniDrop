# 部署说明

本文档描述 `OmniDrop` 的通用单机部署方式：`GitHub 构建公开镜像 + 部署主机一键部署`。

## 目标结构

- 应用宿主机：任意可运行 Docker Compose 的 Linux 主机
- 数据库：外部 PostgreSQL
- 应用端口：由部署主机 `.env` 决定
- 部署目录：由部署主机自行决定
- 上传目录：挂载到容器内 `/app/storage/uploads`

仓库中的生产文件：

- [`Dockerfile`](../Dockerfile)
- [`docker-compose.prod.yml`](../docker-compose.prod.yml)
- [`scripts/deploy.sh`](../scripts/deploy.sh)
- [`scripts/rollback.sh`](../scripts/rollback.sh)
- [`.github/workflows/build-image.yml`](../.github/workflows/build-image.yml)

## 镜像发布

镜像由 GitHub Actions 自动构建并推送到你配置的镜像仓库。

- `main` 分支会产出 `main` 标签镜像
- `v*` tag 可用于产出同名版本镜像

如果你使用公开镜像仓库，部署主机通常不需要额外登录即可拉取。

## 部署主机准备

在部署主机上准备一个目录，用于保存：

- `docker-compose.prod.yml`
- `.env`
- `scripts/deploy.sh`
- `scripts/rollback.sh`
- 上传目录

目录结构示例：

```text
<deploy-root>
├── .env
├── docker-compose.prod.yml
├── scripts/
│   ├── deploy.sh
│   └── rollback.sh
└── storage/
    └── uploads/
```

说明：

- `<deploy-root>` 请替换成你自己的部署目录
- 仓库中不应提交任何主机专属路径、域名或口令
- 这些值统一保存在部署主机的 `.env` 中

## 部署主机 `.env`

生产环境变量应直接写在部署主机的 `.env` 中，不提交到仓库。

下面是一份通用示例，请按你的实际环境填写：

```env
IMAGE_NAME=ghcr.io/<your-org-or-user>/omnidrop
IMAGE_TAG=main
APP_PORT=3000

DATABASE_URL=postgresql://<db-user>:<db-password>@<db-host>:5432/<db-name>?schema=public

APP_NAME=OmniDrop
DEFAULT_LOCALE=zh-CN

STORAGE_DRIVER=local
STORAGE_DIR=/app/storage/uploads

NEXT_PUBLIC_APP_URL=https://<your-public-host>
INTERNAL_APP_URL=http://<your-internal-host>:3000

PUBLIC_ACCESS_PASSWORD=<public-access-password>
ACCESS_AUTH_SECRET=<random-long-secret>
PUBLIC_ACCESS_CAPTCHA_THRESHOLD=3
PUBLIC_ACCESS_ATTEMPT_WINDOW_MINUTES=15
PUBLIC_ACCESS_CAPTCHA_TTL_MINUTES=5
```

说明：

- `NEXT_PUBLIC_APP_URL` 必须带协议头，如 `http://` 或 `https://`
- `INTERNAL_APP_URL` 必须带协议头；如果不需要内部入口可留空
- `PUBLIC_ACCESS_PASSWORD` 用于公开入口的访问密码
- `ACCESS_AUTH_SECRET` 建议设置为与密码不同的长随机字符串
- 默认连续输错 3 次后会要求输入本地验证码，不做 IP 封禁
- 当前本地文件存储模式下，容器内目录固定为 `/app/storage/uploads`

## 部署命令

切到部署目录后执行：

```bash
cd <deploy-root>
./scripts/deploy.sh
```

如果要部署某个版本 tag：

```bash
cd <deploy-root>
./scripts/deploy.sh v0.2.0
```

部署脚本会自动完成：

1. 拉取镜像
2. 执行 `prisma db push`
3. 启动或更新容器
4. 进行健康检查

## 回滚

回滚到旧版本时执行：

```bash
cd <deploy-root>
./scripts/rollback.sh <image-tag>
```

例如：

```bash
./scripts/rollback.sh v0.2.0
```

## 访问控制

- 未设置 `PUBLIC_ACCESS_PASSWORD` 时，不启用公开入口密码门禁
- 设置后，公开入口需要先通过 `/unlock`
- `/share/:token` 以及对应的分享资源访问保持免密
- 当前版本优先按请求 `Host` 判断入口地址，这更适合域名访问、端口映射和反向代理场景

## 部署建议

- 生产环境的真实域名、端口、目录和口令只保存在部署主机 `.env`
- 仓库文档和示例配置仅保留通用占位符
- 如果你有多台主机或多套环境，为每个环境维护独立的 `.env`
