# 開發環境啟動指南

## 需求

- Bun 1.3+
- Node.js 22.12+（NestJS 仍以 Node.js 作為正式 runtime）
- Docker Desktop / Docker Engine（完整本機環境才需要）

## 第一次安裝

```bash
bun install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
```

## 本機啟動

同時啟動 API 與 Web：

```bash
bun run dev
```

分別啟動：

```bash
bun run dev:api
bun run dev:web
bun run --filter @platform/storybook dev
```

`bun run dev` 會先建置內部 packages，確保 API 與 Web 使用標準 package exports。

## Docker Compose

```bash
docker compose up --build
```

常用操作：

```bash
docker compose up -d db minio createbuckets
docker compose logs -f api
docker compose logs -f web
docker compose down
```

服務位置：

- Web：`http://localhost:5173`
- API：`http://localhost:3333/v1`
- OpenAPI：`http://localhost:3333/openapi`
- PostgreSQL：`localhost:5432`
- MinIO：`http://localhost:9001`

容器映像在 build 階段執行 `bun install --frozen-lockfile`；服務啟動時不會再動態安裝 dependencies。

## Database migrations

`apps/migrator/drizzle` 是唯一 migration history：

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```

新增或修改 schema 時，請在擁有該資料表的 capability package 中編輯 `*.schema.ts`，再由 migrator 產生 migration。不要另建第二套 Supabase migration history。

## 提交前驗證

```bash
bun install --frozen-lockfile
bun run check
bun run test
bun run build
bun run lint
```
