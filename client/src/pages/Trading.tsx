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
    const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get<PriceData[]>(`${API_URL}/prices/history?symbol=BTCUSDT&limit=50`);

                let lastTime = 0;
                const formatted = data.map((p) => {
                    // `lightweight-charts` requires time in seconds (UNIX timestamp)
                    let time = Math.floor(new Date(p.timestamp).getTime() / 1000);
                    // Ensure strictly ascending time
                    if (time <= lastTime) time = lastTime + 1;
                    lastTime = time;
                    return { time, value: p.price };
                });

                setChartData(formatted);
                if (formatted.length > 0) {
                    setCurrentPrice(formatted[formatted.length - 1].value);
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
            setChartData(prev => {
                let time = Math.floor(new Date(lastMessage.timestamp).getTime() / 1000);
                const lastTime = prev.length > 0 ? prev[prev.length - 1].time : 0;
                if (time <= lastTime) time = lastTime + 1;

                const newHistory = [...prev, { time, value: lastMessage.price }];
                return newHistory.slice(-100);
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
                chartData={chartData}
                trades={trades}
                onExecuteTrade={handleExecuteTrade}
                isAuthenticated={isAuthenticated}
            />
        </main>
    );
}
