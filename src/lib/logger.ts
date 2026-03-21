type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  sessionId?: string;
  surveyId?: string;
  round?: number;
  durationMs?: number;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...context,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
};
