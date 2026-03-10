import React from 'react';
import { PriceChart } from './PriceChart';
import { OrderBook } from './OrderBook';
import { TradeHistory } from './TradeHistory';
import { OrderPanel } from './OrderPanel';
import { CoinSelector } from './CoinSelector';
import type { Trade, Coin } from '../types';

interface TradingViewProps {
    coins: Coin[];
    selectedCoin: Coin | null;
    currentPrice: number | null;
    chartData: { time: number; value: number }[];
    trades: Trade[];
    onExecuteTrade: (type: 'BUY' | 'SELL', amount: number, price: number) => void;
    onSelectCoin: (coin: Coin) => void;
    isAuthenticated: boolean;
}

export const TradingView: React.FC<TradingViewProps> = ({
    coins,
    selectedCoin,
    currentPrice,
    chartData,
    trades,
    onExecuteTrade,
    onSelectCoin,
    isAuthenticated
}) => {
    const symbol = selectedCoin?.symbol ?? 'BTCUSDT';
    const base = selectedCoin?.base ?? 'BTC';

    return (
        <div className="trading-view">
            {/* Coin Selector — left column */}
            <div className="coin-selector-section">
                <CoinSelector
                    coins={coins}
                    selectedSymbol={symbol}
                    onSelectCoin={onSelectCoin}
                />
            </div>

            {/* Main Chart Area */}
            <div className="chart-section">
                <PriceChart chartData={chartData} currentPrice={currentPrice} base={base} />
            </div>

            {/* Order Book */}
            <div className="orderbook-section">
                <OrderBook currentPrice={currentPrice} base={base} />
            </div>

            {/* Order Panel */}
            <div className="order-panel-section">
                <OrderPanel
                    currentPrice={currentPrice}
                    onExecuteTrade={onExecuteTrade}
                    isAuthenticated={isAuthenticated}
                    base={base}
                />
            </div>

            {/* Trade History */}
            <div className="history-section">
                <TradeHistory trades={trades} />
            </div>
        </div>
    );
};
