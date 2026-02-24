import React from 'react';
import type { OrderBookEntry } from '../types';

interface OrderBookProps {
    currentPrice: number | null;
}

interface OrderBookEntryWithDepth extends OrderBookEntry {
    cumulativeTotal: number;
}

export const OrderBook: React.FC<OrderBookProps> = ({ currentPrice }) => {
    // Mock order book data with cumulative totals for depth chart
    const generateMockOrders = (basePrice: number, isBid: boolean): OrderBookEntryWithDepth[] => {
        const orders: OrderBookEntryWithDepth[] = [];
        let cumulative = 0;
        // Generate more entries for a better depth look
        for (let i = 0; i < 15; i++) {
            const priceOffset = (Math.random() * 10) + (i * 2);
            const price = isBid ? basePrice - priceOffset : basePrice + priceOffset;
            const amount = Math.random() * 1.5 + 0.1;
            const total = price * amount;
            cumulative += total;

            orders.push({
                price: parseFloat(price.toFixed(2)),
                amount: parseFloat(amount.toFixed(4)),
                total: parseFloat(total.toFixed(2)),
                cumulativeTotal: parseFloat(cumulative.toFixed(2))
            });
        }
        return orders;
    };

    const bids = currentPrice ? generateMockOrders(currentPrice, true) : [];
    const asks = currentPrice ? generateMockOrders(currentPrice, false) : [];

    const maxBidDepth = bids.length > 0 ? bids[bids.length - 1].cumulativeTotal : 1;
    const maxAskDepth = asks.length > 0 ? asks[asks.length - 1].cumulativeTotal : 1;

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

            {/* Asks (Sell Orders) - display closest to price at the bottom */}
            <div className="order-book-asks">
                {asks.slice(0, 12).reverse().map((ask, index) => (
                    <div key={`ask-${index}`} className="order-book-row ask">
                        <span className="price">{ask.price.toFixed(2)}</span>
                        <span className="amount">{ask.amount.toFixed(4)}</span>
                        <span className="total">{ask.total.toFixed(2)}</span>
                        {/* Visual Depth Bar */}
                        <div className="depth-bar" style={{ width: `${(ask.cumulativeTotal / maxAskDepth) * 100}%` }} />
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

            {/* Bids (Buy Orders) - display closest to price at the top */}
            <div className="order-book-bids">
                {bids.slice(0, 12).map((bid, index) => (
                    <div key={`bid-${index}`} className="order-book-row bid">
                        <span className="price">{bid.price.toFixed(2)}</span>
                        <span className="amount">{bid.amount.toFixed(4)}</span>
                        <span className="total">{bid.total.toFixed(2)}</span>
                        {/* Visual Depth Bar */}
                        <div className="depth-bar" style={{ width: `${(bid.cumulativeTotal / maxBidDepth) * 100}%` }} />
                    </div>
                ))}
            </div>
        </div>
    );
};
