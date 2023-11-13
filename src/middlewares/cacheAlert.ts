import { Response, NextFunction } from 'express';
import allertLogger from '../loggers/alert';


const cacheAlert = (req: any, res: Response, next: NextFunction) => {
  const [exchange, pair, timeframe, indicator, value] = (req.body as string).split(' ')
  allertLogger.info('Получен сигнал', {exchange, pair, timeframe, indicator, value});
  next();
}


export default () => {
  return cacheAlert;
}
