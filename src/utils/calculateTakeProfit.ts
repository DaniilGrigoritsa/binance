import { TAKE_PROFIT_PERCENTAGE } from "../config/config";

export default function calculateTakeProfit(
    price: number,
    leverage: number,
    side: 'BUY' | 'SELL',
    precision: number
): string {
    const priceDiff = (TAKE_PROFIT_PERCENTAGE * price) / leverage;
    switch (side) {
        case "BUY":
            return (Number(price) + priceDiff).toFixed(precision).toString();
        case "SELL":
            return (Number(price) - priceDiff).toFixed(precision).toString();
        default:
           throw new Error('Invalid side parameter. Use "BUY" or "SELL".');    
    }
}
