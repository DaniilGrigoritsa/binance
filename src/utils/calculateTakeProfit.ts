import { TAKE_PROFIT_PERCENTAGE, PRECISION } from "../config/config";

export default function calculateTakeProfit(
    price: number,
    leverage: number,
    side: 'BUY' | 'SELL'
): string {
    const priceDiff = (TAKE_PROFIT_PERCENTAGE * price) / leverage;
    console.log("priceDiff: ", typeof price, typeof priceDiff)
    switch (side) {
        case "BUY":
            return (Number(price) + priceDiff).toFixed(PRECISION).toString();
        case "SELL":
            return (Number(price) - priceDiff).toFixed(PRECISION).toString();
        default:
           throw new Error('Invalid side parameter. Use "BUY" or "SELL".');    
    }
}
