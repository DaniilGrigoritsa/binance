import { createLogger, transports, Logger } from 'winston';
import logFormat from './logFormat';


export const errorLogger: Logger = createLogger({
  transports: [new transports.File({ filename: './logs/errors.log' })],
  format: logFormat
});
