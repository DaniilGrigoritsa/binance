const STOP_LOSS_PERCENTAGE = 0.2;
const PRECISION = 2;

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
