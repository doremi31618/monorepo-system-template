# 如何建立 Shared Package

本專案採用 Nx Monorepo 架構。建立新的共用套件 (Shared Package) 有兩種方式，推薦使用 **Nx Generator**。

## 📍 方法一：使用 Nx Generator (推薦)

這是最標準且省事的做法，Nx 會自動幫你設定好 `tsconfig.base.json` 的路徑映射 (`paths`) 以及專案基本結構。

### 步驟

1.  **執行建立指令**
    ```bash
    # 範例：建立一個叫做 "api-client" 的 Library，放在 share 資料夾下
    npx nx g @nx/js:library share/api-client --importPath=@share/api-client --bundler=tsc
    ```

    *   `share/api-client`: 專案在檔案系統中的路徑。
    *   `--importPath=@share/api-client`: 設定在程式碼中引用的路徑 (即 `tsconfig.base.json` 的 `paths` 名稱)。
    *   `--bundler=tsc`: 選擇使用 TypeScript Compiler (或者可以用 `vite`/`rollup`，視需求而定)。

2.  **確認設定**
    指令執行完後，Nx 會自動更新以下檔案：
    *   `tsconfig.base.json`: 增加 `@share/api-client` 的路徑。
    *   `share/api-client/project.json`: Nx 的專案設定檔。

### 後續調整 (Optional)
Nx 生成的預設 `package.json` 可能需要微調，以符合我們的 Monorepo 規範（例如 export conditions）：
*   確認 `package.json` 有 `"type": "module"` (如果專案是 ESM)。
*   調整 `exports` 欄位以支援 source resolution (如下方手動說明)。

---

## 📍 方法二：手動建立 (Manual)

如果你需要完全控制檔案結構，或是遷移既有程式碼。

### 步驟

1.  **建立資料夾**
    ```bash
    mkdir -p share/my-lib/src
    ```

2.  **初始化 `package.json`**
    在 `share/my-lib/package.json` 加入：
    ```json
    {
      "name": "@share/my-lib",
      "version": "0.0.1",
      "type": "module",
      "main": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "exports": {
        ".": {
          "monorepo-system-template": "./src/index.ts", 
          "import": "./dist/index.js",
          "default": "./dist/index.js"
        }
      }
    }
    ```
    > **注意**: `monorepo-system-template` 是一個自定義的 Export Condition，讓我們在開發時可以直接讀取 `.ts` 原始碼，而不需要一直 build。

3.  **建立 `tsconfig.json`**
    繼承根目錄的設定。
    ```json
    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src"
      },
      "include": ["src/**/*.ts"]
    }
    ```

4.  **註冊路徑 (最重要!)**
    打開根目錄的 `tsconfig.base.json`，在 `packages` 和 `paths` 加入對應設定：
    ```json
    {
      "compilerOptions": {
        "paths": {
          "@share/my-lib": ["share/my-lib/src/index.ts"]
        }
      }
    }
    ```

5.  **加入 Workspace**
    確認根目錄 `package.json` 的 `workspaces` 包含該路徑 (目前設定為 `share/*`，所以只要放在 share 資料夾下會自動抓到)。

---

## 💡 常見問題

### 前端讀不到新的 Package？
請檢查：
1.  `frontend/vite.config.ts` 是否有設定 `resolve.conditions: ['root-project-name']`。
2.  `frontend/tsconfig.json` 是否有設定 `"customConditions": ["root-project-name"]`。

### 後端讀不到？
後端 (NestJS) 主要依靠 `tsconfig.base.json` 的 `paths` 設定。請確保 `backend/tsconfig.json` 有 `extends: "../tsconfig.base.json"`。
