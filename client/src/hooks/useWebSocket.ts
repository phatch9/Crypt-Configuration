import { useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '../types';

interface UseWebSocketReturn {
    isConnected: boolean;
    lastMessage: WebSocketMessage | null;
    sendMessage: (message: string) => void;
}

export const useWebSocket = (url: string, symbol: string = 'BTCUSDT'): UseWebSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const connect = (wsUrl: string) => {
        try {
            // Append symbol query param so server filters Redis by this coin
            const fullUrl = `${wsUrl}?symbol=${symbol.toUpperCase()}`;
            ws.current = new WebSocket(fullUrl);

            ws.current.onopen = () => {
                setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.current.onclose = () => {
                setIsConnected(false);
                reconnectTimeout.current = setTimeout(() => connect(wsUrl), 3000);
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    };

    useEffect(() => {
        // Close existing connection before reopening with new symbol
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        if (ws.current) ws.current.close();

        connect(url);

        return () => {
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            if (ws.current) ws.current.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, symbol]);

    const sendMessage = (message: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(message);
        }
    };

    return { isConnected, lastMessage, sendMessage };
};
