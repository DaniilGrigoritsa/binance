import { createLogger, transports, Logger } from 'winston';
import logFormat from './logFormat';

export const closeLogger: Logger = createLogger({
  level: 'error',
  format: logFormat,
  transports: [new transports.File({ filename: './logs/close.log' })],
});
