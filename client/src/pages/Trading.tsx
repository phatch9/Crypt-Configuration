import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { TradingView } from '../components/TradingView';
import type { Trade, PriceData } from '../types';

const API_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000';

export function Trading() {
    const { user, isAuthenticated } = useAuth();
    const { lastMessage } = useWebSocket(WS_URL);

    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [priceHistory, setPriceHistory] = useState<number[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get<PriceData[]>(`${API_URL}/prices/history?symbol=BTCUSDT&limit=50`);
                const prices = data.map((p) => p.price);
                setPriceHistory(prices);
                if (prices.length > 0) {
                    setCurrentPrice(prices[prices.length - 1]);
                }
            } catch (error) {
                console.error('Failed to fetch price history:', error);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        if (lastMessage && lastMessage.price) {
            setCurrentPrice(lastMessage.price);
            setPriceHistory(prev => {
                const newHistory = [...prev, lastMessage.price];
                return newHistory.slice(-50);
            });
        }
    }, [lastMessage]);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchTrades();
        } else {
            setTrades([]);
        }
    }, [isAuthenticated, user]);

    const fetchTrades = async () => {
        if (!user) return;
        try {
            const { data } = await axios.get<Trade[]>(`${API_URL}/trade`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTrades(data);
        } catch (error) {
            console.error('Failed to fetch trades:', error);
        }
    };

    const handleExecuteTrade = async (type: 'BUY' | 'SELL', amount: number, price: number) => {
        if (!user) return;
        try {
            await axios.post(
                `${API_URL}/trade`,
                { symbol: 'BTCUSDT', type, price, amount },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            fetchTrades();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Trade execution failed');
        }
    };

    return (
        <main className="app-main">
            <TradingView
                currentPrice={currentPrice}
                priceHistory={priceHistory}
                trades={trades}
                onExecuteTrade={handleExecuteTrade}
                isAuthenticated={isAuthenticated}
            />
        </main>
    );
}
