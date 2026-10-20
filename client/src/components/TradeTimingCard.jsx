import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Target,
  Sparkles,
  Minus,
  X,
} from 'lucide-react';
import './TradeTimingCard.css';

/**
 * Calculates current Indian Standard Time (IST) details
 */
function getISTDetails() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 3600000);
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMins = hours * 60 + minutes;
  const timeStr = istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return { hours, minutes, totalMins, timeStr, day: istDate.getDay() };
}

export default function TradeTimingCard({
  symbol = 'NIFTY',
  displayName = 'NIFTY 50',
  lastCandle = null,
  candles = [],
  onClose = null,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [ist, setIst] = useState(getISTDetails);

  // Keep IST clock live every second
  useEffect(() => {
    const timer = setInterval(() => {
      setIst(getISTDetails());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Market Timing Window Analysis (IST)
  const windowAnalysis = useMemo(() => {
    const m = ist.totalMins;
    const isWeekend = ist.day === 0 || ist.day === 6;

    if (isWeekend) {
      return {
        phase: 'WEEKEND_CLOSED',
        title: 'Weekend Market Closed',
        badge: 'CLOSED',
        statusColor: 'muted',
        advice: 'Markets reopen Monday at 09:15 IST.',
        nextTrigger: 'Monday 09:15 IST (Market Open)',
        buyRating: 'HOLD',
        sellRating: 'HOLD',
        score: 50,
      };
    }

    // 09:15 - 09:45: Opening Volatility / Price Discovery
    if (m >= 555 && m < 585) {
      return {
        phase: 'OPENING_ORB',
        title: 'Opening Volatility Window',
        badge: 'ORB DISCOVERY',
        statusColor: 'yellow',
        advice: 'Wait for the 15-30m Opening Range Breakout (ORB). High trap probability.',
        nextTrigger: '09:45 IST (Prime Momentum Window Starts)',
        buyRating: 'WAIT FOR ORB',
        sellRating: 'WAIT',
        score: 62,
      };
    }

    // 09:45 - 11:30: Prime Morning Trend Window (BEST BUY MOMENTUM)
    if (m >= 585 && m < 690) {
      return {
        phase: 'MORNING_MOMENTUM',
        title: 'Morning Trend Window',
        badge: 'PRIME BUY/SELL MOMENTUM',
        statusColor: 'green',
        advice: '⭐ Optimal window for Breakout Buys & Trend Following entries with maximum liquidity.',
        nextTrigger: '11:30 IST (Midday Consolidation Window)',
        buyRating: 'STRONG BUY (ON PULLBACKS)',
        sellRating: 'SELL RALLIES',
        score: 88,
      };
    }

    // 11:30 - 13:15: Midday Consolidation / Chop
    if (m >= 690 && m < 795) {
      return {
        phase: 'MIDDAY_CHOP',
        title: 'Midday Consolidation Zone',
        badge: 'LUNCH CHOP',
        statusColor: 'yellow',
        advice: 'Low institutional volume. High theta decay & slippage. Avoid fresh breakout buys.',
        nextTrigger: '13:15 IST (European Overlap Window Starts)',
        buyRating: 'HOLD / RANGE ACCUMULATE',
        sellRating: 'WAIT / RANGE SHORT',
        score: 54,
      };
    }

    // 13:15 - 14:45: European Market Overlap & Afternoon Trend
    if (m >= 795 && m < 885) {
      return {
        phase: 'AFTERNOON_TREND',
        title: 'Afternoon Trend Window',
        badge: 'EUROPEAN IMPACT',
        statusColor: 'green',
        advice: '⭐ Strong directional continuation following European opens. Optimal for scaling into winners.',
        nextTrigger: '14:45 IST (Power Hour Square-off)',
        buyRating: 'OPTIMAL BUY (CONTINUATION)',
        sellRating: 'TAKE PARTIAL PROFITS',
        score: 84,
      };
    }

    // 14:45 - 15:30: Power Hour & Intraday Square-off (BEST SELL / PROFIT WINDOW)
    if (m >= 885 && m < 930) {
      return {
        phase: 'POWER_HOUR_SQUAREOFF',
        title: 'Power Hour & Square-off',
        badge: 'OPTIMAL SELL / EXIT',
        statusColor: 'red',
        advice: '⭐ Peak profit booking phase. Brokers auto square-off MIS at 15:15 - 15:20 IST. Avoid new buys.',
        nextTrigger: '15:30 IST (Exchange Close)',
        buyRating: 'DO NOT BUY (EXIT MIS)',
        sellRating: 'OPTIMAL PROFIT EXIT',
        score: 91,
      };
    }

    // Market Closed (After 15:30 or before 09:15)
    return {
      phase: 'CLOSED',
      title: 'Market Closed',
      badge: 'OFF-MARKET HOURS',
      statusColor: 'muted',
      advice: 'Historical data analytics active. Next prime entry window begins at 09:45 IST.',
      nextTrigger: 'Tomorrow 09:15 IST (Pre-Market Open)',
      buyRating: 'BUY WINDOW: 09:45 - 11:15 IST',
      sellRating: 'SELL WINDOW: 14:45 - 15:20 IST',
      score: 75,
    };
  }, [ist.totalMins, ist.day]);

  // Technical Levels Calculation (RSI, Moving Average, Zones)
  const techAnalysis = useMemo(() => {
    const price = lastCandle?.close || 0;
    if (!price) {
      return {
        rsi: 50,
        rsiStatus: 'Neutral',
        trend: 'Neutral',
        buyZone: null,
        sellZone: null,
        stopLoss: null,
        signal: 'WAIT FOR DATA',
        signalType: 'neutral',
      };
    }

    // 1. Calculate RSI(14)
    let rsi = 50;
    if (candles && candles.length >= 15) {
      let gains = 0;
      let losses = 0;
      const count = Math.min(14, candles.length - 1);
      const startIdx = candles.length - count;
      for (let i = startIdx; i < candles.length; i++) {
        const diff = candles[i].close - candles[i - 1].close;
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / count;
      const avgLoss = losses / count;
      if (avgLoss === 0) rsi = 100;
      else {
        const rs = avgGain / avgLoss;
        rsi = Math.round(100 - 100 / (1 + rs));
      }
    }

    // 2. Calculate 20 SMA
    let ma20 = null;
    if (candles && candles.length >= 20) {
      const sum = candles.slice(-20).reduce((acc, c) => acc + c.close, 0);
      ma20 = sum / 20;
    }

    // 3. Support & Resistance Pivot Bounds
    let support = price * 0.994;
    let resistance = price * 1.018;
    if (candles && candles.length >= 10) {
      const recent = candles.slice(-25);
      const lows = recent.map((c) => c.low).filter(Boolean);
      const highs = recent.map((c) => c.high).filter(Boolean);
      if (lows.length) support = Math.min(...lows);
      if (highs.length) resistance = Math.max(...highs);
    }

    const buyZone = {
      min: (support * 1.001).toFixed(2),
      max: (Math.min(price, support * 1.008)).toFixed(2),
    };
    const sellZone = {
      min: (Math.max(price, resistance * 0.995)).toFixed(2),
      max: (resistance * 1.012).toFixed(2),
    };
    const stopLoss = (support * 0.992).toFixed(2);

    // Derive Signal
    let rsiStatus = 'Neutral Momentum (50)';
    let signal = 'BUY ON PULLBACK';
    let signalType = 'green';

    if (rsi < 35) {
      rsiStatus = `Oversold (${rsi}) · Strong Buy Setup`;
      signal = 'PRIME BUY (OVERSOLD DIP)';
      signalType = 'green';
    } else if (rsi > 70) {
      rsiStatus = `Overbought (${rsi}) · High Risk`;
      signal = 'PRIME SELL (PROFIT BOOKING)';
      signalType = 'red';
    } else if (ma20 && price > ma20) {
      rsiStatus = `Bullish Structure (${rsi}) · Trending Above MA`;
      signal = 'BUY DIP (TREND ALIGNED)';
      signalType = 'green';
    } else if (ma20 && price < ma20) {
      rsiStatus = `Bearish Momentum (${rsi}) · Below MA`;
      signal = 'SELL ON RALLIES / SHORT';
      signalType = 'red';
    }

    const trend = ma20
      ? price >= ma20
        ? 'Bullish (Above 20-MA)'
        : 'Bearish (Below 20-MA)'
      : 'Sideways';

    return {
      rsi,
      rsiStatus,
      trend,
      buyZone,
      sellZone,
      stopLoss,
      signal,
      signalType,
      currentPrice: price,
    };
  }, [lastCandle, candles]);

  return (
    <div className={`trade-timing-card ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Card Header */}
      <div
        className="trade-timing-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Click to expand Best Time to Trade Radar' : 'Click to minimize'}
      >
        <div className="trade-timing-title-group">
          <Clock size={13} className="timing-clock-icon" />
          <span className="timing-title-text">BEST TIME TO BUY / SELL</span>
          
          {isCollapsed ? (
            <span className={`timing-collapsed-signal-tag ${techAnalysis.signalType}`}>
              {techAnalysis.signal}
            </span>
          ) : (
            <span className={`timing-phase-chip ${windowAnalysis.statusColor}`}>
              <span className="timing-pulse-dot" />
              {windowAnalysis.badge}
            </span>
          )}

          {isCollapsed && (
            <span className="timing-collapsed-summary">
              BUY: <strong>09:45-11:15</strong> · SELL: <strong>14:45-15:20 IST</strong>
            </span>
          )}
        </div>

        <div className="timing-header-actions">
          {onClose && (
            <button
              className="timing-minimize-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Minimize to Toolbar (Best Time to Trade)"
            >
              <Minus size={12} />
              <span>Minimize</span>
            </button>
          )}

          <button
            className="timing-collapse-btn"
            aria-label={isCollapsed ? 'Expand timing radar' : 'Collapse timing radar'}
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            title={isCollapsed ? 'Expand Details' : 'Compact View'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {onClose && (
            <button
              className="timing-close-icon-btn"
              aria-label="Close timing radar"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close and return to toolbar"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Comprehensive Intelligence Panel */}
      {!isCollapsed && (
        <div className="trade-timing-body">
          {/* Real-time Recommendation Banner */}
          <div className={`timing-signal-banner ${techAnalysis.signalType}`}>
            <div className="signal-top-row">
              <span className="signal-label">REAL-TIME TIMING SIGNAL</span>
              <span className="signal-confidence">
                <Sparkles size={11} /> {windowAnalysis.score}% TIMING SCORE
              </span>
            </div>
            <div className="signal-main-row">
              <span className="signal-verdict">{techAnalysis.signal}</span>
              <span className="signal-icon">
                {techAnalysis.signalType === 'green' ? (
                  <TrendingUp size={18} />
                ) : (
                  <TrendingDown size={18} />
                )}
              </span>
            </div>
            <div className="signal-caption">{windowAnalysis.advice}</div>
          </div>

          {/* Institutional Window Guidance Matrix */}
          <div className="timing-schedule-grid">
            <div className="schedule-box buy-box">
              <div className="schedule-box-header">
                <span className="schedule-box-tag buy">OPTIMAL BUY WINDOWS</span>
              </div>
              <div className="schedule-hours">09:45 – 11:15 IST</div>
              <div className="schedule-hours-secondary">+ 13:30 – 14:30 IST</div>
              <div className="schedule-desc">
                High institutional accumulation volume &amp; breakout follow-through.
              </div>
            </div>

            <div className="schedule-box sell-box">
              <div className="schedule-box-header">
                <span className="schedule-box-tag sell">OPTIMAL SELL WINDOWS</span>
              </div>
              <div className="schedule-hours">14:45 – 15:20 IST</div>
              <div className="schedule-hours-secondary">+ 11:30 – 12:15 IST</div>
              <div className="schedule-desc">
                Peak intraday square-off liquidity &amp; rally exhaustion booking.
              </div>
            </div>
          </div>

          {/* Current Trigger Price Zones for this symbol */}
          {techAnalysis.buyZone && (
            <div className="timing-levels-block">
              <div className="levels-title">
                <Target size={12} />
                <span>RECOMMENDED ENTRY &amp; TARGET ZONES ({symbol})</span>
              </div>

              <div className="levels-grid">
                <div className="level-item buy-level">
                  <span className="level-k">BUY ACCUMULATION</span>
                  <span className="level-v">
                    ₹{techAnalysis.buyZone.min} – ₹{techAnalysis.buyZone.max}
                  </span>
                </div>

                <div className="level-item sell-level">
                  <span className="level-k">PROFIT TARGET</span>
                  <span className="level-v">
                    ₹{techAnalysis.sellZone.min} – ₹{techAnalysis.sellZone.max}
                  </span>
                </div>

                <div className="level-item sl-level">
                  <span className="level-k">STOP LOSS (INVALIDATION)</span>
                  <span className="level-v">₹{techAnalysis.stopLoss}</span>
                </div>
              </div>
            </div>
          )}

          {/* Indicator Pulse Bar */}
          <div className="timing-footer-meta">
            <div className="meta-item">
              <span className="meta-k">RSI (14):</span>
              <span className="meta-v">{techAnalysis.rsiStatus}</span>
            </div>
            <div className="meta-item">
              <span className="meta-k">Trend:</span>
              <span className="meta-v">{techAnalysis.trend}</span>
            </div>
            <div className="meta-item next-window">
              <span className="meta-k">Next Transition:</span>
              <span className="meta-v highlight">{windowAnalysis.nextTrigger}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
