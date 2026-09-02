# 套件相依圖

> 此檔案由 `bun run deps:graph` 產生，請勿手動修改。箭頭表示「來源依賴目標」。

```mermaid
flowchart LR
  P0["@platform/api"]
  P1["@platform/browser-sdk"]
  P2["@platform/nest-content-assets"]
  P3["@platform/nest-content-cms"]
  P4["@platform/nest-identity-access-control"]
  P5["@platform/nest-identity-auth"]
  P6["@platform/nest-identity-users"]
  P7["@platform/nest-infra-database"]
  P8["@platform/nest-infra-logger"]
  P9["@platform/nest-infra-mail"]
  P10["@platform/nest-infra-scheduling"]
  P11["@platform/storybook"]
  P12["@platform/svelte-ui"]
  P13["@platform/test-utils"]
  P14["@platform/types-content"]
  P15["@platform/types-identity"]
  P16["@platform/types-shared"]
  P17["@platform/web"]
  P0 --> P2
  P0 --> P3
  P0 --> P4
  P0 --> P5
  P0 --> P6
  P0 --> P7
  P0 --> P8
  P0 --> P9
  P0 --> P10
  P0 --> P16
  P1 --> P16
  P2 --> P6
  P2 --> P14
  P3 --> P2
  P3 --> P6
  P3 --> P14
  P4 --> P5
  P4 --> P6
  P4 --> P7
  P4 --> P8
  P4 --> P15
  P5 --> P6
  P5 --> P7
  P5 --> P8
  P5 --> P9
  P5 --> P10
  P5 --> P15
  P6 --> P7
  P6 --> P15
  P9 --> P7
  P10 --> P7
  P10 --> P8
  P11 --> P12
  P17 --> P1
  P17 --> P12
  P17 --> P14
  P17 --> P15
  P17 --> P16
```

## 套件位置

- `@platform/api` — `apps/api`
- `@platform/browser-sdk` — `packages/browser/sdk`
- `@platform/nest-content-assets` — `packages/nest/content/assets`
- `@platform/nest-content-cms` — `packages/nest/content/cms`
- `@platform/nest-identity-access-control` — `packages/nest/identity/access-control`
- `@platform/nest-identity-auth` — `packages/nest/identity/auth`
- `@platform/nest-identity-users` — `packages/nest/identity/users`
- `@platform/nest-infra-database` — `packages/nest/infra/database`
- `@platform/nest-infra-logger` — `packages/nest/infra/logger`
- `@platform/nest-infra-mail` — `packages/nest/infra/mail`
- `@platform/nest-infra-scheduling` — `packages/nest/infra/scheduling`
- `@platform/storybook` — `apps/storybook`
- `@platform/svelte-ui` — `packages/svelte/ui`
- `@platform/test-utils` — `packages/testing/utils`
- `@platform/types-content` — `packages/types/content`
- `@platform/types-identity` — `packages/types/identity`
- `@platform/types-shared` — `packages/types/shared`
- `@platform/web` — `apps/web`
