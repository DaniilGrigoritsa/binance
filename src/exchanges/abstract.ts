import { Position } from "../types/types";
import { Signal } from "../utils/parceAlert";
import { OrderSide, MarginType } from "binance";
import { KeyValueStore } from "../storage/storage";


export interface Exchange {

    createOrderWithTpSl: (
        quantity: string, 
        symbol: string,
        side: OrderSide,
        leverage: number
    ) => Promise<void>;

    getOpenedPosition: (symbol: string) => Promise<Position | null>;

    closePosition: (position: Position) => Promise<void>;

    checkRequirements: (storage: KeyValueStore<number>, data: Signal) => Promise<boolean>;

    getAmountIn: () => Promise<string>;

    createWsDataStream: (isTestnet: boolean) => Promise<void>;

    setLeverage: (leverage: number, symbol: string) => Promise<void>;

    setIsolatedMargin: (marginType: MarginType, symbol: string) => Promise<number>;
};
