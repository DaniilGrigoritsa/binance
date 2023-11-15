import { type FuturesPosition } from 'binance';


type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Position = Pick<FuturesPosition, "symbol" | "positionSide" | "positionAmt">

export type Frame = Unpacked<['1d', '3h', '6h', '4h', '2h', '1h']>

export type Indicator = Unpacked<['MA', 'TR', 'SI']>