import { createLogger, transports, Logger } from 'winston';
import logFormat from './logFormat';


export const alertLogger: Logger = createLogger({
  transports: [new transports.File({ filename: './logs/alerts.log' })],
  format: logFormat
});
