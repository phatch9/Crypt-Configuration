import React from 'react';
import type { Trade } from '../types';

interface TradeHistoryProps {
    trades: Trade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
    const formatTime = (timestamp: Date | string): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="trade-history">
            <div className="trade-history-header">
                <h3>Recent Trades</h3>
            </div>

            <div className="trade-history-labels">
                <span>Time</span>
                <span>Type</span>
                <span>Price</span>
                <span>Amount</span>
                <span>Total</span>
            </div>

            <div className="trade-history-list">
                {trades.length === 0 ? (
                    <div className="empty-state">
                        <p>No trades yet. Execute your first trade to get started!</p>
                    </div>
                ) : (
                    trades.map((trade) => (
                        <div key={trade._id} className={`trade-row ${trade.type.toLowerCase()}`}>
                            <span className="time">{formatTime(trade.timestamp)}</span>
                            <span className={`type ${trade.type.toLowerCase()}`}>
                                {trade.type}
                            </span>
                            <span className="price">${trade.price.toFixed(2)}</span>
                            <span className="amount">{trade.amount.toFixed(4)} BTC</span>
                            <span className="total">${trade.total.toFixed(2)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
