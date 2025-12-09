import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logFormat = format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const debugLogFormat = format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level}:~ ${message}`;
});

// === Request Logger ===
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join('logs', 'requests', '%DATE%-requests.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new transports.File({
      filename: path.join('logs', 'requests', 'all-requests.log'),
      level: 'info'
    })
  ]
});

// === Info Logger ===
const infoLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join('logs', 'info', '%DATE%-info.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new transports.File({
      filename: path.join('logs', 'info', 'all-info.log'),
      level: 'info'
    })
  ]
});

// === Debug/Action Logger ===
const debugLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
    debugLogFormat
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join('logs', 'debug', '%DATE%-debug.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new transports.File({
      filename: path.join('logs', 'debug', 'all-debug.log'),
      level: 'info'
    })
  ]
});


function infoLog(...args: any) {
  const [message, ...rest] = args;
  if (rest.length) {
    infoLogger.info(message, Object.assign({}, ...rest));
  } else {
    infoLogger.info(message);
  }
}

function debugLog(...args: any) {
  const [message, ...rest] = args;
  if (rest.length) {
    debugLogger.info(message, Object.assign({}, ...rest));
  } else {
    debugLogger.info(message);
  }
}


export { logger, infoLogger, debugLogger , infoLog, debugLog};
