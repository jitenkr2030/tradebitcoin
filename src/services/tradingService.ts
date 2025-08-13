import axios from 'axios';
import { Trade, TradingStrategy, MarketData, BacktestResult, PortfolioAsset } from '../types/trading';

class TradingService {
  private ws: WebSocket | null = null;
  private apiUrl = 'http://localhost:3000/api';
  private priceSubscribers: Set<(price: number) => void> = new Set();
  private analysisSubscribers: Set<(data: MarketData) => void> = new Set();

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.ws = new WebSocket('ws://localhost:8080');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'PRICE_UPDATE':
          this.priceSubscribers.forEach(callback => callback(data.data.price));
          break;
        case 'ANALYSIS_RESULT':
          this.analysisSubscribers.forEach(callback => callback(data.data));
          break;
        case 'TRADE_EXECUTED':
          console.log('Trade executed:', data.data);
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed. Attempting to reconnect...');
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  subscribeToPrice(callback: (price: number) => void) {
    this.priceSubscribers.add(callback);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'SUBSCRIBE_PRICE' }));
    }
    return () => this.priceSubscribers.delete(callback);
  }

  subscribeToAnalysis(callback: (data: MarketData) => void) {
    this.analysisSubscribers.add(callback);
    return () => this.analysisSubscribers.delete(callback);
  }

  async getCurrentPrice(exchange: string = 'binance'): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/price`, {
        params: { exchange }
      });
      return response.data.price;
    } catch (error) {
      console.error('Error fetching price:', error);
      throw error;
    }
  }

  async executeTrade(
    type: 'BUY' | 'SELL',
    price: number,
    amount: number,
    exchange: string = 'binance',
    strategyId: string
  ): Promise<Trade> {
    try {
      const response = await axios.post(`${this.apiUrl}/trade`, {
        type,
        price,
        amount,
        exchange,
        strategyId
      });
      return response.data;
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  async getTradeHistory(): Promise<Trade[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/trades`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trade history:', error);
      throw error;
    }
  }

  async getPortfolio(): Promise<PortfolioAsset[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/portfolio`);
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async runBacktest(
    strategyId: string,
    startDate: string,
    endDate: string,
    initialBalance: number,
    settings: Partial<TradingStrategy>
  ): Promise<BacktestResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/backtest`, {
        strategyId,
        startDate,
        endDate,
        initialBalance,
        settings
      });
      return response.data;
    } catch (error) {
      console.error('Error running backtest:', error);
      throw error;
    }
  }

  calculateRiskMetrics(strategy: TradingStrategy, currentPrice: number) {
    const stopLossPrice = currentPrice * (1 - strategy.stopLoss / 100);
    const takeProfitPrice = currentPrice * (1 + strategy.takeProfit / 100);
    
    return {
      stopLossPrice,
      takeProfitPrice,
      potentialLoss: currentPrice - stopLossPrice,
      potentialProfit: takeProfitPrice - currentPrice,
      riskRewardRatio: (takeProfitPrice - currentPrice) / (currentPrice - stopLossPrice)
    };
  }

  async analyzeMarket(exchange: string, timeframe: string = '1h'): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ANALYZE_MARKET',
        exchange,
        timeframe
      }));
    }
  }
}

export default new TradingService();