const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const TradingService = require('../services/TradingService');
const logger = require('../utils/logger');

const router = express.Router();
const tradingService = new TradingService();

// Get current market price
router.get('/price', async (req, res) => {
  try {
    const { symbol = 'BTC/USDT', exchange = 'binance' } = req.query;
    const priceData = await tradingService.getCurrentPrice(symbol, exchange);
    
    res.json({
      success: true,
      data: priceData
    });
  } catch (error) {
    logger.error('Get price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price data'
    });
  }
});

// Get market data with technical indicators
router.get('/market-data', async (req, res) => {
  try {
    const { symbol = 'BTC/USDT', timeframe = '1h', exchange = 'binance' } = req.query;
    
    const ohlcv = await tradingService.getOHLCV(symbol, timeframe, 100, exchange);
    const prices = ohlcv.map(candle => candle.close);
    const volume = ohlcv.map(candle => candle.volume);
    
    const indicators = tradingService.calculateTechnicalIndicators(prices, volume);
    const prediction = await tradingService.predictPrice(prices);
    
    res.json({
      success: true,
      data: {
        symbol,
        currentPrice: prices[prices.length - 1],
        priceHistory: ohlcv.slice(-50), // Last 50 candles
        indicators,
        prediction,
        volume: volume[volume.length - 1],
        high24h: Math.max(...prices.slice(-24)),
        low24h: Math.min(...prices.slice(-24)),
        change24h: ((prices[prices.length - 1] - prices[prices.length - 25]) / prices[prices.length - 25]) * 100
      }
    });
  } catch (error) {
    logger.error('Get market data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market data'
    });
  }
});

// Execute trade
router.post('/execute', [
  body('type').isIn(['BUY', 'SELL']),
  body('symbol').notEmpty(),
  body('amount').isFloat({ min: 0.0001 }),
  body('exchange').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const tradeData = {
      ...req.body,
      strategyId: req.body.strategyId || 'manual'
    };

    const trade = await tradingService.executeTrade(userId, tradeData);

    res.json({
      success: true,
      message: 'Trade executed successfully',
      data: trade
    });
  } catch (error) {
    logger.error('Execute trade error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute trade'
    });
  }
});

// Get trade history
router.get('/trades', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 50, symbol, exchange } = req.query;
    
    let query = db('trades').where({ user_id: userId });
    
    if (symbol) query = query.where({ symbol });
    if (exchange) query = query.where({ exchange });
    
    const trades = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const total = await db('trades').where({ user_id: userId }).count('* as count');

    res.json({
      success: true,
      data: {
        trades,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total[0].count),
          pages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get trades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trades'
    });
  }
});

// Get portfolio
router.get('/portfolio', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const portfolio = await db('portfolio')
      .where({ user_id: userId })
      .orderBy('total_value', 'desc');

    // Calculate total portfolio value
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
    
    // Update current prices and recalculate
    for (let asset of portfolio) {
      try {
        const priceData = await tradingService.getCurrentPrice(asset.symbol, asset.exchange);
        const currentPrice = priceData.price;
        const newValue = parseFloat(asset.amount) * currentPrice;
        const profitLoss = newValue - (parseFloat(asset.amount) * parseFloat(asset.avg_price));
        const profitLossPercent = (profitLoss / (parseFloat(asset.amount) * parseFloat(asset.avg_price))) * 100;

        await db('portfolio')
          .where({ id: asset.id })
          .update({
            current_price: currentPrice,
            total_value: newValue,
            profit_loss: profitLoss,
            profit_loss_percent: profitLossPercent,
            allocation_percent: (newValue / totalValue) * 100
          });

        asset.current_price = currentPrice;
        asset.total_value = newValue;
        asset.profit_loss = profitLoss;
        asset.profit_loss_percent = profitLossPercent;
        asset.allocation_percent = (newValue / totalValue) * 100;
      } catch (error) {
        logger.error(`Error updating price for ${asset.symbol}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        portfolio,
        summary: {
          totalValue,
          totalProfitLoss: portfolio.reduce((sum, asset) => sum + parseFloat(asset.profit_loss || 0), 0),
          totalAssets: portfolio.length
        }
      }
    });
  } catch (error) {
    logger.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio'
    });
  }
});

// Create trading strategy
router.post('/strategy', [
  body('name').notEmpty(),
  body('type').isIn(['SCALPING', 'SWING', 'TREND_FOLLOWING', 'ARBITRAGE', 'DCA']),
  body('stopLoss').isFloat({ min: 0.1, max: 50 }),
  body('takeProfit').isFloat({ min: 0.1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const strategyData = {
      user_id: userId,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      stop_loss: req.body.stopLoss,
      take_profit: req.body.takeProfit,
      trailing_stop: req.body.trailingStop || false,
      trailing_stop_distance: req.body.trailingStopDistance,
      entry_threshold: req.body.entryThreshold,
      exit_threshold: req.body.exitThreshold,
      order_type: req.body.orderType || 'SPOT',
      leverage: req.body.leverage,
      risk_level: req.body.riskLevel || 'MEDIUM',
      max_drawdown: req.body.maxDrawdown,
      indicators: JSON.stringify(req.body.indicators || {}),
      diversification: JSON.stringify(req.body.diversification || {}),
      notifications: JSON.stringify(req.body.notifications || {})
    };

    const [strategy] = await db('trading_strategies').insert(strategyData).returning('*');

    res.json({
      success: true,
      message: 'Trading strategy created successfully',
      data: strategy
    });
  } catch (error) {
    logger.error('Create strategy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trading strategy'
    });
  }
});

// Get user strategies
router.get('/strategies', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const strategies = await db('trading_strategies')
      .where({ user_id: userId, is_active: true })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    logger.error('Get strategies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch strategies'
    });
  }
});

// Run backtest
router.post('/backtest', [
  body('strategyId').isUUID(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('initialBalance').isFloat({ min: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { strategyId, startDate, endDate, initialBalance } = req.body;

    const results = await tradingService.runBacktest(
      userId,
      strategyId,
      startDate,
      endDate,
      initialBalance
    );

    res.json({
      success: true,
      message: 'Backtest completed successfully',
      data: results
    });
  } catch (error) {
    logger.error('Backtest error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run backtest'
    });
  }
});

// Get backtest results
router.get('/backtests', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const backtests = await db('backtests')
      .select('backtests.*', 'trading_strategies.name as strategy_name')
      .leftJoin('trading_strategies', 'backtests.strategy_id', 'trading_strategies.id')
      .where('backtests.user_id', userId)
      .orderBy('backtests.created_at', 'desc');

    res.json({
      success: true,
      data: backtests
    });
  } catch (error) {
    logger.error('Get backtests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backtest results'
    });
  }
});

module.exports = router;