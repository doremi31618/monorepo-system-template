# 如何建立 Workspace Package

本專案使用 Bun workspaces。新增 package 不需要 generator、`project.json`、TypeScript path alias 或自訂 export condition。

## 1. 建立目錄

```text
packages/example/
├── README.md
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

README 第一段必須寫明 framework/runtime，例如「無（純 TypeScript）」、
「NestJS 10」或「Svelte 5」，並包含用途、主要 exports 與最小使用範例。

## 2. 先決定名稱與邊界

- 框架中立：`@platform/<capability>`，不得 import NestJS、Express、Svelte、SvelteKit 或 Drizzle。
- 框架 adapter：`@platform/<framework>-<大模組>`。
- 關聯子模組：`@platform/<framework>-<大模組>-<子模組>`，例如 `@platform/nest-auth-access-control`。
- DTO、class-validator、controller 與 framework decorator 回到所屬 adapter；只有多個模組真正共用且不限制 framework 的型別才放 shared contracts。

## 3. 定義標準 package exports

```json
{
  "name": "@platform/example",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

內部 dependency 一律使用：

```json
{
  "dependencies": {
    "@platform/contracts": "workspace:*"
  }
}
```

## 4. TypeScript 設定

```json
{
  "extends": "../../tsconfig.package.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"]
}
```

## 5. 註冊建置順序

根目錄的 `build:packages` 依 dependency direction 排列。把新 package 放在它的 dependencies 之後、consumers 之前。Bun 會自動從 `packages/*` 發現 workspace，不需另外註冊路徑。

## 6. 如何「使用插件」

本專案沒有掃描目錄後自動載入的 plugin registry。Capability package 是由 deployable
app 明確組裝：Nest package 在 app module 的 `imports` 加入 module，再注入公開 service；
Svelte package則由 app route/component 直接 import。這能讓 runtime、依賴與權限邊界在
code review 時可見。

Remote MCP 是同一規則：app 匯入 `NestMcpServerModule` 與業務 module，直接把業務
service 註冊成 tool；詳細範例見 [如何新增 Remote MCP Tool](./how-to-add-remote-mcp-tool.md)。

## 7. 驗證

```bash
bun install
bun run --filter @platform/example build
bun run deps:check
bun run deps:graph
bun run check
bun run test
bun run build
```
