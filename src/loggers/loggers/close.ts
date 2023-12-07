import { createLogger, transports, Logger } from 'winston';
import logFormat from './logFormat';


export const closeLogger: Logger = createLogger({
  transports: [new transports.File({ filename: './logs/close.log' })],
  format: logFormat
});