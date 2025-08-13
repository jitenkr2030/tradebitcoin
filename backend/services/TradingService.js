const ccxt = require('ccxt');
const tf = require('@tensorflow/tfjs-node');
const { RSI, MACD, BollingerBands } = require('technicalindicators');

const db = require('../config/database');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/encryption');

class TradingService {
  constructor() {
    this.exchanges = {};
    this.models = {};
    this.initializeExchanges();
    this.initializeModels();
  }

  async initializeExchanges() {
    // Initialize demo exchanges
    this.exchanges = {
      binance: new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET_KEY,
        sandbox: process.env.NODE_ENV !== 'production',
        enableRateLimit: true,
      }),
      coinbase: new ccxt.coinbase({
        apiKey: process.env.COINBASE_API_KEY,
        secret: process.env.COINBASE_SECRET,
        sandbox: process.env.NODE_ENV !== 'production',
        enableRateLimit: true,
      }),
      kraken: new ccxt.kraken({
        apiKey: process.env.KRAKEN_API_KEY,
        secret: process.env.KRAKEN_SECRET,
        sandbox: process.env.NODE_ENV !== 'production',
        enableRateLimit: true,
      })
    };

    logger.info('Trading exchanges initialized');
  }

  async initializeModels() {
    try {
      // Price prediction model
      this.models.pricePredictor = tf.sequential({
        layers: [
          tf.layers.lstm({
            units: 100,
            returnSequences: true,
            inputShape: [30, 8]
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.lstm({
            units: 50,
            returnSequences: false
          }),
          tf.layers.dense({ units: 1 })
        ]
      });

      this.models.pricePredictor.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError'
      });

      logger.info('AI models initialized');
    } catch (error) {
      logger.error('Model initialization error:', error);
    }
  }

  async getUserExchange(userId, exchangeName) {
    const user = await db('users').where({ id: userId }).first();
    if (!user || !user.api_keys[exchangeName]) {
      throw new Error('Exchange API keys not configured');
    }

    const apiKeys = decrypt(user.api_keys[exchangeName]);
    
    return new ccxt[exchangeName]({
      apiKey: apiKeys.key,
      secret: apiKeys.secret,
      sandbox: process.env.NODE_ENV !== 'production',
      enableRateLimit: true,
    });
  }

  async getCurrentPrice(symbol = 'BTC/USDT', exchange = 'binance') {
    try {
      const ticker = await this.exchanges[exchange].fetchTicker(symbol);
      return {
        symbol,
        price: ticker.last,
        volume: ticker.baseVolume,
        high24h: ticker.high,
        low24h: ticker.low,
        change24h: ticker.percentage,
        timestamp: ticker.timestamp
      };
    } catch (error) {
      logger.error('Get current price error:', error);
      throw error;
    }
  }

  async getOHLCV(symbol = 'BTC/USDT', timeframe = '1h', limit = 100, exchange = 'binance') {
    try {
      const ohlcv = await this.exchanges[exchange].fetchOHLCV(symbol, timeframe, undefined, limit);
      return ohlcv.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } catch (error) {
      logger.error('Get OHLCV error:', error);
      throw error;
    }
  }

  calculateTechnicalIndicators(prices, volume) {
    try {
      const rsi = RSI.calculate({
        values: prices,
        period: 14
      });

      const macd = MACD.calculate({
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
        rsi: rsi[rsi.length - 1] || 0,
        macd: macd[macd.length - 1] || { MACD: 0, signal: 0, histogram: 0 },
        bollingerBands: bb[bb.length - 1] || { upper: 0, middle: 0, lower: 0 }
      };
    } catch (error) {
      logger.error('Technical indicators calculation error:', error);
      return {
        rsi: 0,
        macd: { MACD: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: 0, middle: 0, lower: 0 }
      };
    }
  }

  async predictPrice(prices) {
    try {
      if (!this.models.pricePredictor || prices.length < 30) {
        return { prediction: prices[prices.length - 1], confidence: 0.5 };
      }

      // Prepare features (simplified)
      const features = prices.slice(-30).map((price, i) => [
        price,
        prices[i + 1] || price, // next price (for training)
        i, // time index
        0, // volume placeholder
        0, // rsi placeholder
        0, // macd placeholder
        0, // bb upper placeholder
        0  // bb lower placeholder
      ]);

      const tensorData = tf.tensor3d([features]);
      const prediction = this.models.pricePredictor.predict(tensorData);
      const predictionValue = await prediction.data();

      tensorData.dispose();
      prediction.dispose();

      return {
        prediction: predictionValue[0],
        confidence: 0.7 // Simplified confidence score
      };
    } catch (error) {
      logger.error('Price prediction error:', error);
      return { prediction: prices[prices.length - 1], confidence: 0.5 };
    }
  }

  async executeTrade(userId, tradeData) {
    try {
      const {
        type,
        symbol,
        amount,
        price,
        exchange,
        strategyId,
        orderType = 'SPOT'
      } = tradeData;

      // Get user's exchange instance
      const userExchange = await this.getUserExchange(userId, exchange);

      // Execute trade on exchange (demo mode)
      let order;
      if (process.env.NODE_ENV === 'production') {
        if (type === 'BUY') {
          order = await userExchange.createMarketBuyOrder(symbol, amount);
        } else {
          order = await userExchange.createMarketSellOrder(symbol, amount);
        }
      } else {
        // Demo trade
        order = {
          id: `demo_${Date.now()}`,
          symbol,
          type: 'market',
          side: type.toLowerCase(),
          amount,
          price: price || await this.getCurrentPrice(symbol, exchange).price,
          status: 'closed',
          filled: amount,
          cost: amount * price,
          fee: { cost: amount * price * 0.001, currency: 'USDT' }
        };
      }

      // Save trade to database
      const [trade] = await db('trades').insert({
        user_id: userId,
        strategy_id: strategyId,
        type,
        symbol,
        price: order.price,
        amount: order.filled,
        total: order.cost,
        fee: order.fee?.cost || 0,
        exchange,
        order_type: orderType,
        external_order_id: order.id,
        status: 'FILLED'
      }).returning('*');

      // Update portfolio
      await this.updatePortfolio(userId, symbol, type, order.filled, order.price, exchange);

      logger.info(`Trade executed: ${type} ${amount} ${symbol} at ${order.price}`);

      return trade;
    } catch (error) {
      logger.error('Execute trade error:', error);
      throw error;
    }
  }

  async updatePortfolio(userId, symbol, type, amount, price, exchange) {
    try {
      const existing = await db('portfolio')
        .where({ user_id: userId, symbol, exchange })
        .first();

      if (existing) {
        if (type === 'BUY') {
          const newAmount = parseFloat(existing.amount) + parseFloat(amount);
          const newAvgPrice = ((parseFloat(existing.amount) * parseFloat(existing.avg_price)) + 
                              (parseFloat(amount) * parseFloat(price))) / newAmount;
          
          await db('portfolio')
            .where({ id: existing.id })
            .update({
              amount: newAmount,
              avg_price: newAvgPrice,
              current_price: price,
              total_value: newAmount * price,
              updated_at: new Date()
            });
        } else {
          const newAmount = Math.max(0, parseFloat(existing.amount) - parseFloat(amount));
          
          await db('portfolio')
            .where({ id: existing.id })
            .update({
              amount: newAmount,
              current_price: price,
              total_value: newAmount * price,
              updated_at: new Date()
            });
        }
      } else if (type === 'BUY') {
        await db('portfolio').insert({
          user_id: userId,
          symbol,
          amount,
          avg_price: price,
          current_price: price,
          total_value: amount * price,
          exchange
        });
      }

      // Calculate profit/loss
      await this.calculatePortfolioPnL(userId);
    } catch (error) {
      logger.error('Update portfolio error:', error);
      throw error;
    }
  }

  async calculatePortfolioPnL(userId) {
    try {
      const positions = await db('portfolio').where({ user_id: userId });
      
      for (const position of positions) {
        const profitLoss = (parseFloat(position.current_price) - parseFloat(position.avg_price)) * parseFloat(position.amount);
        const profitLossPercent = ((parseFloat(position.current_price) - parseFloat(position.avg_price)) / parseFloat(position.avg_price)) * 100;
        
        await db('portfolio')
          .where({ id: position.id })
          .update({
            profit_loss: profitLoss,
            profit_loss_percent: profitLossPercent,
            roi: profitLossPercent
          });
      }
    } catch (error) {
      logger.error('Calculate portfolio PnL error:', error);
    }
  }

  async runBacktest(userId, strategyId, startDate, endDate, initialBalance) {
    try {
      const strategy = await db('trading_strategies')
        .where({ id: strategyId, user_id: userId })
        .first();

      if (!strategy) {
        throw new Error('Strategy not found');
      }

      // Get historical data
      const historicalData = await this.getOHLCV('BTC/USDT', '1h', 1000);
      const filteredData = historicalData.filter(candle => 
        candle.timestamp >= new Date(startDate).getTime() &&
        candle.timestamp <= new Date(endDate).getTime()
      );

      let balance = parseFloat(initialBalance);
      let position = null;
      const trades = [];
      let maxDrawdown = 0;
      let peakBalance = balance;

      for (let i = 30; i < filteredData.length; i++) {
        const prices = filteredData.slice(i - 30, i).map(candle => candle.close);
        const indicators = this.calculateTechnicalIndicators(prices, []);
        const prediction = await this.predictPrice(prices);
        
        const currentPrice = filteredData[i].close;

        // Simple strategy logic
        const shouldBuy = !position && 
          indicators.rsi < 30 && 
          indicators.macd.histogram > 0 &&
          prediction.confidence > 0.6;

        const shouldSell = position && 
          (indicators.rsi > 70 || 
           currentPrice <= position.price * (1 - strategy.stop_loss / 100) ||
           currentPrice >= position.price * (1 + strategy.take_profit / 100));

        if (shouldBuy && balance > 0) {
          const amount = balance / currentPrice;
          position = {
            type: 'BUY',
            price: currentPrice,
            amount,
            timestamp: filteredData[i].timestamp
          };
          balance = 0;
          trades.push({ ...position, action: 'BUY' });
        } else if (shouldSell && position) {
          const profit = (currentPrice - position.price) * position.amount;
          balance = position.amount * currentPrice;
          
          trades.push({
            type: 'SELL',
            price: currentPrice,
            amount: position.amount,
            profit,
            timestamp: filteredData[i].timestamp,
            action: 'SELL'
          });

          if (balance > peakBalance) {
            peakBalance = balance;
          }

          const drawdown = (peakBalance - balance) / peakBalance;
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
          }

          position = null;
        }
      }

      const finalBalance = position ? position.amount * filteredData[filteredData.length - 1].close : balance;
      const totalReturn = ((finalBalance - initialBalance) / initialBalance) * 100;
      const totalTrades = trades.filter(t => t.action === 'SELL').length;
      const winningTrades = trades.filter(t => t.action === 'SELL' && t.profit > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      const results = {
        initialBalance,
        finalBalance,
        totalReturn,
        totalTrades: trades.length,
        winRate,
        maxDrawdown: maxDrawdown * 100,
        trades,
        metrics: {
          sharpeRatio: this.calculateSharpeRatio(trades),
          profitFactor: this.calculateProfitFactor(trades),
          maxDrawdown: maxDrawdown * 100
        }
      };

      // Save backtest results
      await db('backtests').insert({
        user_id: userId,
        strategy_id: strategyId,
        start_date: startDate,
        end_date: endDate,
        initial_balance: initialBalance,
        final_balance: finalBalance,
        total_trades: trades.length,
        win_rate: winRate,
        profit_loss_percent: totalReturn,
        metrics: JSON.stringify(results.metrics),
        results: JSON.stringify(results)
      });

      return results;
    } catch (error) {
      logger.error('Backtest error:', error);
      throw error;
    }
  }

  calculateSharpeRatio(trades) {
    const returns = trades
      .filter(t => t.action === 'SELL' && t.profit)
      .map(t => t.profit);

    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;
  }

  calculateProfitFactor(trades) {
    const profits = trades
      .filter(t => t.action === 'SELL' && t.profit > 0)
      .reduce((sum, t) => sum + t.profit, 0);

    const losses = Math.abs(trades
      .filter(t => t.action === 'SELL' && t.profit < 0)
      .reduce((sum, t) => sum + t.profit, 0));

    return losses > 0 ? profits / losses : profits > 0 ? 999 : 0;
  }
}

module.exports = TradingService;