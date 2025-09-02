import React, { createContext, useContext, useState, useEffect } from 'react';
import { tradingAPI, portfolioAPI, wsService } from '../services/api';
import { TradingState, TradingStrategy, MarketData, Trade } from '../types/trading';
import { useAuth } from './AuthContext';

interface TradingContextType {
  tradingState: TradingState;
  startTrading: () => void;
  stopTrading: () => void;
  updateStrategy: (strategy: TradingStrategy) => void;
  executeManualTrade: (type: 'BUY' | 'SELL', amount: number) => Promise<void>;
  runBacktest: (startDate: string, endDate: string) => Promise<any>;
  rebalancePortfolio: () => Promise<void>;
  fetchMarketData: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const DEFAULT_STRATEGY: TradingStrategy = {
  id: 'default',
  name: 'Conservative Strategy',
  description: 'Basic strategy with moderate risk',
  type: 'SWING',
  stopLoss: 2,
  takeProfit: 3,
  trailingStop: true,
  trailingStopDistance: 1,
  entryThreshold: 0.5,
  exitThreshold: 0.5,
  orderType: 'SPOT',
  riskLevel: 'MEDIUM',
  maxDrawdown: 10,
  indicators: {
    rsi: {
      enabled: true,
      oversold: 30,
      overbought: 70,
      period: 14
    },
    macd: {
      enabled: true,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    },
    bollingerBands: {
      enabled: true,
      period: 20,
      stdDev: 2
    },
    sentiment: {
      enabled: true,
      threshold: 0.5,
      sources: ['twitter', 'reddit', 'news']
    },
    volume: {
      enabled: true,
      threshold: 1.5
    }
  },
  diversification: {
    enabled: true,
    maxAllocation: 20,
    rebalanceThreshold: 5,
    assets: ['BTC', 'ETH', 'BNB']
  },
  notifications: {
    telegram: false,
    email: true,
    sms: false,
    push: true
  }
};

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<TradingState>({
    isTrading: false,
    currentStrategy: DEFAULT_STRATEGY,
    positions: [],
    balance: 10000,
    profit: 0,
    selectedExchange: 'binance',
    selectedPair: 'BTC/USDT',
    marketData: null,
    subscription: user?.subscription || 'FREE',
    loading: false,
    error: null,
    timeframe: '1h',
    tradingPairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
    journal: [],
    alerts: [],
    portfolio: [],
    taxReports: [],
    defiPositions: [],
    nftCollection: []
  });

  useEffect(() => {
    if (user) {
      initializeWebSocket();
      fetchInitialData();
    }
  }, [user]);

  const initializeWebSocket = () => {
    wsService.connect();
    
    // Subscribe to price updates
    const unsubscribe = wsService.subscribe('PRICE_UPDATE', (data: any) => {
      setState(prev => ({
        ...prev,
        marketData: {
          ...prev.marketData,
          price: data.price,
          change24h: data.change24h,
          volume: data.volume
        } as MarketData
      }));
    });

    return unsubscribe;
  };

  const fetchInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Fetch market data
      await fetchMarketData();
      
      // Fetch portfolio
      const portfolioResponse = await portfolioAPI.getPortfolio();
      setState(prev => ({
        ...prev,
        portfolio: portfolioResponse.data.data.portfolio || []
      }));

      // Fetch trade history
      const tradesResponse = await tradingAPI.getTradeHistory();
      setState(prev => ({
        ...prev,
        positions: tradesResponse.data.data.trades || []
      }));

    } catch (error) {
      console.error('Error fetching initial data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load trading data'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await tradingAPI.getMarketData(state.selectedPair, state.timeframe);
      const marketData = response.data.data;
      
      setState(prev => ({
        ...prev,
        marketData: {
          price: marketData.currentPrice,
          volume: marketData.volume,
          high24h: marketData.high24h,
          low24h: marketData.low24h,
          change24h: marketData.change24h,
          indicators: marketData.indicators,
          priceHistory: marketData.priceHistory
        }
      }));
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const startTrading = () => {
    setState(prev => ({ ...prev, isTrading: true }));
    wsService.send({ type: 'START_TRADING', strategy: state.currentStrategy });
  };

  const stopTrading = () => {
    setState(prev => ({ ...prev, isTrading: false }));
    wsService.send({ type: 'STOP_TRADING' });
  };

  const updateStrategy = (strategy: TradingStrategy) => {
    setState(prev => ({ ...prev, currentStrategy: strategy }));
  };

  const executeManualTrade = async (type: 'BUY' | 'SELL', amount: number) => {
    try {
      const tradeData = {
        type,
        symbol: state.selectedPair,
        amount,
        exchange: state.selectedExchange,
        strategyId: 'manual'
      };

      const response = await tradingAPI.executeTrade(tradeData);
      const trade = response.data.data;
      
      setState(prev => ({
        ...prev,
        positions: [trade, ...prev.positions]
      }));

      // Refresh portfolio
      await fetchInitialData();
    } catch (error) {
      console.error('Trade execution error:', error);
      throw error;
    }
  };

  const runBacktest = async (startDate: string, endDate: string) => {
    try {
      const backtestData = {
        strategyId: state.currentStrategy?.id,
        startDate,
        endDate,
        initialBalance: 10000
      };

      const response = await tradingAPI.runBacktest(backtestData);
      return response.data.data;
    } catch (error) {
      console.error('Backtest error:', error);
      throw error;
    }
  };

  const rebalancePortfolio = async () => {
    try {
      const allocations = [
        { symbol: 'BTC/USDT', targetPercent: 60 },
        { symbol: 'ETH/USDT', targetPercent: 30 },
        { symbol: 'BNB/USDT', targetPercent: 10 }
      ];

      await portfolioAPI.rebalancePortfolio(allocations);
      await fetchInitialData();
    } catch (error) {
      console.error('Portfolio rebalancing error:', error);
      throw error;
    }
  };

  const value = {
    tradingState: state,
    startTrading,
    stopTrading,
    updateStrategy,
    executeManualTrade,
    runBacktest,
    rebalancePortfolio,
    fetchMarketData
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}