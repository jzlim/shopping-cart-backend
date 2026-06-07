import { z } from 'zod';

/**
 * Environment-based configuration, validated once at startup. Parsing through a
 * Zod schema means the process *fails fast* on a bad value (e.g. PORT="abc")
 * instead of surfacing a confusing error later, and every consumer gets a fully
 * typed `Config` with no `process.env` access scattered through the codebase.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type Config = z.infer<typeof envSchema>;

/** Parse and validate configuration, throwing a readable error on failure. */
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  return parsed.data;
};
