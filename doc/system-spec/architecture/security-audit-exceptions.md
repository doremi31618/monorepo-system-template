# Security Audit Exceptions

安全稽核預設阻擋所有 high／critical advisory。例外必須記錄 advisory、原因、暴露面、移除條件與複查日期；不可用 package name 或 severity 整批略過。

## `GHSA-r5fr-rjxr-66jc` — lodash `_.template` imports key injection

- 狀態：暫時忽略單一 advisory。
- 原因：截至 2026-08-31，registry 沒有高於受影響範圍 `<=4.17.23` 的 lodash release；audit 建議的 `4.17.24` 尚不可安裝。
- 暴露面：目前只由 Nest/Swagger/Vite declaration tooling 間接使用；專案沒有把使用者輸入傳入 `_.template` 的 `imports` key。
- 移除條件：lodash 發布已修補版本，或所有上游移除該相依後，立即刪除 `deps:audit` 的 `--ignore`。
- 下次複查：2026-09-30，或任何 lockfile 更新時（以較早者為準）。
