# `@platform/runtime-task`

Framework-neutral task execution primitives. The package owns handler registration,
claim execution, completion/failure reporting, and retry decisions. It does not own a
polling loop, database schema, NestJS lifecycle, or Express routes.

```ts
import { TaskRunner } from '@platform/runtime-task';

const runner = new TaskRunner({
  store,
  workerId: 'worker-1',
});

runner.registerHandler('export-report', async (task) => {
  return exportReport(task.payload);
});

await runner.runOnce();
```

Implement `TaskStore` in an infrastructure adapter. A durable Postgres adapter must
validate lease ownership and fencing tokens atomically before accepting completion or
failure.

Run the package-owned suite with `bun run test:unit` from this directory.
