import { useState, useEffect } from 'react';
import { Trade, TradingStrategy, TradingState } from '../types/trading';

const DEFAULT_STRATEGY: TradingStrategy = {
  id: 'default',
  name: 'Conservative Strategy',
  description: 'Basic strategy with moderate risk',
  stopLoss: 2,
  takeProfit: 3,
  trailingStop: true,
  trailingStopDistance: 1
};

export function useTrading() {
  const [state, setState] = useState<TradingState>({
    isTrading: false,
    currentStrategy: DEFAULT_STRATEGY,
    positions: [],
    balance: 10000, // Demo balance
    profit: 0
  });

  useEffect(() => {
    // Initialize WebSocket connection and trading service
    // Subscribe to price updates and trading signals
    return () => {
      // Cleanup WebSocket connection
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

  return {
    tradingState: state,
    startTrading,
    stopTrading,
    updateStrategy
  };
}