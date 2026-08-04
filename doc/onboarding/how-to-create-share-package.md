# 如何建立 Workspace Package

本專案使用 Bun workspaces。新增 package 不需要 generator、`project.json`、TypeScript path alias 或自訂 export condition。

## 1. 建立目錄

```text
packages/example/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

## 2. 定義標準 package exports

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

## 3. TypeScript 設定

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

## 4. 註冊建置順序

根目錄的 `build:packages` 依 dependency direction 排列。把新 package 放在它的 dependencies 之後、consumers 之前。Bun 會自動從 `packages/*` 發現 workspace，不需另外註冊路徑。

## 5. 驗證

```bash
bun install
bun run --filter @platform/example build
bun run check
bun run test
bun run build
```
