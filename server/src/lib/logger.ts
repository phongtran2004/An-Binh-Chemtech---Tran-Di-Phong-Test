/**
 * Structured Logger — Replaces raw console.log calls with a consistent,
 * production-ready logging interface.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Structured JSON output for machine parsing
 * - Human-readable format in development
 * - Context tagging for tracing (e.g., [Worker], [API])
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LEVEL];
}

function formatLog(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === 'production') {
    // Structured JSON for production log aggregation
    return JSON.stringify({ timestamp, level, context, message, ...meta });
  }

  // Human-readable for development
  const levelIcons: Record<LogLevel, string> = {
    debug: '🔍',
    info: '📋',
    warn: '⚠️',
    error: '❌',
  };
  const icon = levelIcons[level];
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${icon} [${context}] ${message}${metaStr}`;
}

function createLogger(context: string) {
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('debug')) console.debug(formatLog('debug', context, message, meta));
    },
    info(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('info')) console.log(formatLog('info', context, message, meta));
    },
    warn(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('warn')) console.warn(formatLog('warn', context, message, meta));
    },
    error(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('error')) console.error(formatLog('error', context, message, meta));
    },
  };
}

export const logger = {
  api: createLogger('API'),
  worker: createLogger('Worker'),
  template: createLogger('Template'),
  codex: createLogger('Codex'),
  system: createLogger('System'),
};
