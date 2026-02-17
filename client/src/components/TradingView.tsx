import React from 'react';
import { PriceChart } from './PriceChart';
import { OrderBook } from './OrderBook';
import { TradeHistory } from './TradeHistory';
import { OrderPanel } from './OrderPanel';
import type { Trade } from '../types';

interface TradingViewProps {
    currentPrice: number | null;
    priceHistory: number[];
    trades: Trade[];
    onExecuteTrade: (type: 'BUY' | 'SELL', amount: number, price: number) => void;
    isAuthenticated: boolean;
}

export const TradingView: React.FC<TradingViewProps> = ({
    currentPrice,
    priceHistory,
    trades,
    onExecuteTrade,
    isAuthenticated
}) => {
    return (
        <div className="trading-view">
            {/* Main Chart Area */}
            <div className="chart-section">
                <PriceChart priceHistory={priceHistory} currentPrice={currentPrice} />
            </div>

            {/* Order Book */}
            <div className="orderbook-section">
                <OrderBook currentPrice={currentPrice} />
            </div>

            {/* Order Panel */}
            <div className="order-panel-section">
                <OrderPanel
                    currentPrice={currentPrice}
                    onExecuteTrade={onExecuteTrade}
                    isAuthenticated={isAuthenticated}
                />
            </div>

            {/* Trade History */}
            <div className="history-section">
                <TradeHistory trades={trades} />
            </div>
        </div>
    );
};
