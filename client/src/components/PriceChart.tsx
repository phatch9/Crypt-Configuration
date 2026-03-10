import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, LineSeries, ColorType } from 'lightweight-charts';

interface PriceChartProps {
    chartData: { time: number; value: number }[];
    currentPrice: number | null;
    base: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ chartData, currentPrice, base }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#b7bdc6',
            },
            grid: {
                vertLines: { color: 'rgba(43, 49, 57, 0.4)' },
                horzLines: { color: 'rgba(43, 49, 57, 0.4)' },
            },
            crosshair: { mode: 1 },
            rightPriceScale: { borderColor: 'rgba(43, 49, 57, 0.8)' },
            timeScale: {
                borderColor: 'rgba(43, 49, 57, 0.8)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const lineSeries = chart.addSeries(LineSeries, {
            color: '#0ecb81',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            lineType: 0,
        });

        chartRef.current = chart;
        seriesRef.current = lineSeries;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 0);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update Data
    useEffect(() => {
        if (seriesRef.current && chartData.length > 0) {
            const formattedData = chartData.map(d => ({ time: d.time as Time, value: d.value }));
            try {
                seriesRef.current.setData(formattedData);
                if (chartData.length < 50) chartRef.current?.timeScale().fitContent();
            } catch (e) {
                console.error('lightweight-charts setData error:', e);
            }
        } else if (seriesRef.current && chartData.length === 0) {
            // Clear chart when coin switches
            try { seriesRef.current.setData([]); } catch (_) { }
        }
    }, [chartData]);

    let isPositive = true;
    if (chartData.length >= 2) {
        isPositive = chartData[chartData.length - 1].value >= chartData[chartData.length - 2].value;
    }

    const displayPrice = () => {
        if (currentPrice === null) return '—';
        if (base === 'SHIB') return `$${currentPrice.toFixed(8)}`;
        if (['DOGE', 'ADA', 'XRP'].includes(base)) return `$${currentPrice.toFixed(4)}`;
        return `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="price-chart" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="chart-header" style={{ flexShrink: 0, padding: '1rem', paddingBottom: 0 }}>
                <h3>{base}/USDT</h3>
                {currentPrice && (
                    <div className="current-price">
                        <span className="price-value">{displayPrice()}</span>
                        <span className="price-change">
                            {chartData.length >= 2 && (
                                <span className={isPositive ? 'positive' : 'negative'}>
                                    {isPositive ? '▲' : '▼'}
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </div>
            <div
                ref={chartContainerRef}
                className="chart-canvas-container"
                style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}
            />
        </div>
    );
};
