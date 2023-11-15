import dotenv from 'dotenv';

dotenv.config({path:__dirname.concat('/./../../.env')});

export const port = process.env.PORT || 8080;
export const access: string = process.env.ACCESS || "";
export const secret: string = process.env.SECRET || "";
export const quantity: string = process.env.BASE_QUANTITY || "";
export const WHITE_LIST = [
    '::1',
    '52.89.214.238', 
    '34.212.75.30', 
    '54.218.53.128', 
    '52.32.178.7'
] || []

export const PRECISION = 2;
export const STOP_LOSS_PERCENTAGE = 0.2;
export const TAKE_PROFIT_PERCENTAGE = 0.1;