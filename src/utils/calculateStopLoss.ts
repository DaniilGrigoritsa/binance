import { STOP_LOSS_PERCENTAGE, PRECISION } from "../config/config";

export default function calculateStopLoss(
    price: number,
    leverage: number,
    side: 'BUY' | 'SELL'
): string {
    const priceDiff = (STOP_LOSS_PERCENTAGE * price) / leverage;
    switch (side) {
        case "BUY":
            return (Number(price) - priceDiff).toFixed(PRECISION).toString();
        case "SELL":
            return (Number(price) + priceDiff).toFixed(PRECISION).toString();
        default:
           throw new Error('Invalid side parameter. Use "BUY" or "SELL".');    
    }
}
