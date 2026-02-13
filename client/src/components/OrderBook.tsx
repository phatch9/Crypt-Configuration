import React from 'react';
import type { OrderBookEntry } from '../types';

interface OrderBookProps {
    currentPrice: number | null;
}

export const OrderBook: React.FC<OrderBookProps> = ({ currentPrice }) => {
    // Mock order book data (in real app, this would come from WebSocket)
    const generateMockOrders = (basePrice: number, isBid: boolean): OrderBookEntry[] => {
        const orders: OrderBookEntry[] = [];
        for (let i = 0; i < 10; i++) {
            const priceOffset = (Math.random() * 100) + (i * 10);
            const price = isBid ? basePrice - priceOffset : basePrice + priceOffset;
            const amount = Math.random() * 2;
            orders.push({
                price: parseFloat(price.toFixed(2)),
                amount: parseFloat(amount.toFixed(4)),
                total: parseFloat((price * amount).toFixed(2))
            });
        }
        return orders;
    };

    const bids = currentPrice ? generateMockOrders(currentPrice, true) : [];
    const asks = currentPrice ? generateMockOrders(currentPrice, false) : [];

    return (
        <div className="order-book">
            <div className="order-book-header">
                <h3>Order Book</h3>
            </div>

            <div className="order-book-labels">
                <span>Price (USDT)</span>
                <span>Amount (BTC)</span>
                <span>Total</span>
            </div>

            {/* Asks (Sell Orders) */}
            <div className="order-book-asks">
                {asks.slice(0, 8).reverse().map((ask, index) => (
                    <div key={`ask-${index}`} className="order-book-row ask">
                        <span className="price">{ask.price.toFixed(2)}</span>
                        <span className="amount">{ask.amount.toFixed(4)}</span>
                        <span className="total">{ask.total.toFixed(2)}</span>
                        <div className="depth-bar" style={{ width: `${(ask.total / asks[0].total) * 100}%` }} />
                    </div>
                ))}
            </div>

            {/* Current Price */}
            {currentPrice && (
                <div className="current-price-row">
                    <span className="price-label">${currentPrice.toFixed(2)}</span>
                    <span className="spread">Spread: 0.01%</span>
                </div>
            )}

            {/* Bids (Buy Orders) */}
            <div className="order-book-bids">
                {bids.slice(0, 8).map((bid, index) => (
                    <div key={`bid-${index}`} className="order-book-row bid">
                        <span className="price">{bid.price.toFixed(2)}</span>
                        <span className="amount">{bid.amount.toFixed(4)}</span>
                        <span className="total">{bid.total.toFixed(2)}</span>
                        <div className="depth-bar" style={{ width: `${(bid.total / bids[0].total) * 100}%` }} />
                    </div>
                ))}
            </div>
        </div>
    );
};
