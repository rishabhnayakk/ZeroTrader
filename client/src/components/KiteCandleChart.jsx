/**
 * KiteCandleChart — Professional Zerodha Kite Candlestick Chart.
 * Powered by TradingView Lightweight Charts engine.
 * Styled in Luxury Black + Charcoal + Silver theme.
 */
import { useState, useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
} from 'lightweight-charts';
import { getCandles } from '../lib/api';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  Scan,
  Clock,
} from 'lucide-react';
import TradeTimingCard from './TradeTimingCard';
import './KiteCandleChart.css';

const TIMEFRAMES = [
  { label: '1m', interval: '1m', range: '1d' },
  { label: '5m', interval: '5m', range: '1d' },
  { label: '15m', interval: '15m', range: '5d' },
  { label: '1h', interval: '60m', range: '1mo' },
  { label: '1D', interval: '1d', range: '3mo' },
];

const getChartColors = (isLight) => ({
  background: isLight ? '#ffffff' : '#111111',
  textColor: isLight ? '#475569' : '#c0c0c0',
  gridLines: isLight ? '#f1f5f9' : '#1c1f23',
  borderColor: isLight ? '#e2e8f0' : '#343a40',
  crosshair: isLight ? '#94a3b8' : '#8e959e',
  crosshairLabel: isLight ? '#e2e8f0' : '#343a40',
  maColor: isLight ? '#2563eb' : '#c0c0c0',
});

