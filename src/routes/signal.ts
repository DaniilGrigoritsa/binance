import { Position } from "../types/types";
import { quantity } from "../config/config";
import { Request, Response } from "express";
import { Exchange } from "../exchanges/abstract";
import { KeyValueStore } from "../storage/storage";
import { alertLogger, errorLogger } from "../loggers/index";
import parseAlert from "../utils/parceAlert";


export default function signal(storage: KeyValueStore<number>, exchange: Exchange) {
    return async function (req: Request, res: Response) {

        const data = parseAlert(req);

        if (data.indicator === 'SI') {
        
            const position: Position | null = await exchange.getOpenedPosition(data.pair);
            
            if (position && Number(position?.positionAmt) > 0) {
                if (
                    Number(position.positionAmt) < 0 && data.value === "BUY" ||
                    Number(position.positionAmt) > 0 && data.value === "SELL"
                ) {
                    await exchange.closePosition(position);
                }
            }
            else {
                const requirements = await exchange.checkRequirements(storage, data);
                console.log("requirements", requirements)
                
                if (requirements) {
                    let leverage;
                    const respCode = await exchange.setIsolatedMargin("ISOLATED", data.pair);
                    if (respCode !== 200) errorLogger.error(new Error(`Failed to set margin type. ${(new Date()).toLocaleString()}`));
                    
                    switch (data.frame) {
                        case "1h":
                            leverage = 10;
                            break;
                        case "2h": 
                            leverage = 9;
                            break;
                        case "3h": 
                            leverage = 7;
                            break;
                        case "4h":
                            leverage = 5;
                            break;
                        default: 
                            leverage = 1;
                            break;
                    }

                    await exchange.setLeverage(leverage, data.pair);
                    await exchange.createOrderWithTpSl(quantity, data.pair, data.value, leverage);
                }
            }
        } 
        else {
            const key = `${data.exchange}:${data.pair}:${data.frame}:${data.indicator}`;
            const value = data.value;
            storage.set(key, value);
            alertLogger.info(`${key} = ${value}. ${(new Date()).toLocaleString()}`);
        }
    }
}
