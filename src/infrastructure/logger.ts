import pino, { type Logger } from 'pino';

export type { Logger };

/**
 * Structured (JSON) logging via pino. JSON lines are what log aggregators
 * (CloudWatch, Loki) ingest natively, so this is the production-friendly
 * default. The single knob is the level, taken from validated config.
 */
export const createLogger = (level: string): Logger => pino({ level });
