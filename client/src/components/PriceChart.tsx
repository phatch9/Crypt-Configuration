import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, LineSeries, ColorType } from 'lightweight-charts';

interface PriceChartProps {
    chartData: { time: number; value: number }[];
    currentPrice: number | null;
}

export const PriceChart: React.FC<PriceChartProps> = ({ chartData, currentPrice }) => {
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
            crosshair: {
                mode: 1, // Magnet
            },
            rightPriceScale: {
                borderColor: 'rgba(43, 49, 57, 0.8)',
            },
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

        // Initial setup bounds
        setTimeout(handleResize, 0);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update Data
    useEffect(() => {
        if (seriesRef.current && chartData.length > 0) {
            const formattedData = chartData.map(d => ({
                time: d.time as Time,
                value: d.value
            }));

            try {
                seriesRef.current.setData(formattedData);
                // Optionally fit content or adjust view
                if (chartData.length < 50) {
                    chartRef.current?.timeScale().fitContent();
                }
            } catch (e) {
                console.error("lightweight-charts setData error:", e);
            }
        }
    }, [chartData]);

    // calculate change for UI
    let isPositive = true;
    if (chartData.length >= 2) {
        const last = chartData[chartData.length - 1].value;
        const prev = chartData[chartData.length - 2].value;
        isPositive = last >= prev;
    }

    return (
        <div className="price-chart" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="chart-header" style={{ flexShrink: 0, padding: '1rem', paddingBottom: 0 }}>
                <h3>BTC/USDT</h3>
                {currentPrice && (
                    <div className="current-price">
                        <span className="price-value">${currentPrice.toFixed(2)}</span>
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
            {/* The container for lightweight-charts must have a flex box or exact dimensions */}
            <div
                ref={chartContainerRef}
                className="chart-canvas-container"
                style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}
            />
        </div>
    );
};
