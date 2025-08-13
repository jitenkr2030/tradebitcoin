import express from 'express';
import cors from 'cors';
import ccxt from 'ccxt';
import Database from '@better-sqlite3/better-sqlite3';
import { WebSocket, WebSocketServer } from 'ws';
import * as tf from '@tensorflow/tfjs';
import { RSI, MACD, BollingerBands } from 'technicalindicators';
import natural from 'natural';
import sentiment from 'node-sentiment';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const app = express();
const db = new Database('trading.db');
const port = 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Enhanced database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    price REAL NOT NULL,
    amount REAL NOT NULL,
    exchange TEXT NOT NULL,
    strategy_id TEXT NOT NULL,
    order_type TEXT NOT NULL,
    leverage REAL,
    margin REAL,
    indicators JSON,
    sentiment_score REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL,
    amount REAL NOT NULL,
    avg_price REAL NOT NULL,
    current_price REAL NOT NULL,
    profit_loss REAL,
    allocation REAL NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    subscription TEXT DEFAULT 'FREE',
    api_keys JSON,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    referral_code TEXT UNIQUE,
    referral_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS backtests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_id TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    initial_balance REAL NOT NULL,
    final_balance REAL NOT NULL,
    total_trades INTEGER NOT NULL,
    win_rate REAL NOT NULL,
    sharpe_ratio REAL,
    max_drawdown REAL,
    profit_factor REAL,
    settings JSON,
    results JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Initialize sentiment analyzer
const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();

// Enhanced exchanges setup with API key management
const exchanges = {
  binance: new ccxt.binance({ 'enableRateLimit': true }),
  coinbase: new ccxt.coinbase({ 'enableRateLimit': true }),
  kraken: new ccxt.kraken({ 'enableRateLimit': true }),
  bitfinex: new ccxt.bitfinex({ 'enableRateLimit': true })
};

// WebSocket server for real-time updates
const wss = new WebSocketServer({ port: 8080 });

// AI Models
let priceModel;
let sentimentModel;

async function initializeModels() {
  // Price prediction model
  priceModel = tf.sequential();
  priceModel.add(tf.layers.lstm({
    units: 100,
    returnSequences: true,
    inputShape: [30, 8] // Extended features
  }));
  priceModel.add(tf.layers.dropout(0.2));
  priceModel.add(tf.layers.lstm({
    units: 50,
    returnSequences: false
  }));
  priceModel.add(tf.layers.dense({ units: 1 }));
  priceModel.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });

  // Sentiment analysis model
  sentimentModel = tf.sequential();
  sentimentModel.add(tf.layers.embedding({
    inputDim: 10000,
    outputDim: 32,
    inputLength: 100
  }));
  sentimentModel.add(tf.layers.lstm({ units: 64 }));
  sentimentModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  sentimentModel.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
}

initializeModels();

// Enhanced Technical Analysis
function calculateIndicators(prices, volume) {
  const rsiValues = RSI.calculate({
    values: prices,
    period: 14
  });

  const macdValues = MACD.calculate({
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  });

  const bb = BollingerBands.calculate({
    values: prices,
    period: 20,
    stdDev: 2
  });

  return {
    rsi: rsiValues[rsiValues.length - 1],
    macd: macdValues[macdValues.length - 1],
    bollingerBands: bb[bb.length - 1]
  };
}

// Middleware
app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Enhanced WebSocket handlers
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'SUBSCRIBE_PRICE':
        const interval = setInterval(async () => {
          try {
            const prices = await Promise.all(
              Object.values(exchanges).map(ex => ex.fetchTicker('BTC/USDT'))
            );
            
            const avgPrice = prices.reduce((acc, p) => acc + p.last, 0) / prices.length;
            const sentimentScore = await analyzeSentiment();
            
            ws.send(JSON.stringify({
              type: 'PRICE_UPDATE',
              data: {
                price: avgPrice,
                sentiment: sentimentScore,
                timestamp: new Date().toISOString()
              }
            }));
          } catch (error) {
            console.error('Error fetching prices:', error);
          }
        }, 1000);
        
        ws.on('close', () => clearInterval(interval));
        break;
        
      case 'ANALYZE_MARKET':
        try {
          const { exchange, timeframe, orderType } = data;
          const ohlcv = await exchanges[exchange].fetchOHLCV('BTC/USDT', timeframe);
          const prices = ohlcv.map(candle => candle[4]);
          const volume = ohlcv.map(candle => candle[5]);
          
          const indicators = calculateIndicators(prices, volume);
          const prediction = await predictPrice(prices);
          const sentiment = await analyzeSentiment();
          
          ws.send(JSON.stringify({
            type: 'ANALYSIS_RESULT',
            data: { indicators, prediction, sentiment }
          }));
        } catch (error) {
          console.error('Error analyzing market:', error);
        }
        break;
    }
  });
});

