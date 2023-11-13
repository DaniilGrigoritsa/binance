import { format } from 'winston';

const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format.metadata(),
  format.json({space: 4})
  // format.printf(({ timestamp, level, message }) => {
  //   // Используйте metadata.timestamp для отображения timestamp
  //   return `${timestamp}: ${message}`;
  // })
);

export default logFormat;
