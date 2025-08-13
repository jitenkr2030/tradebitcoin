import React, { createContext, useContext, useState, useEffect } from 'react';
import tradingService from '../services/tradingService';
import { TradingState, TradingStrategy, MarketData, Trade } from '../types/trading';
import { useAuth } from './AuthContext';

interface TradingContextType {
  tradingState: TradingState;
  startTrading: () => void;
  stopTrading: () => void;
  updateStrategy: (strategy: TradingStrategy) => void;
  executeManualTrade: (type: 'BUY' | 'SELL', amount: number) => Promise<void>;
  runBacktest: (startDate: string, endDate: string) => Promise<void>;
  rebalancePortfolio: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const DEFAULT_STRATEGY: TradingStrategy = {
  id: 'default',
  name: 'Conservative Strategy',
  description: 'Basic strategy with moderate risk',
  stopLoss: 2,
  takeProfit: 3,
  trailingStop: true,
  trailingStopDistance: 1,
  entryThreshold: 0.5,
  exitThreshold: 0.5,
  orderType: 'SPOT',
  indicators: {
    rsi: {
      enabled: true,
      oversold: 30,
      overbought: 70
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
      threshold: 0.5
    }
  },
  diversification: {
    enabled: true,
    maxAllocation: 20,
    rebalanceThreshold: 5
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
    marketData: null,
    subscription: user?.subscription || 'FREE'
  });

  useEffect(() => {
    const priceUnsubscribe = tradingService.subscribeToPrice((price) => {
      setState(prev => ({
        ...prev,
        marketData: {
          ...prev.marketData,
          price
        } as MarketData
      }));
    });

    const analysisUnsubscribe = tradingService.subscribeToAnalysis((data) => {
      setState(prev => ({
        ...prev,
        marketData: {
          ...prev.marketData,
          ...data
        } as MarketData
      }));
    });

    return () => {
      priceUnsubscribe();
      analysisUnsubscribe();
    };
  }, []);

  const startTrading = () => {
    setState(prev => ({ ...prev, isTrading: true }));
  };

  const stopTrading = () => {
    setState(prev => ({ ...prev, isTrading: false }));
  };

  const updateStrategy = (strategy: TradingStrategy) => {
    setState(prev => ({ ...prev, currentStrategy: strategy }));
  };

  const executeManualTrade = async (type: 'BUY' | 'SELL', amount: number) => {
    try {
      const trade = await tradingService.executeTrade(
        type,
        state.marketData?.price || 0,
        amount,
        state.selectedExchange,
        state.currentStrategy?.id || 'default'
      );
      
      setState(prev => ({
        ...prev,
        positions: [...prev.positions, trade]
      }));
    } catch (error) {
      console.error('Trade execution error:', error);
      throw error;
    }
  };

  const runBacktest = async (startDate: string, endDate: string) => {
    try {
      const results = await tradingService.runBacktest(
        state.currentStrategy?.id || 'default',
        startDate,
        endDate,
        state.balance,
        state.currentStrategy || DEFAULT_STRATEGY
      );
      
      // Handle backtest results
      console.log('Backtest results:', results);
    } catch (error) {
      console.error('Backtest error:', error);
      throw error;
    }
  };

  const rebalancePortfolio = async () => {
    try {
      await tradingService.rebalancePortfolio();
      // Fetch updated portfolio
      const portfolio = await tradingService.getPortfolio();
      // Update state with new portfolio data
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
    rebalancePortfolio
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