// Enhanced API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Implementation for user registration
    res.json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Implementation for user login
    res.json({ token: 'jwt_token' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscription/upgrade', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    // Implementation for subscription upgrade
    res.json({ message: 'Subscription upgraded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/price', authenticateToken, async (req, res) => {
  try {
    const { exchange = 'binance' } = req.query;
    const ticker = await exchanges[exchange].fetchTicker('BTC/USDT');
    res.json({ price: ticker.last });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trade', authenticateToken, async (req, res) => {
  const {
    type,
    price,
    amount,
    exchange = 'binance',
    strategyId,
    orderType,
    leverage,
    margin
  } = req.body;
  
  try {
    const ticker = await exchanges[exchange].fetchTicker('BTC/USDT');
    const ohlcv = await exchanges[exchange].fetchOHLCV('BTC/USDT', '1h', undefined, 100);
    const prices = ohlcv.map(candle => candle[4]);
    const indicators = calculateIndicators(prices, ohlcv.map(candle => candle[5]));
    const sentimentScore = await analyzeSentiment();
    
    const stmt = db.prepare(`
      INSERT INTO trades (
        type, price, amount, exchange, strategy_id, order_type,
        leverage, margin, indicators, sentiment_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      type,
      price,
      amount,
      exchange,
      strategyId,
      orderType,
      leverage,
      margin,
      JSON.stringify(indicators),
      sentimentScore
    );
    
    await updatePortfolio('BTC', amount, price, ticker.last);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'TRADE_EXECUTED',
          data: {
            id: result.lastInsertRowid,
            type,
            price,
            amount,
            exchange,
            orderType,
            leverage,
            margin,
            indicators,
            sentimentScore
          }
        }));
      }
    });
    
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolio', authenticateToken, (req, res) => {
  try {
    const portfolio = db.prepare('SELECT * FROM portfolio').all();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio/rebalance', authenticateToken, async (req, res) => {
  try {
    const { allocations } = req.body;
    // Implementation for portfolio rebalancing
    res.json({ message: 'Portfolio rebalanced' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backtest', authenticateToken, async (req, res) => {
  const { strategyId, startDate, endDate, initialBalance, settings } = req.body;
  
  try {
    const results = await runBacktest(strategyId, startDate, endDate, initialBalance, settings);
    
    const stmt = db.prepare(`
      INSERT INTO backtests (
        strategy_id, start_date, end_date, initial_balance, final_balance,
        total_trades, win_rate, sharpe_ratio, max_drawdown, profit_factor,
        settings, results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      strategyId,
      startDate,
      endDate,
      initialBalance,
      results.finalBalance,
      results.totalTrades,
      results.winRate,
      results.metrics.sharpeRatio,
      results.metrics.maxDrawdown,
      results.metrics.profitFactor,
      JSON.stringify(settings),
      JSON.stringify(results)
    );
    
    res.json({ id: result.lastInsertRowid, ...results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function updatePortfolio(asset, amount, avgPrice, currentPrice) {
  const stmt = db.prepare(`
    INSERT INTO portfolio (
      asset, amount, avg_price, current_price, profit_loss, allocation
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(asset) DO UPDATE SET
      amount = amount + ?,
      avg_price = (avg_price * amount + ? * ?) / (amount + ?),
      current_price = ?,
      profit_loss = ((? - avg_price) / avg_price) * 100,
      allocation = ?
  `);
  
  const totalPortfolioValue = calculateTotalPortfolioValue();
  const allocation = (amount * currentPrice) / totalPortfolioValue * 100;
  const profitLoss = ((currentPrice - avgPrice) / avgPrice) * 100;
  
  stmt.run(
    asset, amount, avgPrice, currentPrice, profitLoss, allocation,
    amount, avgPrice, amount, amount, currentPrice, currentPrice, allocation
  );
}

async function predictPrice(prices) {
  const features = await extractFeatures(prices);
  const tensorData = tf.tensor2d(features, [features.length, 8]);
  const normalizedData = tensorData.sub(tensorData.min())
    .div(tensorData.max().sub(tensorData.min()));
  
  const prediction = priceModel.predict(normalizedData.expandDims(0));
  return prediction.dataSync()[0];
}

async function analyzeSentiment() {
  // Fetch recent news and social media data
  const newsData = await fetchNewsData();
  const socialData = await fetchSocialData();
  
  const combinedText = [...newsData, ...socialData].join(' ');
  const tokens = tokenizer.tokenize(combinedText);
  
  return sentiment(combinedText);
}

async function runBacktest(strategyId, startDate, endDate, initialBalance, settings) {
  const history = await exchanges.binance.fetchOHLCV(
    'BTC/USDT',
    '1h',
    new Date(startDate).getTime(),
    new Date(endDate).getTime()
  );
  
  let balance = initialBalance;
  let position = null;
  const trades = [];
  let maxDrawdown = 0;
  let peakBalance = initialBalance;
  
  for (let i = 30; i < history.length; i++) {
    const prices = history.slice(i - 30, i).map(candle => candle[4]);
    const indicators = calculateIndicators(prices, history.slice(i - 30, i).map(candle => candle[5]));
    const prediction = await predictPrice(prices);
    const sentiment = await analyzeSentiment();
    
    const currentPrice = history[i][4];
    
    if (!position && shouldEnterTrade(prediction, indicators, sentiment, settings)) {
      position = {
        type: 'BUY',
        price: currentPrice,
        amount: balance / currentPrice
      };
      balance = 0;
      trades.push({ ...position, timestamp: new Date(history[i][0]).toISOString() });
    } else if (position && shouldExitTrade(prediction, indicators, sentiment, settings)) {
      const profit = (currentPrice - position.price) * position.amount;
      balance = position.amount * currentPrice;
      
      if (balance > peakBalance) {
        peakBalance = balance;
      }
      
      const drawdown = (peakBalance - balance) / peakBalance;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
      
      trades.push({
        type: 'SELL',
        price: currentPrice,
        amount: position.amount,
        profit,
        timestamp: new Date(history[i][0]).toISOString()
      });
      position = null;
    }
  }
  
  const finalBalance = position ? position.amount * history[history.length - 1][4] : balance;
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.type === 'SELL' && t.profit > 0).length;
  const winRate = (winningTrades / (totalTrades / 2)) * 100;
  
  const returns = trades
    .filter(t => t.type === 'SELL')
    .map(t => t.profit / t.price);
  
  const sharpeRatio = calculateSharpeRatio(returns);
  const profitFactor = calculateProfitFactor(trades);
  
  return {
    finalBalance,
    totalTrades,
    winRate,
    trades,
    performance: ((finalBalance - initialBalance) / initialBalance) * 100,
    metrics: {
      sharpeRatio,
      maxDrawdown,
      profitFactor
    }
  };
}

function calculateSharpeRatio(returns) {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return mean / stdDev * Math.sqrt(252); // Annualized Sharpe Ratio
}

function calculateProfitFactor(trades) {
  const profits = trades
    .filter(t => t.type === 'SELL' && t.profit > 0)
    .reduce((sum, t) => sum + t.profit, 0);
  
  const losses = Math.abs(trades
    .filter(t => t.type === 'SELL' && t.profit < 0)
    .reduce((sum, t) => sum + t.profit, 0));
  
  return profits / (losses || 1);
}

function calculateTotalPortfolioValue() {
  const portfolio = db.prepare('SELECT amount, current_price FROM portfolio').all();
  return portfolio.reduce((total, asset) => total + asset.amount * asset.current_price, 0);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});