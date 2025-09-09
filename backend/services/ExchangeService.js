const ccxt = require('ccxt');
const logger = require('../utils/logger');

class ExchangeService {
  constructor() {
    this.exchanges = new Map();
    this.supportedExchanges = [
      'binance', 'coinbase', 'kraken', 'bitfinex', 'huobi', 'okx',
      'kucoin', 'bybit', 'gate', 'mexc', 'bitget', 'coindcx', 'wazirx'
    ];
    this.initializeExchanges();
  }

  async initializeExchanges() {
    try {
      for (const exchangeName of this.supportedExchanges) {
        try {
          const exchangeClass = ccxt[exchangeName];
          if (exchangeClass) {
            const exchange = new exchangeClass({
              apiKey: process.env[`${exchangeName.toUpperCase()}_API_KEY`],
              secret: process.env[`${exchangeName.toUpperCase()}_SECRET`],
              sandbox: process.env.NODE_ENV !== 'production',
              enableRateLimit: true,
              timeout: 30000,
              options: {
                adjustForTimeDifference: true,
                recvWindow: 10000
              }
            });

            // Test connection
            if (exchange.apiKey) {
              await exchange.loadMarkets();
              this.exchanges.set(exchangeName, exchange);
              logger.info(`${exchangeName} exchange initialized successfully`);
            } else {
              // Create demo exchange for development
              this.exchanges.set(exchangeName, this.createDemoExchange(exchangeName));
              logger.info(`${exchangeName} demo exchange created`);
            }
          }
        } catch (error) {
          logger.warn(`Failed to initialize ${exchangeName}:`, error.message);
          // Create demo exchange as fallback
          this.exchanges.set(exchangeName, this.createDemoExchange(exchangeName));
        }
      }

      logger.info(`Initialized ${this.exchanges.size} exchanges`);
    } catch (error) {
      logger.error('Exchange initialization error:', error);
    }
  }

  createDemoExchange(exchangeName) {
    return {
      id: exchangeName,
      name: exchangeName.charAt(0).toUpperCase() + exchangeName.slice(1),
      countries: ['Global'],
      rateLimit: 1000,
      has: {
        fetchTicker: true,
        fetchOHLCV: true,
        fetchOrderBook: true,
        createOrder: true,
        fetchBalance: true
      },
      
      async fetchTicker(symbol) {
        const basePrice = this.getBasePrice(symbol);
        const change = (Math.random() - 0.5) * 0.1; // ±5% change
        
        return {
          symbol,
          last: basePrice * (1 + change),
          bid: basePrice * (1 + change - 0.001),
          ask: basePrice * (1 + change + 0.001),
          high: basePrice * (1 + Math.abs(change) + 0.02),
          low: basePrice * (1 + change - 0.02),
          open: basePrice,
          close: basePrice * (1 + change),
          baseVolume: Math.random() * 1000000,
          quoteVolume: Math.random() * 50000000000,
          percentage: change * 100,
          change: basePrice * change,
          timestamp: Date.now(),
          datetime: new Date().toISOString()
        };
      },

      async fetchOHLCV(symbol, timeframe = '1h', since, limit = 100) {
        const basePrice = this.getBasePrice(symbol);
        const candles = [];
        const now = Date.now();
        const interval = this.getTimeframeMs(timeframe);

        for (let i = limit - 1; i >= 0; i--) {
          const timestamp = now - (i * interval);
          const volatility = 0.02; // 2% volatility
          const change = (Math.random() - 0.5) * volatility;
          
          const open = basePrice * (1 + change);
          const close = open * (1 + (Math.random() - 0.5) * volatility);
          const high = Math.max(open, close) * (1 + Math.random() * volatility / 2);
          const low = Math.min(open, close) * (1 - Math.random() * volatility / 2);
          const volume = Math.random() * 100;

          candles.push([timestamp, open, high, low, close, volume]);
        }

        return candles;
      },

      async fetchOrderBook(symbol, limit = 20) {
        const ticker = await this.fetchTicker(symbol);
        const spread = ticker.ask - ticker.bid;
        
        const bids = [];
        const asks = [];
        
        for (let i = 0; i < limit; i++) {
          const bidPrice = ticker.bid - (i * spread / limit);
          const askPrice = ticker.ask + (i * spread / limit);
          const amount = Math.random() * 10;
          
          bids.push([bidPrice, amount]);
          asks.push([askPrice, amount]);
        }
        
        return { bids, asks, timestamp: Date.now() };
      },

      async createOrder(symbol, type, side, amount, price, params = {}) {
        const ticker = await this.fetchTicker(symbol);
        const executionPrice = price || ticker.last;
        
        return {
          id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol,
          type,
          side,
          amount,
          price: executionPrice,
          cost: amount * executionPrice,
          filled: amount,
          remaining: 0,
          status: 'closed',
          timestamp: Date.now(),
          datetime: new Date().toISOString(),
          fee: {
            cost: amount * executionPrice * 0.001,
            currency: symbol.split('/')[1]
          },
          trades: [],
          info: {}
        };
      },

      async fetchBalance() {
        return {
          free: { BTC: 1.5, ETH: 10.2, USDT: 50000 },
          used: { BTC: 0.1, ETH: 0.5, USDT: 1000 },
          total: { BTC: 1.6, ETH: 10.7, USDT: 51000 }
        };
      },

      getBasePrice(symbol) {
        const prices = {
          'BTC/USDT': 67500,
          'ETH/USDT': 3200,
          'BNB/USDT': 540,
          'ADA/USDT': 0.45,
          'DOT/USDT': 6.8,
          'LINK/USDT': 14.5,
          'XRP/USDT': 0.52,
          'LTC/USDT': 95,
          'BCH/USDT': 485,
          'EOS/USDT': 0.85
        };
        return prices[symbol] || 100;
      },

      getTimeframeMs(timeframe) {
        const timeframes = {
          '1m': 60 * 1000,
          '5m': 5 * 60 * 1000,
          '15m': 15 * 60 * 1000,
          '30m': 30 * 60 * 1000,
          '1h': 60 * 60 * 1000,
          '4h': 4 * 60 * 60 * 1000,
          '1d': 24 * 60 * 60 * 1000
        };
        return timeframes[timeframe] || timeframes['1h'];
      }
    };
  }