export default function KiteCandleChart({ symbol = 'NIFTY', displayName = 'NIFTY 50' }) {
  const chartWrapperRef = useRef(null);
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const maSeriesRef = useRef(null);

  const [activeTf, setActiveTf] = useState(TIMEFRAMES[1]); // default 5m
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoverData, setHoverData] = useState(null);
  const [lastCandle, setLastCandle] = useState(null);
  const [showMa, setShowMa] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [candleData, setCandleData] = useState([]);
  const [showTimingRadar, setShowTimingRadar] = useState(false);

  // Resize chart to match container
  const updateChartDimensions = (fs = isFullscreen) => {
    if (!chartRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || (fs ? window.innerWidth : 800);
    const height = fs ? Math.max(window.innerHeight - 86, 400) : 480;
    chartRef.current.applyOptions({ width, height });
    chartRef.current.timeScale().fitContent();
  };

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    const el = chartWrapperRef.current;
    if (!el) return;

    if (!isFullscreen && !document.fullscreenElement) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        }
      } catch (err) {
        console.warn('Native Fullscreen API denied, falling back to CSS overlay:', err);
      }
      setIsFullscreen(true);
      setTimeout(() => updateChartDimensions(true), 80);
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.warn('Exit fullscreen error:', err);
      }
      setIsFullscreen(false);
      setTimeout(() => updateChartDimensions(false), 80);
    }
  };

  // Synchronize native fullscreen change events (e.g. user presses Esc)
  useEffect(() => {
    const handleFsChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      setTimeout(() => updateChartDimensions(active), 100);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => updateChartDimensions(false), 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', () => updateChartDimensions(isFullscreen));

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', () => updateChartDimensions(isFullscreen));
    };
  }, [isFullscreen]);

  // Fetch candle data and render
  const loadCandles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCandles(symbol, activeTf.interval, activeTf.range);
      const rawData = res.data || [];

      if (!rawData.length) {
        setError(`No candle data available for ${symbol}`);
        setLoading(false);
        return;
      }

      // Parse, filter valid numbers, sort strictly by time ascending, then deduplicate
      const parsedItems = [];
      for (const item of rawData) {
        if (!item) continue;
        let t = typeof item.time === 'number' ? item.time : Math.floor(new Date(item.time).getTime() / 1000);
        if (!t || isNaN(t) || t <= 0) continue;
        const o = Number(item.open);
        const h = Number(item.high);
        const l = Number(item.low);
        const c = Number(item.close);
        const v = Number(item.volume || 0);
        if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c) || o <= 0) continue;
        parsedItems.push({
          time: Math.floor(t),
          open: o,
          high: Math.max(h, o, c),
          low: Math.min(l, o, c),
          close: c,
          volume: isNaN(v) ? 0 : Math.max(0, v),
        });
      }

      if (!parsedItems.length) {
        setError(`No valid candle data available for ${symbol}`);
        setLoading(false);
        return;
      }

      parsedItems.sort((a, b) => a.time - b.time);

      const cleanData = [];
      let lastTime = -1;
      for (const item of parsedItems) {
        let t = item.time;
        if (t <= lastTime) {
          t = lastTime + 1;
        }
        lastTime = t;
        cleanData.push({
          time: t,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        });
      }

      if (cleanData.length) {
        const latest = cleanData[cleanData.length - 1];
        setLastCandle(latest);
        setHoverData(latest);
        setCandleData(cleanData);
      }

      // Initialize chart if not created
      if (!chartRef.current && containerRef.current) {
        initChart();
      }

      // Populate series
      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(cleanData);

        // Volume series data
        if (volumeSeriesRef.current) {
          const volData = cleanData.map((d) => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(0, 230, 118, 0.45)' : 'rgba(255, 82, 82, 0.45)',
          }));
          volumeSeriesRef.current.setData(volData);
        }

        // 20-period Moving Average
        if (maSeriesRef.current) {
          const maData = [];
          const period = 20;
          for (let i = period - 1; i < cleanData.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
              sum += cleanData[i - j].close;
            }
            maData.push({
              time: cleanData[i].time,
              value: Number((sum / period).toFixed(2)),
            });
          }
          maSeriesRef.current.setData(maData);
        }

        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Failed to load candles:', err);
      setError('Unable to load chart data for this symbol.');
    } finally {
      setLoading(false);
    }
  };

  const initChart = () => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {}
      chartRef.current = null;
    }

    const container = containerRef.current;
    const initialHeight = isFullscreen ? Math.max(window.innerHeight - 86, 400) : 480;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const colors = getChartColors(isLight);

    // Adaptive institutional chart configuration
    const chart = createChart(container, {
      width: container.clientWidth || 600,
      height: initialHeight,
      autoSize: true,
      layout: {
        background: { color: colors.background },
        textColor: colors.textColor,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
      },
      grid: {
        vertLines: { color: colors.gridLines },
        horzLines: { color: colors.gridLines },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshair, labelBackgroundColor: colors.crosshairLabel },
        horzLine: { color: colors.crosshair, labelBackgroundColor: colors.crosshairLabel },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
        textColor: colors.textColor,
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 1. Candlestick series (High-vis emerald & ruby)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00e676',
      downColor: '#ff5252',
      borderVisible: false,
      wickUpColor: '#00e676',
      wickDownColor: '#ff5252',
      priceFormat: {
        type: 'custom',
        formatter: (v) => `₹${v.toFixed(2)}`,
      },
    });

    // 2. Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // 3. 20 SMA Line series
    const maSeries = chart.addSeries(LineSeries, {
      color: colors.maColor,
      lineWidth: 1.5,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Crosshair listener for real-time OHLC header
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const dataPoint = param.seriesData.get(candleSeries);
        if (dataPoint) {
          setHoverData({
            time: param.time,
            open: dataPoint.open,
            high: dataPoint.high,
            low: dataPoint.low,
            close: dataPoint.close,
          });
        }
      } else if (lastCandle) {
        setHoverData(lastCandle);
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    maSeriesRef.current = maSeries;
  };

  useEffect(() => {
    initChart();
    loadCandles();

    // Auto-refresh every 8 seconds for live ticks
    const interval = setInterval(loadCandles, 8000);

    return () => {
      clearInterval(interval);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
      }
    };
  }, [symbol, activeTf]);

  // Toggle MA visibility
  useEffect(() => {
    if (maSeriesRef.current) {
      maSeriesRef.current.applyOptions({
        visible: showMa,
      });
    }
  }, [showMa]);

  // Dynamic theme listener: update chart styling when light/dark theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      if (!chartRef.current) return;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const c = getChartColors(isLight);
      chartRef.current.applyOptions({
        layout: {
          background: { color: c.background },
          textColor: c.textColor,
        },
        grid: {
          vertLines: { color: c.gridLines },
          horzLines: { color: c.gridLines },
        },
        crosshair: {
          vertLine: { color: c.crosshair, labelBackgroundColor: c.crosshairLabel },
          horzLine: { color: c.crosshair, labelBackgroundColor: c.crosshairLabel },
        },
        rightPriceScale: {
          borderColor: c.borderColor,
          textColor: c.textColor,
        },
        timeScale: {
          borderColor: c.borderColor,
        },
      });
      if (maSeriesRef.current) {
        maSeriesRef.current.applyOptions({
          color: c.maColor,
        });
      }
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const display = hoverData || lastCandle;
  const change = display ? display.close - display.open : 0;
  const changePct = display && display.open ? (change / display.open) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div
      ref={chartWrapperRef}
      className={`kite-chart-container ${isFullscreen ? 'is-fullscreen' : ''}`}
    >
      {/* Top Bar: OHLC Ribbon & Timeframe Switcher */}
      <div className="kite-chart-toolbar">
        <div className="kite-ohlc-display">
          <span className="kite-symbol-label">{displayName || symbol}</span>
          {display && (
            <div className="kite-ohlc-values">
              <span className="ohlc-item">
                <span className="ohlc-k">O:</span> ₹{display.open?.toFixed(2)}
              </span>
              <span className="ohlc-item">
                <span className="ohlc-k">H:</span> ₹{display.high?.toFixed(2)}
              </span>
              <span className="ohlc-item">
                <span className="ohlc-k">L:</span> ₹{display.low?.toFixed(2)}
              </span>
              <span className={`ohlc-item ${isUp ? 'green' : 'red'}`}>
                <span className="ohlc-k">C:</span> ₹{display.close?.toFixed(2)}
              </span>
              <span className={`ohlc-change-badge ${isUp ? 'up' : 'down'}`}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isUp ? '+' : ''}
                {change.toFixed(2)} ({isUp ? '+' : ''}
                {changePct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Timeframes & Controls */}
        <div className="kite-chart-controls">
          <div className="timeframe-group">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                className={`tf-btn ${activeTf.label === tf.label ? 'active' : ''}`}
                onClick={() => setActiveTf(tf)}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            className={`btn-indicator ${showMa ? 'active' : ''}`}
            onClick={() => setShowMa(!showMa)}
            title="Toggle 20-period Moving Average"
          >
            MA 20
          </button>

          {/* Best Time to Buy / Sell Radar Toolbar Button */}
          <button
            className={`btn-timing-bar ${showTimingRadar ? 'active' : ''}`}
            onClick={() => setShowTimingRadar(!showTimingRadar)}
            title={showTimingRadar ? 'Minimize Best Time to Trade Radar' : 'Show Best Time to Buy / Sell Radar'}
          >
            <Clock size={12} />
            <span>Best Time to Trade</span>
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={loadCandles}
            title="Refresh candles"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => chartRef.current?.timeScale().fitContent()}
            title="Reset Zoom / Fit Content"
          >
            <Scan size={13} />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            className={`btn btn-ghost btn-sm btn-fullscreen-toggle ${isFullscreen ? 'active' : ''}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Switch to Full Screen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="fullscreen-btn-text">
              {isFullscreen ? 'Exit' : 'Full Screen'}
            </span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="kite-canvas-wrapper" style={{ position: 'relative' }}>
        {loading && !display && (
          <div className="kite-chart-loading">
            <span className="spin" />
            <span>Loading live candlestick chart for {symbol}...</span>
          </div>
        )}
        {error && <div className="kite-chart-error">{error}</div>}

        {/* Best Time to Buy or Sell - Right Corner Trading Intelligence HUD (Appears on click) */}
        {showTimingRadar && (
          <TradeTimingCard
            symbol={symbol}
            displayName={displayName}
            lastCandle={lastCandle || display}
            candles={candleData}
            onClose={() => setShowTimingRadar(false)}
          />
        )}

        <div
          ref={containerRef}
          style={{ width: '100%', height: isFullscreen ? 'calc(100vh - 86px)' : 480 }}
        />
      </div>

      {/* Footer Meta */}
      <div className="kite-chart-footer">
        <span>Powered by TradingView Lightweight Engine · 8-sec live polling</span>
        <span className="kite-watermark">
          {isFullscreen ? 'PRESS ESC OR CLICK EXIT TO RETURN · ' : ''}ZERODHA KITE PRO
        </span>
      </div>
    </div>
  );
}
