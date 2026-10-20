/**
 * TvChart — TradingView Lightweight Charts (v5) wrapper.
 * Official lightweight-charts engine styled in Luxury Black + Charcoal + Silver theme.
 */
import { useEffect, useRef } from 'react';
import { createChart, AreaSeries, LineSeries } from 'lightweight-charts';

export default function TvChart({
  data = [],
  dataKey = 'price',
  timeKey = 'time',
  color = '#c0c0c0',
  areaColor = 'rgba(192, 192, 192, 0.15)',
  height = 220,
  type = 'area', // 'area' | 'line'
  priceFmt = (v) => `₹${v.toFixed(2)}`,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clean up previous chart instance
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {}
      chartRef.current = null;
    }

    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth || 400,
      height,
      autoSize: true,
      layout: {
        background: { color: '#181b1e' },
        textColor: '#c0c0c0',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Inter', -apple-system, sans-serif",
      },
      grid: {
        vertLines: { color: '#24282c', style: 1 },
        horzLines: { color: '#24282c', style: 1 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#8e959e', labelBackgroundColor: '#343a40' },
        horzLine: { color: '#8e959e', labelBackgroundColor: '#343a40' },
      },
      rightPriceScale: {
        borderColor: '#343a40',
        textColor: '#c0c0c0',
      },
      timeScale: {
        borderColor: '#343a40',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    // In Lightweight Charts v5, use chart.addSeries(AreaSeries | LineSeries, options)
    let series;
    try {
      if (type === 'area') {
        series = chart.addSeries(AreaSeries, {
          topColor: areaColor,
          bottomColor: 'rgba(24, 27, 30, 0)',
          lineColor: color,
          lineWidth: 2,
          priceFormat: { type: 'custom', minMove: 0.05, formatter: priceFmt },
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lastValueVisible: true,
          priceLineVisible: true,
          priceLineColor: color,
          priceLineWidth: 1,
          priceLineStyle: 2,
        });
      } else {
        series = chart.addSeries(LineSeries, {
          color,
          lineWidth: 2,
          priceFormat: { type: 'custom', minMove: 0.05, formatter: priceFmt },
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lastValueVisible: true,
        });
      }

      // Base timestamp for today at midnight (seconds since epoch)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const baseMidnightSec = Math.floor(today.getTime() / 1000);

      // Convert incoming items to valid, strictly ascending Lightweight Charts data
      const processed = [];
      const seenTimes = new Set();

      data.forEach((item, idx) => {
        let t;
        const rawTime = item[timeKey];

        if (typeof rawTime === 'string' && rawTime.includes(':')) {
          const parts = rawTime.split(':').map(Number);
          const h = parts[0] || 0;
          const m = parts[1] || 0;
          t = baseMidnightSec + (h * 3600) + (m * 60);
        } else if (typeof rawTime === 'number') {
          t = rawTime > 1000000 ? rawTime : baseMidnightSec + (rawTime * 60);
        } else {
          t = baseMidnightSec + (idx * 60);
        }

        // Avoid duplicate timestamps
        while (seenTimes.has(t)) {
          t += 1;
        }
        seenTimes.add(t);

        const val = Number(item[dataKey]);
        if (!isNaN(val)) {
          processed.push({ time: t, value: val });
        }
      });

      // Sort strictly ascending
      processed.sort((a, b) => a.time - b.time);

      if (processed.length > 0) {
        series.setData(processed);
        chart.timeScale().fitContent();
      }

      chartRef.current = chart;
    } catch (err) {
      console.error('TvChart error:', err);
    }

    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
      }
    };
  }, [data, color, areaColor, height, type]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
