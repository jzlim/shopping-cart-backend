import { describe, it, expect } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('applies defaults when env is empty', () => {
    const config = loadConfig({});
    expect(config).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
    });
  });

  it('reads and coerces provided values', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      LOG_LEVEL: 'warn',
    });
    expect(config.NODE_ENV).toBe('production');
    expect(config.PORT).toBe(8080);
    expect(config.LOG_LEVEL).toBe('warn');
  });

  it('fails fast on a non-numeric PORT', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('fails fast on an unknown LOG_LEVEL', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'loud' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
