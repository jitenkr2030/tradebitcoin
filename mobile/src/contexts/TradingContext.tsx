import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
}

interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  amount: number;
  price: number;
  timestamp: string;
  profitLoss?: number;
}

interface TradingContextType {
  marketData: MarketData[];
  trades: Trade[];
  portfolio: any[];
  isTrading: boolean;
  loading: boolean;
  startTrading: () => void;
  stopTrading: () => void;
  executeTrade: (type: 'BUY' | 'SELL', symbol: string, amount: number) => Promise<void>;
  fetchMarketData: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState([]);
  const [isTrading, setIsTrading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMarketData();
      fetchPortfolio();
      setupWebSocket();
    }
  }, [user]);

  const setupWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PRICE_UPDATE') {
        setMarketData(prev => 
          prev.map(item => 
            item.symbol === data.symbol 
              ? { ...item, price: data.price, change24h: data.change24h }
              : item
          )
        );
      }
    };

    return () => ws.close();
  };

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/trading/market-data');
      const data = await response.json();
      setMarketData(data.data || []);
    } catch (error) {
      console.error('Fetch market data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch('http://localhost:5000/api/v1/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPortfolio(data.data?.portfolio || []);
    } catch (error) {
      console.error('Fetch portfolio error:', error);
    }
  };

  const executeTrade = async (type: 'BUY' | 'SELL', symbol: string, amount: number) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch('http://localhost:5000/api/v1/trading/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, symbol, amount, exchange: 'binance' }),
      });

      if (!response.ok) throw new Error('Trade execution failed');

      const data = await response.json();
      setTrades(prev => [data.data, ...prev]);
      await fetchPortfolio();
    } catch (error) {
      console.error('Execute trade error:', error);
      throw error;
    }
  };

  const startTrading = () => setIsTrading(true);
  const stopTrading = () => setIsTrading(false);

  const value = {
    marketData,
    trades,
    portfolio,
    isTrading,
    loading,
    startTrading,
    stopTrading,
    executeTrade,
    fetchMarketData,
    fetchPortfolio,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}