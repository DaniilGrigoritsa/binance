import dotenv from 'dotenv';
import express from 'express';
import signal from './routes/signal';
import { Binance } from './exchanges/binance';
import { Exchange } from './exchanges/abstract';
import { whiteList } from './middlewares/strictAccess';
import { Storage, KeyValueStore } from './storage/storage'
import cors from 'cors';

 
dotenv.config({path: "../.env"});
const app = express();

const port = process.env.PORT || 8080;
const access: string = process.env.ACCESS || "";
const secret: string = process.env.SECRET || "";

let storage: KeyValueStore<number> = new Storage<number>();
let binance: Exchange = new Binance(access, secret);

binance.createWsDataStream();

app.use(express.json());
app.use(cors());

app.post(
  '/signal',
  whiteList([
    '::1',
    '52.89.214.238', 
    '34.212.75.30', 
    '54.218.53.128', 
    '52.32.178.7'
  ]),
  signal(storage, binance)
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export const quantity: string = process.env.BASE_QUANTITY ? process.env.BASE_QUANTITY : "0.1";