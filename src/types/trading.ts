export interface Trade {
  id: number;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  exchange: string;
  timestamp: string;
  orderType: 'SPOT' | 'MARGIN' | 'FUTURES' | 'OCO';
  leverage?: number;
  margin?: number;
  stopLoss?: number;
  takeProfit?: number;
  profitLoss?: number;
  indicators?: {
    rsi: number;
    macd: {
      MACD: number;
      signal: number;
      histogram: number;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
    sentimentScore?: number;
  };
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'SCALPING' | 'SWING' | 'TREND_FOLLOWING' | 'ARBITRAGE' | 'DCA';
  stopLoss: number;
  takeProfit: number;
  trailingStop: boolean;
  trailingStopDistance: number;
  entryThreshold: number;
  exitThreshold: number;
  orderType: 'SPOT' | 'MARGIN' | 'FUTURES';
  leverage?: number;
  margin?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxDrawdown: number;
  indicators: {
    rsi: {
      enabled: boolean;
      oversold: number;
      overbought: number;
      period: number;
    };
    macd: {
      enabled: boolean;
      fastPeriod: number;
      slowPeriod: number;
      signalPeriod: number;
    };
    bollingerBands: {
      enabled: boolean;
      period: number;
      stdDev: number;
    };
    sentiment: {
      enabled: boolean;
      threshold: number;
      sources: string[];
    };
    volume: {
      enabled: boolean;
      threshold: number;
    };
  };
  diversification?: {
    enabled: boolean;
    maxAllocation: number;
    rebalanceThreshold: number;
    assets: string[];
  };
  notifications: {
    telegram: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface MarketData {
  price: number;
  volume: number;
  high24h: number;
  low24h: number;
  change24h: number;
  marketCap?: number;
  prediction?: {
    price: number;
    confidence: number;
    timeframe: string;
  };
  sentimentScore?: number;
  whaleActivity?: {
    largeTransactions: number;
    netFlow: number;
    exchangeInflow: number;
    exchangeOutflow: number;
  };
  onChainMetrics?: {
    activeAddresses: number;
    transactionCount: number;
    hashRate: number;
    difficulty: number;
    mvrv: number;
  };
  indicators?: {
    rsi: number;
    macd: {
      MACD: number;
      signal: number;
      histogram: number;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
    ema: {
      ema12: number;
      ema26: number;
      ema50: number;
      ema200: number;
    };
    support: number;
    resistance: number;
  };
  priceHistory?: Array<{
    timestamp: string;
    price: number;
    volume: number;
  }>;
}

export interface TradingState {
  isTrading: boolean;
  currentStrategy: TradingStrategy | null;
  positions: Trade[];
  balance: number;
  profit: number;
  selectedExchange: string;
  selectedPair: string;
  marketData: MarketData | null;
  subscription: 'FREE' | 'PRO' | 'ELITE';
  loading: boolean;
  error: string | null;
  timeframe: string;
  tradingPairs: string[];
  journal: JournalEntry[];
  alerts: Alert[];
  portfolio: PortfolioAsset[];
  taxReports: TaxReport[];
  defiPositions: DeFiPosition[];
  nftCollection: NFTAsset[];
}

export interface BacktestResult {
  id: number;
  strategyId: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalTrades: number;
  winRate: number;
  performance: number;
  trades: Trade[];
  metrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    profitFactor: number;
    calmarRatio: number;
    sortinoRatio: number;
    volatility: number;
    beta: number;
    alpha: number;
  };
  monthlyReturns: Array<{
    month: string;
    return: number;
  }>;
}

export interface PortfolioAsset {
  asset: string;
  symbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  profitLoss: number;
  profitLossPercent: number;
  allocation: number;
  value: number;
  exchange: string;
  lastUpdated: string;
  roi: number;
  volatilityScore: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscription: 'FREE' | 'PRO' | 'ELITE';
  subscriptionExpiry?: string;
  apiKeys: {
    exchange: string;
    key: string;
    secret: string;
    permissions: string[];
  }[];
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  referralCode: string;
  referralCount: number;
  preferences: {
    language: 'en' | 'hi';
    currency: 'USD' | 'INR';
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      telegram: boolean;
      push: boolean;
    };
  };
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  taxSettings: {
    country: string;
    taxYear: string;
    fifoMethod: boolean;
  };
}

export interface Alert {
  id: string;
  type: 'PRICE' | 'VOLUME' | 'WHALE' | 'NEWS' | 'PORTFOLIO' | 'PANIC';
  title: string;
  message: string;
  asset: string;
  condition: string;
  value: number;
  triggered: boolean;
  timestamp: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface JournalEntry {
  id: string;
  type: 'ENTRY' | 'EXIT' | 'NOTE' | 'ANALYSIS';
  content: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  tags: string[];
  timestamp: string;
  tradeId?: string;
  attachments?: string[];
}

export interface TaxReport {
  id: string;
  year: string;
  totalGains: number;
  totalLosses: number;
  netGains: number;
  shortTermGains: number;
  longTermGains: number;
  transactions: Array<{
    date: string;
    type: 'BUY' | 'SELL';
    asset: string;
    amount: number;
    price: number;
    gainLoss: number;
    holdingPeriod: number;
  }>;
  generatedAt: string;
}

export interface DeFiPosition {
  id: string;
  protocol: string;
  type: 'LENDING' | 'STAKING' | 'YIELD_FARMING' | 'LIQUIDITY_POOL';
  asset: string;
  amount: number;
  apy: number;
  value: number;
  rewards: number;
  startDate: string;
  network: string;
}

export interface NFTAsset {
  id: string;
  name: string;
  collection: string;
  tokenId: string;
  network: string;
  currentValue: number;
  purchasePrice: number;
  profitLoss: number;
  imageUrl: string;
  lastUpdated: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
  url: string;
  tags: string[];
}

export interface EducationContent {
  id: string;
  title: string;
  type: 'ARTICLE' | 'VIDEO' | 'WEBINAR' | 'COURSE';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: 'en' | 'hi';
  content: string;
  duration?: number;
  videoUrl?: string;
  tags: string[];
  createdAt: string;
}