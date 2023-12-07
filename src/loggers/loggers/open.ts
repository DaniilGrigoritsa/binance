import { createLogger, transports, Logger } from 'winston';
import logFormat from './logFormat';


export const openLogger: Logger = createLogger({
  transports: [new transports.File({ filename: './logs/open.log' })],
  format: logFormat
});