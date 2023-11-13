import { Request } from "express";
import { Frame, Indicator } from "../types/types";

export interface Signal {
    exchange: string
    pair: string
    frame: Frame,
    indicator: Indicator,
    value: any // OrderSide | number 
}

export default function parseAlert(req: Request | any): Signal {
    const [exchange, pair, frame, indicator, value] = (req.body.data).split(' ')
    return {exchange, pair, frame, indicator, value}
}