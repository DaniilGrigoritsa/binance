import { 
    USDMClient, 
    WebsocketClient,
    type OrderSide,
    type MarginType,
    type OrderResult,
    type FuturesPosition,
    type ModeChangeResult,
    type NewFuturesOrderParams, 
    type FuturesAccountBalance,
    type CancelMultipleOrdersParams,
} from "binance";
import { type Position } from "../types/types";

import { Exchange } from "./abstract";
import { Signal } from "../utils/parceAlert";
import { KeyValueStore } from "../storage/storage";
import { errorLogger, closeLogger, openLogger } from "../loggers/index";

import calculateStopLoss from "../utils/calculateStopLoss";
import calculateTakeProfit from "../utils/calculateTakeProfit";


export class Binance implements Exchange {
    private access: string;
    private secret: string;
    private isTestnet: boolean;
    private client: USDMClient;
    private wsClient: WebsocketClient;

    constructor(
        access: string, 
        secret: string,
        isTestnet: boolean
    ) {
        this.access = access;
        this.secret = secret;
        this.isTestnet = isTestnet;

        this.client = new USDMClient({
            api_key: this.access,
            api_secret: this.secret,
            baseUrl: this.isTestnet ? "https://testnet.binancefuture.com" : "https://fapi.binance.com"
        }, {}, this.isTestnet);

        this.wsClient = new WebsocketClient({
            api_key: this.access,
            api_secret: this.secret,
            wsUrl: this.isTestnet ? "wss://stream.binancefuture.com" : "wss://fstream.binance.com"
        })

        this.createWsDataStream();
    }

    private getMarkPrice = async (symbol: string): Promise<number> => {
        const markPrice = await this.client.getMarkPrice({symbol});
        if (Array.isArray(markPrice)) return 0; // Should return undefined
        else return Number(markPrice.markPrice);
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

    private cancelMultipleOrders = async (symbol: string, orderIdList: number[]): Promise<void> => {
        const cancelMultipleOrdersParams: CancelMultipleOrdersParams = {
            symbol: symbol,
            orderIdList: orderIdList
        }
        const response = await this.client.cancelMultipleOrders(cancelMultipleOrdersParams);

        closeLogger.info(JSON.stringify(response).toString());
    }

    private adjustQuantity = (quantity: string, markPrice: number, precision: number): string => {
        const adjustQuantity = Number((Number(quantity) / markPrice).toFixed(precision));
        if (adjustQuantity > 0) return adjustQuantity.toString()
        else return (1 / 10 ** precision).toString();
    }

    private getPricePrecision = async (pair: string): Promise<number> => {
        const exchangeInfo = await this.client.getExchangeInfo();
        console.log("exchangeInfo: ", exchangeInfo)
        for (let exchange of exchangeInfo.symbols) {
            if (exchange.symbol === pair) return exchange.pricePrecision;
        }
        return 0;
    }

    private getQuantityPrecision = async (pair: string): Promise<number> => {
        const exchangeInfo = await this.client.getExchangeInfo();
        console.log("exchangeInfo: ", exchangeInfo)
        for (let exchange of exchangeInfo.symbols) {
            if (exchange.symbol === pair) return exchange.quantityPrecision;
        }
        return 0;
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
        for (let iter = frames.indexOf(data.frame); iter < frames.length; iter++) {
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
            for (const position of positions) if (position.symbol.toUpperCase() === symbol) return position;
        }
        catch (err) { 
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

        try {
            const response = await this.client.submitMultipleOrders([closePosition]);
            const orderIdList = await this.getOpenOrders(position.symbol);
            if (orderIdList.length) await this.cancelMultipleOrders(position.symbol, orderIdList);

            closeLogger.info(JSON.stringify(response).toString());
        }
        catch (err) { 
            errorLogger.error(new Error("Failed to close position"));
        }
    }
    
    setIsolatedMargin = async (marginType: MarginType, symbol: string): Promise<number> => {
        try {
            const response: ModeChangeResult = await this.client.setMarginType({symbol, marginType});
            return response.code;
        }
        catch (err: any) {
            if (err.code = -4046) return 200; // No need to change margin
            else return 400;
        }
    }
    
    setLeverage = async (leverage: number, symbol: string): Promise<void> => {
        try { await this.client.setLeverage({symbol, leverage}) }
        catch (err) { 
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
        const pricePrecision = await this.getPricePrecision(symbol);
        const quantityPrecision = await this.getQuantityPrecision(symbol);
        const stopLossPrice = calculateStopLoss(markPrice, leverage, side, pricePrecision);
        const takeProfitPrice = calculateTakeProfit(markPrice, leverage, side, pricePrecision);

        quantity = this.adjustQuantity(quantity, markPrice, quantityPrecision);
    
        const entryOrder: NewFuturesOrderParams<string> = {
            quantity: quantity,
            reduceOnly: "false",
            side: side,
            symbol: symbol,
            type: "MARKET",
        };

        // console.log("entryOrder", entryOrder)
      
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

        // console.log("takeProfitOrder", takeProfitOrder)
      
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

        // console.log("stopLossOrder", stopLossOrder)
        
        try { 
            const response = await this.client.submitMultipleOrders(
                [entryOrder, takeProfitOrder, stopLossOrder]
            );
            openLogger.info(JSON.stringify(response)).toString();
        }
        catch (err) { 
            errorLogger.error(new Error("Failed to open positon with TP and SL"));
        }
    }
    
    createWsDataStream = async (): Promise<void> => {
        const webSockets = await this.wsClient.subscribeUsdFuturesUserDataStream(this.isTestnet, true, true);

        webSockets.addEventListener("open", () => console.log("Connection opened"));

        webSockets.addEventListener("error", (error) => console.log(error));

        webSockets.addEventListener("message", async (message) => {
            const event: any = JSON.parse(message.data); // Set type
            console.log(event);
            if (event.e === "ORDER_TRADE_UPDATE") {
                const symbol = event.o.s;
                const type = event.o.ot;
                const executionType = event.o.X;

                // Close TP / SL if position was filled 
                if (executionType === "FILLED" && (type === "STOP_MARKET" || type === "TAKE_PROFIT_MARKET")) {
                    const orders = await this.getOpenOrders(symbol);
                    if (orders.length) await this.cancelMultipleOrders(symbol, orders);
                }

                // Logging if position closed
                else if (executionType === "CANCELED" || executionType == "CALCULATED" || executionType == "EXPIRED") {
                    closeLogger.info(JSON.stringify(event).toString());
                }

                // Logging if position opened
                else if (executionType === "NEW") {
                    openLogger.info(JSON.stringify(event).toString());
                }
            }
        });
    }
}