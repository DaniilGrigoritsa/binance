import dotenv from 'dotenv';
import express from 'express';
import signal from './routes/signal';
import { Binance } from './exchanges/binance';
import { Exchange } from './exchanges/abstract';
import { whiteList } from './middlewares/strictAccess';
import { Storage, KeyValueStore } from './storage/storage';
import cors from 'cors';
import "./config/config";
import { access, secret, port, WHITE_LIST } from './config/config';

 
dotenv.config({path: "../.env"});

const app = express();

let storage: KeyValueStore<number> = new Storage<number>();
let binance: Exchange = new Binance(access, secret);

binance.createWsDataStream();

app.use(express.json());
app.use(cors());

app.post(
  '/signal',
  whiteList(WHITE_LIST),
  signal(storage, binance)
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});