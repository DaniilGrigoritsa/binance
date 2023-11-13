import { createLogger, transports, Logger } from 'winston';
import logFormat from './logFormat';

export const openLogger: Logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [new transports.File({ filename: './logs/open.log' })],
});
