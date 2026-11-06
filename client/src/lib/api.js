import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
});

export const getLoginUrl = () => api.get('/api/login-url');
export const handleCallback = (token) => api.get(`/api/callback?request_token=${token}`);
export const getProfile = () => api.get('/api/profile');
export const getHoldings = () => api.get('/api/holdings');
export const getPositions = () => api.get('/api/positions');
export const getOrders = () => api.get('/api/orders');
export const getTrades = () => api.get('/api/trades');
export const getPnL = () => api.get('/api/pnl');
export const getMargins = () => api.get('/api/margins');
export const getQuote = (symbols) => api.get(`/api/quote?symbols=${symbols}`);
export const getInstruments = (exchange = 'NSE') => api.get(`/api/instruments?exchange=${exchange}`);
export const getOptionChain = (symbol = 'NIFTY') => api.get(`/api/option-chain?symbol=${symbol}`);
export const getOptionChart = (symbol, strike, type, ltp) =>
  api.get(`/api/option-chart?symbol=${symbol}&strike=${strike}&option_type=${type}&ltp=${ltp}`);
export const getCandles = (symbol = 'NIFTY', interval = '5m', range = '1d') =>
  api.get(`/api/candles?symbol=${symbol}&interval=${interval}&range=${range}`);
export const placeOrder = (order) => api.post('/api/order/place', order);
export const cancelOrder = (orderId) => api.delete(`/api/order/${orderId}`);
export const getNews = () => api.get('/api/news');
export const getMarketTracker = () => api.get('/api/market-tracker');
export const getMarketTrackerHistory = (
  symbol = 'NIFTY 50',
  timeframe = '1h',
  fromDate = '',
  toDate = ''
) =>
  api.get(
    `/api/market-tracker/history?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&from_date=${fromDate}&to_date=${toDate}`
  );
export const checkHealth = () => api.get('/health');

export default api;
export const getIpos = () => api.get('/api/ipos');
