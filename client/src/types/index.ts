// User & Authentication
export interface User {
    _id: string;
    username: string;
    token: string;
}

export interface AuthFormData {
    username: string;
    password: string;
}

// Trading Data
export interface PriceData {
    symbol: string;
    price: number;
    timestamp: Date | string;
}

export interface Trade {
    _id: string;
    user: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    price: number;
    amount: number;
    total: number;
    timestamp: Date | string;
}

// WebSocket Messages
export interface WebSocketMessage {
    symbol: string;
    price: number;
    timestamp: Date | string;
}

// Order Book
export interface OrderBookEntry {
    price: number;
    amount: number;
    total: number;
}

export interface OrderBook {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
}

// Chart Data
export interface CandlestickData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Order Form
export interface OrderFormData {
    type: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT';
    price: string;
    amount: string;
}

// API Response Types
export interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: string;
}
