# 全端專案架構與開發指南

本文件彙整 monorepo-auth-fullstack 的專案結構、前後端架構設計、上手流程、程式撰寫與開發標準，並保留原有的環境啟動教學，協助新成員快速融入專案。

---

## 1. 專案結構介紹

```
monorepo-auth-fullstack/
├── backend/                # NestJS + Drizzle 資料層與 API
├── frontend/               # SvelteKit + Tailwind 前端專案
├── doc/                    # 開發／流程文件（本檔案等）
├── project-progress/       # 進度追蹤與工作項目
├── SQLScripts/             # 資料庫相關 SQL
├── scripts/                # 自動化腳本（如部署、產生資料）
├── docker-compose.yml      # 一次啟動所有服務
└── README.md               # 總覽說明
```

| 目錄 | 說明 |
| --- | --- |
| `backend/src/auth` | 登入、註冊、Session 等核心模組，提供 controller/service/dto/repository。 |
| `backend/src/common` | 共用攔截器（`ResponseInterceptor`）、管線與工具。 |
| `backend/src/db` | Drizzle ORM 設定、schema、資料存取。 |
| `backend/src/user` | User repository 與 domain 邏輯。 |
| `frontend/src/routes` | SvelteKit 檔案式路由（`auth/login`, `auth/signup`, `user/*` 等）。 |
| `frontend/src/lib/api` | HTTP client 與 API 包裝（`httpClient.ts`, `auth.ts`）。 |
| `frontend/src/lib/store` | 全域 store（`authStore.ts`）處理 session 狀態。 |
| `frontend/src/lib/module` | feature 細分的 UI/邏輯模組（例如登入表單）。 |
| `frontend/src/lib/components` | UI 元件庫（Bits UI wrapper、App Sidebar 等）。 |
| `project-progress/` | 每日里程碑與工作項目清單。 |

---

## 2. 延伸閱讀

為維持文件聚焦，以下主題已拆出獨立檔案，請依需求參考：

- [Frontend 架構說明](./frontend-architect.md)
- [Backend 架構說明](./backend-architect.md)
- [Frontend Onboarding Guide](./frontend-onboarding.md)
- [Backend Onboarding Guide](./backend-onboarding.md)

---

## 3. 開發環境啟動指南

### 3.1 使用 Docker Compose 一次啟動全部服務

- 先決條件：已安裝 Docker Desktop / Docker Engine（包含 Compose v2）。
- 第一次啟動前，確認 `backend/.env` 已存在；若沒有，可執行 `cp backend/.env.example backend/.env` 並依需求調整 `PORT / API_BASE_URL`（後端對外位址）。
- 在專案根目錄執行：

```bash
docker compose up --build
```

- 服務啟動後：
  - 前端（SvelteKit）位於 `http://localhost:5173`
  - 後端（NestJS）位於 `http://localhost:3333`（或 .env 設定的 `PORT`）
  - Postgres 位於 `localhost:5432`

**常用指令**

```bash
# 以背景模式啟動
docker compose up -d

# 只啟動資料庫（本機跑後端時常用）
docker compose up -d db

# 查看特定服務日誌
docker compose logs -f backend

# 停止並清理容器（保留卷）
docker compose down
```

若為首次啟動，容器就緒後建議套用 Drizzle 遷移：

```bash
docker compose exec backend npm run db:migrate
```

Swagger 文件位於 `http://localhost:3333/openapi`。

### 3.2 僅啟動後端（NestJS + Drizzle）

1. 安裝 Node.js 20+ 與 npm。
2. 設定環境變數：`cp backend/.env.example backend/.env`，依需求調整 `PORT`、`API_BASE_URL`（提供給前端的 Origin）與 `DATABASE_URL`。
3. 確保 Postgres 已啟動（可使用 `docker compose up -d db`）。
4. 安裝依賴並啟動：

```bash
cd backend
npm install
npm run start:dev
```

5. 如有 schema 更新，執行：

```bash
npm run db:migrate
```

後端預設監聽 `http://localhost:3333`。

### 3.3 僅啟動前端（SvelteKit）

1. 安裝 Node.js 20+ 與 npm。
2. 設定前端環境變數：`cp frontend/.env.example frontend/.env` 並將 `VITE_API_BASE_URL` 對應到你的後端 `API_BASE_URL`。
3. 安裝依賴並啟動開發伺服器：

```bash
cd frontend
npm install
npm run dev
```

4. 前端會連線到 `AppConfig.apiBaseUrl`（以 `VITE_API_BASE_URL` 為準，預設 `http://localhost:3333`）。
5. 瀏覽 `http://localhost:5173` 進行開發。

---

如有任何流程或標準需補充，請在 `project-progress` 或 `doc/` 目錄新增工作項並提出 PR。
