import React, { useEffect, useState } from 'react';
import type { Coin } from '../types';

interface CoinSelectorProps {
    coins: Coin[];
    selectedSymbol: string;
    onSelectCoin: (coin: Coin) => void;
}

// Format price with appropriate decimal places per coin magnitude
function formatPrice(price: number | null, base: string): string {
    if (price === null) return '—';
    if (base === 'SHIB') return `$${price.toFixed(8)}`;
    if (base === 'DOGE' || base === 'ADA' || base === 'XRP') return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Map slug → CoinGecko numeric ID for icon URLs
const ICON_IDS: Record<string, string> = {
    bitcoin: '1/small/bitcoin.png',
    ethereum: '279/small/ethereum.png',
    solana: '4128/small/solana.png',
    bnb: '825/small/bnb-icon2_2x.png',
    cardano: '975/small/cardano.png',
    xrp: '44992/small/xrp-symbol-white-128.png',
    dogecoin: '5/small/dogecoin.png',
    'shiba-inu': '11939/small/shiba.png',
};

function coinIconUrl(slug: string): string {
    const path = ICON_IDS[slug];
    return path
        ? `https://assets.coingecko.com/coins/images/${path}`
        : `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`;
}

export const CoinSelector: React.FC<CoinSelectorProps> = ({ coins, selectedSymbol, onSelectCoin }) => {
    const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down' | null>>({});
    const prevPrices = React.useRef<Record<string, number | null>>({});

    // Detect price changes and trigger flash animations
    useEffect(() => {
        const updates: Record<string, 'up' | 'down' | null> = {};
        for (const coin of coins) {
            const prev = prevPrices.current[coin.symbol];
            if (prev !== undefined && coin.price !== null && prev !== null) {
                if (coin.price > prev) updates[coin.symbol] = 'up';
                else if (coin.price < prev) updates[coin.symbol] = 'down';
            }
            prevPrices.current[coin.symbol] = coin.price;
        }
        if (Object.keys(updates).length > 0) {
            setFlashMap(updates);
            const timer = setTimeout(() => setFlashMap({}), 600);
            return () => clearTimeout(timer);
        }
    }, [coins]);

    return (
        <div className="coin-selector">
            <div className="coin-selector-header">
                <span className="coin-selector-title">Markets</span>
                <span className="coin-selector-sub">Live Prices</span>
            </div>
            <div className="coin-list">
                {coins.map((coin) => {
                    const flash = flashMap[coin.symbol];
                    const isSelected = coin.symbol === selectedSymbol;
                    return (
                        <button
                            key={coin.symbol}
                            className={`coin-item ${isSelected ? 'selected' : ''} ${flash ? `flash-${flash}` : ''}`}
                            onClick={() => onSelectCoin(coin)}
                        >
                            <img
                                src={coinIconUrl(coin.iconSlug)}
                                alt={coin.name}
                                className="coin-icon"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <div className="coin-info">
                                <span className="coin-base">{coin.base}</span>
                                <span className="coin-name">{coin.name}</span>
                            </div>
                            <div className={`coin-price ${flash === 'up' ? 'price-up' : flash === 'down' ? 'price-down' : ''}`}>
                                {formatPrice(coin.price, coin.base)}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
