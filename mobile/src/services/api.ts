import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:5000/api/v1';
const WS_URL = 'ws://localhost:5000/ws';

// API service for mobile
class APIService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, redirect to login
          await SecureStore.deleteItemAsync('authToken');
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Trading
  async getCurrentPrice(symbol = 'BTC/USDT', exchange = 'binance') {
    return this.request(`/trading/price?symbol=${symbol}&exchange=${exchange}`);
  }

  async getMarketData(symbol = 'BTC/USDT', timeframe = '1h') {
    return this.request(`/trading/market-data?symbol=${symbol}&timeframe=${timeframe}`);
  }

  async executeTrade(tradeData: any) {
    return this.request('/trading/execute', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  }

  async getTradeHistory(page = 1, limit = 50) {
    return this.request(`/trading/trades?page=${page}&limit=${limit}`);
  }

  // Portfolio
  async getPortfolio() {
    return this.request('/portfolio');
  }

  async rebalancePortfolio(allocations: any[]) {
    return this.request('/portfolio/rebalance', {
      method: 'POST',
      body: JSON.stringify({ allocations }),
    });
  }

  // AI
  async getAIRecommendations(symbol = 'BTC/USDT') {
    return this.request(`/ai/recommendations?symbol=${symbol}`);
  }

  async sendChatMessage(message: string, context?: any) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  // Tax
  async calculateTax(year: number) {
    return this.request(`/tax/calculate?year=${year}`);
  }

  async generateTaxReport(year: number) {
    return this.request('/tax/generate', {
      method: 'POST',
      body: JSON.stringify({ year }),
    });
  }

  // DeFi
  async getDeFiPositions() {
    return this.request('/defi/positions');
  }

  async getYieldOpportunities(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/defi/opportunities?${params}`);
  }
}

// WebSocket service for mobile
class MobileWebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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
      console.log('Mobile WebSocket connected');
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
      console.log('Mobile WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Mobile WebSocket error:', error);
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

// Export services
export const apiService = new APIService(API_BASE_URL);
export const mobileWsService = new MobileWebSocketService();

export default apiService;