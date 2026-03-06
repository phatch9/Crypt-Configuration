import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { TradingView } from '../components/TradingView';
import type { Trade, PriceData, Coin } from '../types';

const API_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

export function Trading() {
    const { user, isAuthenticated } = useAuth();

    // ── Coin list ──
    const [coins, setCoins] = useState<Coin[]>([]);
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

    // ── Price / Chart ──
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [chartData, setChartData] = useState<{ time: number; value: number }[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);

    // ── WebSocket (reconnects automatically when selectedCoin changes) ─────
    const { lastMessage } = useWebSocket(WS_URL, selectedCoin?.symbol ?? 'BTCUSDT');

    // ── Fetch coin list + latest prices ───
    const fetchCoins = useCallback(async () => {
        try {
            const { data } = await axios.get<Coin[]>(`${API_URL}/coins`);
            setCoins(data);
            // Keep selected coin's price in sync
            if (selectedCoin) {
                const updated = data.find(c => c.symbol === selectedCoin.symbol);
                if (updated) setSelectedCoin(updated);
            } else if (data.length > 0) {
                // Default selection: Bitcoin
                setSelectedCoin(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch coin list:', error);
        }
    }, [selectedCoin?.symbol]);

    // Initial load + poll every 5 s for coin list price updates
    useEffect(() => {
        fetchCoins();
        const interval = setInterval(fetchCoins, 5000);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch price history whenever selected coin changes ─────
    useEffect(() => {
        if (!selectedCoin) return;
        setChartData([]);
        setCurrentPrice(null);

        const fetchHistory = async () => {
            try {
                const { data } = await axios.get<PriceData[]>(
                    `${API_URL}/prices/history?symbol=${selectedCoin.symbol}&limit=50`
                );

                let lastTime = 0;
                const formatted = data.map((p) => {
                    let time = Math.floor(new Date(p.timestamp).getTime() / 1000);
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
    }, [selectedCoin?.symbol]);

    // ── Real-time WebSocket price updates ──
    useEffect(() => {
        if (lastMessage?.price && lastMessage.symbol === selectedCoin?.symbol) {
            setCurrentPrice(lastMessage.price);
            setChartData(prev => {
                let time = Math.floor(new Date(lastMessage.timestamp).getTime() / 1000);
                const lastTime = prev.length > 0 ? prev[prev.length - 1].time : 0;
                if (time <= lastTime) time = lastTime + 1;
                return [...prev, { time, value: lastMessage.price }].slice(-200);
            });
        }
    }, [lastMessage, selectedCoin?.symbol]);

    // ── Trades ────
    useEffect(() => {
        if (isAuthenticated && user) fetchTrades();
        else setTrades([]);
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
        if (!user || !selectedCoin) return;
        try {
            await axios.post(
                `${API_URL}/trade`,
                { symbol: selectedCoin.symbol, type, price, amount, total: amount * price },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            fetchTrades();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Trade execution failed');
        }
    };

    const handleSelectCoin = (coin: Coin) => {
        setSelectedCoin(coin);
    };

    return (
        <main className="app-main">
            <TradingView
                coins={coins}
                selectedCoin={selectedCoin}
                currentPrice={currentPrice}
                chartData={chartData}
                trades={trades}
                onExecuteTrade={handleExecuteTrade}
                onSelectCoin={handleSelectCoin}
                isAuthenticated={isAuthenticated}
            />
        </main>
    );
}
