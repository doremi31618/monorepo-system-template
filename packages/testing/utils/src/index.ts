export type MockLogger = {
  setContext: (...args: unknown[]) => unknown;
  log: (...args: unknown[]) => unknown;
  error: (...args: unknown[]) => unknown;
  warn: (...args: unknown[]) => unknown;
  debug: (...args: unknown[]) => unknown;
};

export function createMockLogger(mockFn: () => (...args: unknown[]) => unknown): MockLogger {
  return {
    setContext: mockFn(),
    log: mockFn(),
    error: mockFn(),
    warn: mockFn(),
    debug: mockFn(),
  };
}
