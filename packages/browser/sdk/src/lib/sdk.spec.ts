import { Frontend, SDK } from './sdk.js';

describe('sdk', () => {
  it('exposes the frontend SDK through the stable namespace', () => {
    expect(SDK.Frontend).toBe(Frontend);
    expect(Frontend.HttpClient).toBeDefined();
  });
});
