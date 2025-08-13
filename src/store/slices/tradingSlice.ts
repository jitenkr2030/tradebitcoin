import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TradingState, Trade, TradingStrategy, MarketData } from '../../types/trading';
import tradingService from '../../services/tradingService';

const initialState: TradingState = {
  isTrading: false,
  currentStrategy: null,
  positions: [],
  balance: 10000,
  profit: 0,
  selectedExchange: 'binance',
  marketData: null,
  subscription: 'FREE',
  loading: false,
  error: null,
  timeframe: '1h',
  tradingPairs: ['BTC/USDT'],
  journal: []
};

export const fetchMarketData = createAsyncThunk(
  'trading/fetchMarketData',
  async (pair: string) => {
    const data = await tradingService.getCurrentPrice();
    return data;
  }
);

export const executeTrade = createAsyncThunk(
  'trading/executeTrade',
  async ({ type, amount, pair }: { type: 'BUY' | 'SELL'; amount: number; pair: string }) => {
    const trade = await tradingService.executeTrade(
      type,
      0, // Current price will be determined by the server
      amount,
      'binance',
      'default'
    );
    return trade;
  }
);

export const runBacktest = createAsyncThunk(
  'trading/runBacktest',
  async ({ startDate, endDate, strategy }: { startDate: string; endDate: string; strategy: TradingStrategy }) => {
    const results = await tradingService.runBacktest(
      strategy.id,
      startDate,
      endDate,
      10000,
      strategy
    );
    return results;
  }
);

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setIsTrading: (state, action) => {
      state.isTrading = action.payload;
    },
    updateMarketData: (state, action) => {
      state.marketData = action.payload;
    },
    addPosition: (state, action) => {
      state.positions.push(action.payload);
    },
    updatePosition: (state, action) => {
      const index = state.positions.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.positions[index] = action.payload;
      }
    },
    removePosition: (state, action) => {
      state.positions = state.positions.filter(p => p.id !== action.payload);
    },
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
    setTimeframe: (state, action) => {
      state.timeframe = action.payload;
    },
    addTradingPair: (state, action) => {
      if (!state.tradingPairs.includes(action.payload)) {
        state.tradingPairs.push(action.payload);
      }
    },
    removeTradingPair: (state, action) => {
      state.tradingPairs = state.tradingPairs.filter(pair => pair !== action.payload);
    },
    addJournalEntry: (state, action) => {
      state.journal.push({
        ...action.payload,
        timestamp: new Date().toISOString()
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false;
        state.marketData = action.payload;
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch market data';
      })
      .addCase(executeTrade.fulfilled, (state, action) => {
        state.positions.push(action.payload);
      });
  }
});

export const {
  setIsTrading,
  updateMarketData,
  addPosition,
  updatePosition,
  removePosition,
  updateBalance,
  setTimeframe,
  addTradingPair,
  removeTradingPair,
  addJournalEntry
} = tradingSlice.actions;

export default tradingSlice.reducer;