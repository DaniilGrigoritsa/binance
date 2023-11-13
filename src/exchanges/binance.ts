import axios from "axios";
import { 
    OrderSide,
    USDMClient, 
    NewFuturesOrderParams, 
    type MarginType,
    type OrderResult,
    type FuturesPosition,
    type ModeChangeResult,
    type FuturesAccountBalance,
    type CancelMultipleOrdersParams,
} from "binance";
import { type Position } from "../types/types";

import { Exchange } from "./abstract";
import { Signal } from "../utils/parceAlert";
import { KeyValueStore } from "../storage/storage";
import { alertLogger, errorLogger, closeLogger, openLogger } from "../loggers/index";

import calculateStopLoss from "../utils/calculateStopLoss";
import calculateTakeProfit from "../utils/calculateTakeProfit";


export class Binance implements Exchange {
    access: string;
    secret: string;
    client: USDMClient;

    constructor(
        access: string, 
        secret: string
    ) {
        this.access = access;
        this.secret = secret;
        this.client = new USDMClient({
            api_key: this.access,
            api_secret: this.secret,
            baseUrl: "https://testnet.binancefuture.com"
        }, {}, true);
    }

    private getMarkPrice = async (symbol: string): Promise<number> => {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        return response.data.price;
    }
    
    private getAvailableBalance = async (): Promise<number> => {
        const response: FuturesAccountBalance[] = await this.client.getBalance();
        for(const coin of response) if (coin.asset.toUpperCase() === "USDT") return Number(coin.availableBalance);
        return 0;
    }

    private getOpenOrders = async (symbol: string): Promise<number[]> => {
        const orders: OrderResult[] = await this.client.getAllOpenOrders({symbol});
        return orders.map((order) => order.orderId);
    }

    cancelOrder = async (symbol: string, orderId: number) => {
        const response = await this.client.cancelOrder({symbol, orderId});
        console.log("response: ", response)
    }
    
    getAmountIn = async (): Promise<string> => {
        return (await this.getAvailableBalance() / 10).toString();
    }
    
    checkRequirements = async (storage: KeyValueStore<number>, data: Signal): Promise<boolean> => {
        const markPrice = await this.getMarkPrice(data.pair);
        
        // Текущая цена отличается от последней скользящей средней того же таймфрейма не более чем на 3%.
        const lastMA = storage.get(`${data.exchange}:${data.pair}:${data.frame}:MA`);
        if (!lastMA) return false;
        else if (Math.abs(markPrice - lastMA) / markPrice > 0.03) return false;
    
        // Сигнал противоположен направлению тренда 1d
        const trDaily = storage.get(`${data.exchange}:${data.pair}:1d:TR`);
        if (trDaily) {
            if (data.value === "BUY" && trDaily > 0 || data.value === "SELL" && trDaily < 0) return false;
        }
        else return false;

        // Сигнал совпадает с направлением локального тренда, в том числе по всем старшим таймфреймам (кроме 1d)
        const frames = ['1h', '2h', '3h', '4h', '6h'];
        for (let iter = frames.indexOf(data.frame); frames.length; iter++) {
            let trLocal = storage.get(`${data.exchange}:${data.pair}:${frames[iter]}:TR`);
            if (trLocal) {
                if (data.value === "BUY" && trLocal < 0 || data.value === "SELL" && trLocal > 0) return false;
            }
            else return false;
        }
        
        return true;
    }
    
    getOpenedPosition = async (symbol: string): Promise<Position | null> => {
        try {
            const positions: FuturesPosition[] = await this.client.getPositions({symbol});
            console.log("positions: ", positions)
            for (const position of positions) if (position.symbol.toUpperCase() === symbol) return position;
        }
        catch (err) { 
            console.log("Err: ", err);
            errorLogger.error(new Error("Failed to get opened positions"));
        }
        return null;
    }
    
    closePosition = async (position: Position): Promise<void> => {
        const quantity = Number(position.positionAmt);

        const closePosition: NewFuturesOrderParams<string> = {
            quantity: (Math.abs(quantity)).toString(),
            reduceOnly: "false",
            side: quantity > 0 ? "SELL" : "BUY",
            symbol: position.symbol,
            type: "MARKET",
        };

        console.log("closePosition: ", closePosition)

        try {
            const response = await this.client.submitMultipleOrders([closePosition]);
            console.log("Close positoin response: ", response);
            const orderIdList = await this.getOpenOrders(position.symbol);
            console.log("orderIds: ", orderIdList);
            const cancelMultipleOrdersParams: CancelMultipleOrdersParams = {
                symbol: position.symbol,
                orderIdList: orderIdList
            }
            await this.client.cancelMultipleOrders(cancelMultipleOrdersParams);
        }
        catch (err) { 
            console.log("Err: ", err);
            errorLogger.error(new Error("Failed to close position"));
        }
    }
    
    setIsolatedMargin = async (marginType: MarginType, symbol: string): Promise<number> => {
        const response: ModeChangeResult = await this.client.setMarginType({symbol, marginType});
        return response.code;
    }
    
    setLeverage = async (leverage: number, symbol: string): Promise<void> => {
        try { await this.client.setLeverage({symbol, leverage}) }
        catch (err) { 
            console.log("Err: ", err);
            errorLogger.error(new Error("Failed to set leverage"));
        }
    }
    
    createOrderWithTpSl = async (
        quantity: string, 
        symbol: string,
        side: OrderSide,
        leverage: number
    ): Promise<void> => {
        const markPrice = await this.getMarkPrice(symbol);
        const stopLossPrice = calculateStopLoss(markPrice, leverage, side);
        const takeProfitPrice = calculateTakeProfit(markPrice, leverage, side);
    
        const entryOrder: NewFuturesOrderParams<string> = {
            quantity: quantity,
            reduceOnly: "false",
            side: side,
            symbol: symbol,
            type: "MARKET",
        };

        // console.log("entryOrder: ", entryOrder)
      
        const takeProfitOrder: NewFuturesOrderParams<string> = {
            priceProtect: "TRUE",
            quantity: quantity,
            side: side === "BUY" ? "SELL" : "BUY",
            stopPrice: takeProfitPrice,
            symbol: symbol,
            type: "TAKE_PROFIT_MARKET",
            workingType: "MARK_PRICE",
            closePosition: "true",
        };

        // console.log("takeProfitOrder: ", takeProfitOrder)
      
        const stopLossOrder: NewFuturesOrderParams<string> = {
            priceProtect: "TRUE",
            quantity: quantity,
            side: side === "BUY" ? "SELL" : "BUY",
            stopPrice: stopLossPrice,
            symbol: symbol,
            type: "STOP_MARKET",
            workingType: "MARK_PRICE",
            closePosition: "true"
        };

        // console.log("stopLossOrder: ", stopLossOrder)
        
        try { 
            const response = await this.client.submitMultipleOrders([entryOrder, takeProfitOrder, stopLossOrder]);
            console.log("Open positoin response: ", response);
        }
        catch (err) { 
            console.log("Err: ", err);
            errorLogger.error(new Error("Failed to open positon with TP and SL"));
        }
    }
}