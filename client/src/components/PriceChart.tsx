import React, { useEffect, useRef } from 'react';

interface PriceChartProps {
    priceHistory: number[];
    currentPrice: number | null;
}

export const PriceChart: React.FC<PriceChartProps> = ({ priceHistory, currentPrice }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || priceHistory.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Calculate dimensions
        const padding = 40;
        const chartWidth = rect.width - padding * 2;
        const chartHeight = rect.height - padding * 2;

        const minPrice = Math.min(...priceHistory);
        const maxPrice = Math.max(...priceHistory);
        const priceRange = maxPrice - minPrice || 1;

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(rect.width - padding, y);
            ctx.stroke();
        }

        // Draw price labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const price = maxPrice - (priceRange / 5) * i;
            const y = padding + (chartHeight / 5) * i;
            ctx.fillText(price.toFixed(2), padding - 10, y + 4);
        }

        // Draw price line
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();

        priceHistory.forEach((price, index) => {
            const x = padding + (chartWidth / (priceHistory.length - 1)) * index;
            const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw gradient fill
        if (priceHistory.length > 0) {
            const gradient = ctx.createLinearGradient(0, padding, 0, rect.height - padding);
            gradient.addColorStop(0, 'rgba(0, 255, 136, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(padding, rect.height - padding);

            priceHistory.forEach((price, index) => {
                const x = padding + (chartWidth / (priceHistory.length - 1)) * index;
                const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
                ctx.lineTo(x, y);
            });

            ctx.lineTo(rect.width - padding, rect.height - padding);
            ctx.closePath();
            ctx.fill();
        }
    }, [priceHistory, currentPrice]);

    return (
        <div className="price-chart">
            <div className="chart-header">
                <h3>BTC/USDT</h3>
                {currentPrice && (
                    <div className="current-price">
                        <span className="price-value">${currentPrice.toFixed(2)}</span>
                        <span className="price-change">
                            {priceHistory.length >= 2 && (
                                <span className={currentPrice > priceHistory[priceHistory.length - 2] ? 'positive' : 'negative'}>
                                    {currentPrice > priceHistory[priceHistory.length - 2] ? '▲' : '▼'}
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} className="chart-canvas" />
        </div>
    );
};
