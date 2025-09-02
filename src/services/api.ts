import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// WebSocket service
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscribers: Map<string, Set<Function>> = new Map();

  connect() {
    try {
      this.ws = new WebSocket(WS_URL);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers(data.type, data.data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  subscribe(event: string, callback: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  private notifySubscribers(event: string, data: any) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
export const wsService = new WebSocketService();

// API service functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

export const tradingAPI = {
  getCurrentPrice: (symbol = 'BTC/USDT', exchange = 'binance') =>
    api.get('/trading/price', { params: { symbol, exchange } }),
  
  getMarketData: (symbol = 'BTC/USDT', timeframe = '1h') =>
    api.get('/trading/market-data', { params: { symbol, timeframe } }),
  
  executeTrade: (tradeData: any) =>
    api.post('/trading/execute', tradeData),
  
  getTradeHistory: (page = 1, limit = 50) =>
    api.get('/trading/trades', { params: { page, limit } }),
  
  runBacktest: (backtestData: any) =>
    api.post('/trading/backtest', backtestData),
};

export const portfolioAPI = {
  getPortfolio: () =>
    api.get('/portfolio'),
  
  rebalancePortfolio: (allocations: any[]) =>
    api.post('/portfolio/rebalance', { allocations }),
  
  getPerformance: (period = '30d') =>
    api.get('/portfolio/performance', { params: { period } }),
};

export const aiAPI = {
  getRecommendations: (symbol = 'BTC/USDT') =>
    api.get('/ai/recommendations', { params: { symbol } }),
  
  sendChatMessage: (message: string, context?: any) =>
    api.post('/ai/chat', { message, context }),
  
  getPortfolioAnalysis: () =>
    api.get('/ai/portfolio-analysis'),
  
  getMarketSentiment: (symbol = 'BTC') =>
    api.get('/ai/sentiment', { params: { symbol } }),
};

export const taxAPI = {
  calculateTax: (year: number) =>
    api.get('/tax/calculate', { params: { year } }),
  
  generateReport: (year: number) =>
    api.post('/tax/generate', { year }),
  
  getReports: () =>
    api.get('/tax/reports'),
  
  downloadReport: (reportId: string) =>
    api.get(`/tax/download/${reportId}`, { responseType: 'blob' }),
};

export const defiAPI = {
  getPositions: () =>
    api.get('/defi/positions'),
  
  getOpportunities: (filters?: any) =>
    api.get('/defi/opportunities', { params: filters }),
  
  addPosition: (positionData: any) =>
    api.post('/defi/positions', positionData),
  
  getSummary: () =>
    api.get('/defi/summary'),
};

export default api;