  getExchange(exchangeName) {
    return this.exchanges.get(exchangeName);
  }

  async getExchangeInfo(exchangeName) {
    const exchange = this.getExchange(exchangeName);
    if (!exchange) return null;

    return {
      id: exchange.id,
      name: exchange.name || exchangeName,
      countries: exchange.countries || ['Global'],
      rateLimit: exchange.rateLimit || 1000,
      has: exchange.has || {},
      fees: exchange.fees || {},
      markets: Object.keys(exchange.markets || {}),
      status: 'active'
    };
  }

  async getAllExchangeInfo() {
    const exchangeInfo = [];
    
    for (const [name, exchange] of this.exchanges) {
      const info = await this.getExchangeInfo(name);
      if (info) {
        exchangeInfo.push(info);
      }
    }
    
    return exchangeInfo;
  }

  async getAggregatedPrice(symbol) {
    const prices = [];
    
    for (const [exchangeName, exchange] of this.exchanges) {
      try {
        const ticker = await exchange.fetchTicker(symbol);
        prices.push({
          exchange: exchangeName,
          price: ticker.last,
          volume: ticker.baseVolume,
          bid: ticker.bid,
          ask: ticker.ask,
          spread: ticker.ask - ticker.bid
        });
      } catch (error) {
        logger.warn(`Failed to fetch ${symbol} from ${exchangeName}:`, error.message);
      }
    }

    if (prices.length === 0) return null;

    // Calculate volume-weighted average price
    const totalVolume = prices.reduce((sum, p) => sum + (p.volume || 0), 0);
    const vwap = totalVolume > 0 
      ? prices.reduce((sum, p) => sum + (p.price * (p.volume || 0)), 0) / totalVolume
      : prices.reduce((sum, p) => sum + p.price, 0) / prices.length;

    return {
      symbol,
      averagePrice: vwap,
      bestBid: Math.max(...prices.map(p => p.bid)),
      bestAsk: Math.min(...prices.map(p => p.ask)),
      totalVolume,
      exchanges: prices,
      arbitrageOpportunities: this.findArbitrageOpportunities(prices)
    };
  }

  findArbitrageOpportunities(prices) {
    const opportunities = [];
    
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const price1 = prices[i];
        const price2 = prices[j];
        
        const spread = Math.abs(price1.price - price2.price);
        const spreadPercent = (spread / Math.min(price1.price, price2.price)) * 100;
        
        if (spreadPercent > 0.5) { // Minimum 0.5% spread for arbitrage
          opportunities.push({
            buyExchange: price1.price < price2.price ? price1.exchange : price2.exchange,
            sellExchange: price1.price < price2.price ? price2.exchange : price1.exchange,
            buyPrice: Math.min(price1.price, price2.price),
            sellPrice: Math.max(price1.price, price2.price),
            spread: spreadPercent,
            profit: spread
          });
        }
      }
    }
    
    return opportunities.sort((a, b) => b.spread - a.spread);
  }
}

module.exports = ExchangeService;