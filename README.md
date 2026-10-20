# ZeroTrader — Institutional-Grade Live Trading Terminal

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Zerodha](https://img.shields.io/badge/KiteConnect-5.2+-FF5722.svg?style=flat-square)](https://kite.trade)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A high-performance, real-time institutional trading terminal built with **React**, **FastAPI**, and the **Zerodha Kite Connect API**. Features a comprehensive **Daily Market Tracker** with historical OHLC analysis, **Dual-Engine Candlestick Charting** with a live **Trade Timing Radar** (Best Time to Buy/Sell), real-time **Option Chain & Greeks** analysis, automated **Financial News Intelligence** with market impact scoring, and complete **Order & Portfolio Management**.

Designed with an ultra-sleek, zero-shadow aesthetic featuring dual **Dark Mode** (`#111111` obsidian + charcoal + metallic silver) and **Light Mode** themes with strict sharp corners (`border-radius: 0px`) and high-density typography.

---

## Key Features

### 1. Daily Market Tracker & Sector Heatmap (`/market-tracker`)
- **Market Pulse & Volatility Bar**:
  - Live tick cards for **NIFTY 50**, **SENSEX**, and **INDIA VIX** with real-time day range and percentage changes.
  - Volatility regime status badge (`Low Volatility`, `Moderate Volatility`, `High Volatility`).
  - **Market Breadth Indicator**: Live Advances, Declines, Unchanged counts, advance-to-decline ratio, and automated sentiment tag (`Bullish Breadth`, `Bearish Breadth`, `Neutral`).
- **Sectoral Heatmap & Performance Matrix**:
  - 8 core industry sectors: **Nifty Bank**, **Nifty IT**, **Nifty Auto**, **Nifty Metal**, **Nifty FMCG**, **Nifty Pharma**, **Nifty Energy**, and **Nifty Realty**.
  - Intraday high-low range slider with live position marker.
  - Multi-timeframe trend status (`1H` and `4H` algorithmic trends).
  - 1-click navigation to the sector's interactive candlestick chart.
- **Historical OHLC Records Tracker**:
  - **Categorized Pair Selector**: Dropdown menu covering Benchmark Indices, Sectoral Indices, and Top Equities (Reliance, HDFC Bank, TCS, Infosys, etc.).
  - **Timeframe Selector**: Segmented toggle between **1 Hr (Hourly)** and **4 Hr (4-Hour institutional candles)**.
  - **Custom Date Range Filter**: Calendar `From Date` and `To Date` controls with quick presets (**Today / 1D**, **Last 3 Days**, **Last 7 Days**, **Last 15 Days**, **Last 30 Days**).
  - **Period Summary Stats Strip**: Live aggregate statistics displaying `PERIOD LOW`, `PERIOD OPEN`, `PERIOD CLOSE`, `PERIOD HIGH`, `PERIOD RANGE`, and `PERIOD RETURN %`.
  - **Tabular Historical OHLC Grid**: Structured table presenting columns in the exact trader order:
    `DATE / TIME SLOT` | `PAIR / SYMBOL` | `TIMEFRAME` | `LOW (₹)` | `OPEN (₹)` | `CLOSE (₹)` | `HIGH (₹)` | `RANGE (₹)` | `RETURN %` | `VOLUME` | `TREND` | `ACTIONS`
  - **1-Click CSV Export**: Download filtered historical OHLC records with custom timestamped filenames.
  - **1-Click Trade & Chart Actions**: Direct launch of live Order Modal and interactive Candlestick Charts from any row.
- **NSE Market Movers**:
  - Tabbed rankings for **Top Gainers**, **Top Losers**, and **Volume Shockers** across the NSE segment.

---

### 2. Dual-Engine Candlestick Charts & Trade Timing Radar (`/charts`)
- **Dual Charting Engines**:
  - **Kite Pro Engine**: Zerodha-native TradingView Lightweight Charts powered by live real-time OHLCV candlestick feeds with multi-timeframe switching (`1m`, `5m`, `15m`, `1h`, `1D`), MA 9 and MA 20 Moving Averages, and volume histograms.
  - **TradingView Advanced Cloud Engine**: Full technical analysis suite with drawing tools, indicators, and symbol resolution.
  - **1-Click Fullscreen Viewport**: Expanded edge-to-edge chart analysis mode (`Esc` to exit).
- **"Best Time to Buy or Sell" Timing Radar (`TradeTimingCard`)**:
  - Real-time trading session phase analyzer based on Indian market hours (IST):
    - `09:15 – 10:00 AM`: Opening Volatility & Price Discovery
    - `10:00 – 11:30 AM`: Primary Institutional Trend Window (Optimal Entry)
    - `11:30 – 01:30 PM`: Mid-Day Lunch Consolidation (Range-bound / Mean Reversion)
    - `01:30 – 03:00 PM`: European Cross & Afternoon Momentum (Breakout Continuation)
    - `03:00 – 03:30 PM`: Intraday Square-off & Closing Volatility
  - Actionable directional buy/sell scoring, risk level indicator, and recommended strategies (e.g., Trend Riding, Breakout Pullbacks, Scaling Out).
  - Collapsible, draggable overlay widget with 1-click minimize/restore.
- **Smart Typo Normalizer**: Resolves common search misspellings (e.g., `nofty`, `niftyfifty`, `banknifty`, `baknifty`, `relaince`) automatically to their correct exchange tickers.

---

### 3. Financial News & Real-Time Market Impact Intelligence
- **Pinned TopBar Notification Menu**: Unread notification counter with animated pulse alert for high-impact market news.
- **Aggregated Financial News**: Live feed from leading financial portals (*The Economic Times*, *Moneycontrol*, *Livemint*, *NDTV Profit*, *Reuters*).
- **Automated Market Impact Analysis**:
  - **Impact Severity**: `HIGH IMPACT`, `MEDIUM IMPACT`, `LOW IMPACT`.
  - **Directional Bias & Expected Move**: Quantified projection (e.g., `▲ BULLISH (+1.8%)` or `▼ BEARISH (-1.4%)`).
  - **Target Instruments & Affected Sectors**: Direct mapping to equities and indices.
  - **Trader's Take**: Clear, actionable summary explaining the market mechanism.
  - **Direct Actions**: Instant `Chart` inspection and `Trade` order modal launch.

---

### 4. Live Option Chain & Greeks Matrix (`/option-chain`)
- Real-time strike chain for `NIFTY`, `BANKNIFTY`, and `FINNIFTY`.
- Expiry date filter and strike depth selector (ATM ± 10 strikes).
- Comprehensive metrics: Call & Put LTP, Open Interest (OI), Volume, Implied Volatility (IV), and Greeks (Delta, Theta).
- Interactive option contract charts and direct Buy/Sell order placement.

---

### 5. Watchlist & Live Quotes (`/watchlist`)
- Real-time multi-symbol price quotes with streaming ticks.
- Customizable symbol list saved locally with instant add/remove controls.
- Fast access to Candlestick Charts, Option Chains, and Order placement.

---

### 6. Portfolio, Orders & Trades Management (`/portfolio`, `/orders`, `/trades`)
- **Portfolio Overview**: Live Day P&L, Overall Net P&L, Margin utilization, and active holdings.
- **Order Execution Modal**: Buy and Sell market or limit orders supporting:
  - `CNC` (Cash & Carry for delivery)
  - `MIS` (Margin Intraday Square-off)
  - `NRML` (Normal for F&O derivatives)
- **Order Book & Trade History**: Real-time status tracking for Open, Completed, Cancelled, and Rejected orders.

---

### 7. Persistent TopBar Header & Dual Theme System
- Live marquee tickers for **NIFTY 50**, **BANK NIFTY**, and **SENSEX**.
- Real-time IST market clock and live NSE / BSE connectivity indicator.
- **Dual Theme Support**: 1-click toggle between **Dark Mode** (Obsidian `#111111`) and **Light Mode** (`#ffffff` crisp contrast) with persistent theme preferences.
- **Strict Zero-Shadow Philosophy**: Clean, industrial trading aesthetic with `box-shadow: none !important` and `border-radius: 0px !important`.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, React Router DOM 7, Lucide Icons, Lightweight Charts 5.2 |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, KiteConnect 5.2, ThreadPoolExecutor, Requests |
| **Market Data** | Zerodha KiteConnect API, Yahoo Finance API (`interval=1h` & `range=1d`), Google News RSS |
| **Styling** | Vanilla CSS Design System, Google Fonts (`Outfit`, `Plus Jakarta Sans`, `JetBrains Mono`) |

---

## Design System

The application strictly implements an institutional trading terminal design language:

- **Color Palette (Dark Mode)**:
  - Background Deep: `#0c0d0e`
  - Obsidian Base: `#111316`
  - Charcoal Card Surface: `#16181b` / `#1c2025`
  - Metallic Silver Accent: `#C0C0C0` / `#94a3b8`
  - Profit / Uptrend: `#22c55e` / `#4ade80`
  - Loss / Downtrend: `#ef4444` / `#f87171`
- **Color Palette (Light Mode)**:
  - Background Base: `#f8f9fa` / `#ffffff`
  - Crisp Borders: `#cbd5e1` / `#e2e8f0`
  - High Contrast Text: `#0f172a` / `#334155`
- **Corners**: Strictly **`0px` border-radius** across all buttons, tables, badges, cards, and modals.
- **Typography**:
  - Headings: `Outfit` (Bold, geometric)
  - UI & Body: `Plus Jakarta Sans` (Clean, highly legible)
  - Numbers & Tickers: `JetBrains Mono` (Tabular numeric alignment)

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.10+
- A valid **Zerodha Kite Connect Developer account** ([kite.trade](https://kite.trade))

---

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd server

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure `.env`
Create or update `server/.env`:
```env
ZERODHA_API_KEY=your_kite_api_key_here
ZERODHA_API_SECRET=your_kite_api_secret_here
ZERODHA_ACCESS_TOKEN=  # Auto-populated via callback
```

#### Run Backend Server
```bash
uvicorn main:app --reload --port 8000
```
- Backend runs at `http://localhost:8000`
- Interactive API documentation available at `http://localhost:8000/docs`

---

### 2. Zerodha Kite Authentication (Daily Login)

1. Open your browser and navigate to:
   ```
   http://localhost:8000/api/login-url
   ```
2. Log in with your Zerodha credentials and 2FA.
3. Zerodha redirects to your registered callback URL with a `?request_token=...` parameter.
4. Pass the token to the callback endpoint:
   ```
   http://localhost:8000/api/callback?request_token=YOUR_REQUEST_TOKEN
   ```
5. The access token is automatically saved into `server/.env`.
6. Restart the backend server.

*(Note: If Kite credentials are not configured, the app runs in resilient simulation mode with real-time Yahoo Finance fallback data).*

---

### 3. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd client

# Install packages
npm install

# Start Vite development server
npm run dev
```

- Frontend terminal opens at `http://localhost:5173`

---

## Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/market-tracker` | Live market pulse (Nifty, Sensex, VIX, breadth), 8 sector heatmaps, and top movers |
| `GET` | `/api/market-tracker/history` | Historical OHLC candles (`symbol`, `timeframe=1h\|4h`, `from_date`, `to_date`) |
| `GET` | `/api/news` | Live financial headlines with AI market impact assessment and target tickers |
| `GET` | `/api/candles` | Real-time OHLCV candlestick data for Kite Pro charts (`symbol`, `interval`, `range`) |
| `GET` | `/api/option-chain` | Real-time Call/Put strike matrix, OI, IV, and Greeks for indices |
| `GET` | `/api/option-chart` | Historical strike candlestick data for option contract viewer |
| `GET` | `/api/quote` | Live multi-symbol streaming market quotes (`symbols=NIFTY,BANKNIFTY,RELIANCE`) |
| `GET` | `/api/profile` | Current trader account profile and available cash margins |
| `GET` | `/api/holdings` | Portfolio holdings with unrealized P&L |
| `GET` | `/api/positions` | Active intraday and overnight open positions |
| `GET` | `/api/orders` | Full order book history |
| `POST` | `/api/order/place` | Place Market/Limit order (CNC, MIS, NRML) |
| `DELETE`| `/api/order/{id}` | Cancel pending order |
| `GET` | `/health` | Server and Kite authentication status check |

---

## Project Structure

```
zerodha-trader/
├── client/
│   ├── public/                    # Static favicon and assets
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── KiteCandleChart.jsx       # Zerodha Lightweight Candlesticks
│   │   │   ├── TradeTimingCard.jsx       # Best Time to Buy/Sell Timing Radar
│   │   │   ├── TradingViewAdvanced.jsx   # TradingView Cloud Widget
│   │   │   ├── NotificationMenu.jsx      # Financial News & Impact Menu
│   │   │   ├── TopBar.jsx                # Persistent Top Header with Live Marquee & Theme Toggle
│   │   │   ├── OrderModal.jsx            # Trade Execution Modal (CNC, MIS, NRML)
│   │   │   ├── Sidebar.jsx               # Navigation Sidebar
│   │   │   └── StatCard.jsx              # P&L and Margin Metrics Cards
│   │   ├── pages/                 # Main route views
│   │   │   ├── MarketTracker.jsx         # Daily Market Tracker, Sectors & Historical OHLC
│   │   │   ├── MarketTracker.css         # Tracker styling (Pulse, Heatmap, Aligned Table)
│   │   │   ├── Charts.jsx                # Dual-Engine Candlestick Charts Page
│   │   │   ├── OptionChain.jsx           # Strike Matrix & Greeks Analysis
│   │   │   ├── Watchlist.jsx             # Live Quotes Watchlist
│   │   │   ├── Portfolio.jsx             # Holdings & Positions
│   │   │   ├── Orders.jsx                # Order Book
│   │   │   └── Trades.jsx                # Executed Trades History
│   │   ├── lib/
│   │   │   ├── api.js                    # Axios API client functions
│   │   │   ├── storage.js                # LocalStorage persistence manager
│   │   │   └── symbols.js                # Typo resolver & symbol normalizer
│   │   ├── App.jsx                # App layout & routing
│   │   └── index.css              # Global design system, tokens & theme overrides
│   └── package.json
├── server/
│   ├── main.py                    # FastAPI server & route handlers
│   ├── requirements.txt           # Python package dependencies
│   └── .env                       # Kite API credentials (gitignored)
└── README.md                      # Project documentation
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
