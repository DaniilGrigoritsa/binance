import { quantity } from "../main";
import { Position } from "../types/types";
import { Request, Response } from "express";
import { Exchange } from "../exchanges/abstract";
import { KeyValueStore } from "../storage/storage";
import { alertLogger, errorLogger } from "../loggers/index";
import parseAlert from "../utils/parceAlert";


export default function signal(storage: KeyValueStore<number>, exchange: Exchange) {
    return async function (req: Request, res: Response) {

        const data = parseAlert(req);

        if (data.indicator === 'SI') {
            console.log("SI")
            
            /*
            // Open position test
            const leverage = 10;
            await exchange.setLeverage(leverage, data.pair);
            await exchange.createOrderWithTpSl(quantity, data.pair, data.value, leverage);
            */

            /*
            // Close position test 
            const position: Position | null = await exchange.getOpenedPosition(data.pair);
            console.log(position);
            if (position) await exchange.closePosition(position);
            */

            /*
            const position: Position | null = await exchange.getOpenedPosition(data.pair);
            console.log("position: ", position)

            if (position) if (Number(position.positionAmt) > 0) {
                if (
                    position.positionSide === "SHORT" && data.value === "BUY" ||
                    position.positionSide === "LONG" && data.value === "SELL"
                ) {
                    await exchange.closePosition(position);
                }
            }
            else {
                if (await exchange.checkRequirements(storage, data)) {
                    let leverage;
                    const respCode = await exchange.setIsolatedMargin("ISOLATED", data.pair);
                    if (respCode !== 200) errorLogger.error(new Error("Failed to set margin type"));
                    
                    switch (data.frame) {
                        case "1h":
                            leverage = 10;
                        case "2h": 
                            leverage = 9;
                        case "3h": 
                            leverage = 7;
                        case "4h":
                            leverage = 5;
                        default: 
                            leverage = 1;
                    }

                    await exchange.setLeverage(leverage, data.pair);
                    await exchange.createOrderWithTpSl(quantity, data.pair, data.value, leverage);
                }
            }
            */
        } 
        else {
            console.log("Other")
            storage.set(`${data.exchange}:${data.pair}:${data.frame}:${data.indicator}`, data.value);
            alertLogger.alert(`${data.exchange}:${data.pair}:${data.frame}:${data.indicator}:${data.value}`)
        }
    }
}
