# Implementation Guide: CI/CD & Backend Scheduling (R1-03)

> **Related Task**: [R1-core-project-task](../project-tasks/R1-core-project-task.md) | **Roadmap**: [R1-core](../Roadmap/R1-core.md)

本指南涵蓋 R1 Milestone 最後兩項核心基礎建設：
1. **CI/CD**: 自動化建置與測試管道 (GitHub Actions + Nx)。
2. **Backend Scheduling**: 基於 PostgreSQL 的分散式排程機制 (避免 Redis 依賴)。

---

## Part 1: CI/CD (Nx + GitHub Actions)

### 1-1. Why? (為什麼需要？)
- **品質閘門 (Quality Gate)**: 確保每一筆 PR 合併前都通過 Build, Lint, Test。
- **Monorepo 效率**: 隨著專案變大，全量跑測試太慢。Nx 的 `affected` 機制能分析 Git 變更，**只針對受影響的專案**執行任務，大幅縮短 CI 時間。
- **一致性**: 確保本地通過的程式碼在乾淨的 CI 環境也能通過，避免 "Works on my machine" 問題。

### 1-2. Technology Stack (技術原理)

#### GitHub Actions
GitHub 提供的 CI/CD 平台。透過 YAML 定義 workflow，當特定事件 (push, pull_request) 發生時觸發。
- **Jobs & Steps**: 定義執行步驟 (checkout code, setup node, run commands)。
- **Caching**: 快取 `node_modules` 以加速安裝。

#### Nx CI Features
- **Nx Affected**: 透過比較當前 commit 與 base commit (通常是 `master` or `origin/master`)，計算出 Dependency Graph 中受影響的節點。
    - 例如：改了 `@share/contract`，則依賴它的 `backend` 和 `frontend` 都會被標記為 affected。
- **Target Defaults**: 在 `nx.json` 定義任務依賴 (e.g., build 之前要先 build dependencies)。

### 1-3. Implementation Steps (實作步驟)

#### Step 1: Create Workflow File
建立 `.github/workflows/ci.yml`。

```yaml
name: CI

on:
  push:
    branches:
      - master
  pull_request:

permissions:
  actions: read
  contents: read

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 必須抓取完整 history 讓 Nx 分析 commits

      # 1. 安裝 pnpm (如果專案是用 pnpm)
      - uses: pnpm/action-setup@v2
        with:
          version: 9

      # 2. Setup Node.js + Cache
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      # 3. Install Dependencies
      - run: pnpm install --frozen-lockfile

      # 4. Nx Lint (Affected)
      - run: npx nx affected -t lint --parallel=3
      
      # 5. Nx Test (Affected)
      - run: npx nx affected -t test --parallel=3 --configuration=ci

      # 6. Nx Build (Affected)
      - run: npx nx affected -t build --parallel=3
```

#### Step 2: Configure Nx Base
確保 `nx.json` 正確設定 `defaultBase`，讓 Nx 知道要跟哪個分支比較。

```json
// nx.json
{
  "defaultBase": "master", 
  // ...
}
```

#### Step 3: Verification (驗收)
1. 發一個 PR 修改 `frontend` 的一個檔案。
2. 觀察 GitHub Actions Log，確認 `nx affected` 只有跑 `frontend` 相關任務，而跳過無關的 `backend`。

---

## Part 2: Backend Scheduling (Postgres-Based Queue)

### 2-1. Why? (為什麼需要？)
- **水平擴展問題 (Scaling Issue)**: 當後端部署多個實例 (Replicas) 時，若使用單純的 `@Cron`，每個實例都會同時執行同一個任務 (e.g., 每天凌晨發送報表)，導致重複執行。
- **避免過早引入 Redis**: 標準解法是 Redis/BullMQ，但在專案初期 (R1)，引入 Redis 增加運維複雜度。
- **現有資源利用**: PostgreSQL 9.5+ 支援 `SKIP LOCKED`，可以完美實作 "Job Queue" 且具備 ACID 特性。

### 2-2. Technology Stack (技術原理)

#### JobSchedulerPort (Hexagonal Architecture)
定義一個介面 (Port)，讓業務邏輯不依賴具體排程實作。未來若改用 Redis，只需換掉 Adapter。

#### PostgreSQL Concurrency Features
- **Idempotency (冪等性)**:
    - 利用 `UNIQUE KEY (job_name, scheduled_time)` 防止重複產生任務。
    - `INSERT ... ON CONFLICT DO NOTHING`。
- **Consumer Locking (搶占鎖)**:
    - `SELECT ... FOR UPDATE SKIP LOCKED`: 這是關鍵。當多個 Worker 同時去 DB 撈任務時，DB 會自動跳過「已被鎖定」的行，讓每個 Worker 撈到不重複的任務。

### 2-3. Implementation Steps (實作步驟)

#### Step 1: Define Interface (Port)
`backend/src/core/domain/scheduling/scheduler.port.ts`

```typescript
export interface Job {
  id: string;
  name: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  runAt: Date;
}

export abstract class JobSchedulerPort {
  // 生產者：排程一個任務
  abstract schedule(name: string, data: any, runAt: Date): Promise<void>;
  
  // 消費者：宣告自己可以處理哪些任務
  abstract registerHandler(name: string, handler: (job: Job) => Promise<void>): void;
}
```

#### Step 2: Create Schema (Adapter)
`backend/src/core/infra/scheduling/scheduling.schema.ts`

```typescript
import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  data: jsonb('data').default({}),
  status: text('status').$type<'pending' | 'processing' | 'completed' | 'failed'>().default('pending'),
  runAt: timestamp('run_at').notNull(),
  lockedAt: timestamp('locked_at'), // 用於超時重試
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    // 關鍵：確保同一時間、同名任務不重複
    uniqueJob: uniqueIndex('unique_job_idx').on(table.name, table.runAt), 
  };
});
```

#### Step 3: Implement Postgres Adapter (Service)
`backend/src/core/infra/scheduling/postgres-scheduler.service.ts`

1. **Worker Loop**: 使用 `setInterval` 每秒輪詢 DB。
2. **Fetch Job**:
   ```typescript
   // Pseudo-SQL via Drizzle
   /*
     UPDATE jobs 
     SET status = 'processing', locked_at = NOW()
     WHERE id = (
       SELECT id FROM jobs 
       WHERE status = 'pending' AND run_at <= NOW()
       ORDER BY run_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING *;
   */
   ```
3. **Dispatch**: 找到對應的 Handler 執行。
4. **Complete**: 執行成功更新 status='completed'，失敗更新 'failed'。

#### Step 4: Integration
在 `CoreModule` 或 `InfraModule` 提供 `JobSchedulerPort` 的實作 `PostgresSchedulerService`。

---

## 總結
完成這兩項後，R1 Core 將具備標準的 **DevOps 流程** 與 **可擴展的背景任務能力**，為後續 Feature 開發打下穩固基礎。
