const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const TradingService = require('../services/TradingService');
const logger = require('../utils/logger');

const router = express.Router();
const tradingService = new TradingService();

// Get portfolio overview
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const portfolio = await db('portfolio')
      .where({ user_id: userId })
      .orderBy('total_value', 'desc');

    // Calculate portfolio metrics
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
    const totalProfitLoss = portfolio.reduce((sum, asset) => sum + parseFloat(asset.profit_loss || 0), 0);
    const totalProfitLossPercent = totalValue > 0 ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100 : 0;

    // Get recent trades for performance calculation
    const recentTrades = await db('trades')
      .where({ user_id: userId })
      .where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .orderBy('created_at', 'desc');

    const metrics = {
      totalValue,
      totalProfitLoss,
      totalProfitLossPercent,
      totalAssets: portfolio.length,
      recentTrades: recentTrades.length,
      winRate: calculateWinRate(recentTrades),
      bestPerformer: portfolio.reduce((best, current) => 
        parseFloat(current.profit_loss_percent || 0) > parseFloat(best.profit_loss_percent || 0) ? current : best, 
        portfolio[0] || {}
      ),
      worstPerformer: portfolio.reduce((worst, current) => 
        parseFloat(current.profit_loss_percent || 0) < parseFloat(worst.profit_loss_percent || 0) ? current : worst, 
        portfolio[0] || {}
      )
    };

    res.json({
      success: true,
      data: {
        portfolio,
        metrics
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

// Rebalance portfolio
router.post('/rebalance', [
  body('allocations').isArray(),
  body('allocations.*.symbol').notEmpty(),
  body('allocations.*.targetPercent').isFloat({ min: 0, max: 100 })
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
    const { allocations } = req.body;

    // Validate total allocation equals 100%
    const totalAllocation = allocations.reduce((sum, alloc) => sum + alloc.targetPercent, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total allocation must equal 100%'
      });
    }

    const rebalanceResult = await tradingService.rebalancePortfolio(userId, allocations);

    res.json({
      success: true,
      message: 'Portfolio rebalanced successfully',
      data: rebalanceResult
    });
  } catch (error) {
    logger.error('Rebalance portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rebalance portfolio'
    });
  }
});

// Get portfolio performance
router.get('/performance', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = '30d' } = req.query;

    const performance = await tradingService.getPortfolioPerformance(userId, period);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Get portfolio performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio performance'
    });
  }
});

// Export portfolio data
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { format = 'csv' } = req.query;

    const portfolio = await db('portfolio').where({ user_id: userId });
    const trades = await db('trades').where({ user_id: userId }).orderBy('created_at', 'desc');

    if (format === 'csv') {
      const csv = generateCSV({ portfolio, trades });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="portfolio-export.csv"');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: { portfolio, trades }
      });
    }
  } catch (error) {
    logger.error('Export portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export portfolio data'
    });
  }
});

// Get asset allocation
router.get('/allocation', async (req, res) => {
  try {
    const userId = req.user.userId;

    const portfolio = await db('portfolio').where({ user_id: userId });
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);

    const allocation = portfolio.map(asset => ({
      symbol: asset.symbol,
      value: parseFloat(asset.total_value),
      percentage: totalValue > 0 ? (parseFloat(asset.total_value) / totalValue) * 100 : 0,
      amount: parseFloat(asset.amount),
      profitLoss: parseFloat(asset.profit_loss || 0),
      profitLossPercent: parseFloat(asset.profit_loss_percent || 0)
    }));

    res.json({
      success: true,
      data: {
        allocation,
        totalValue,
        diversificationScore: calculateDiversificationScore(allocation)
      }
    });
  } catch (error) {
    logger.error('Get asset allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset allocation'
    });
  }
});

// Helper functions
function calculateWinRate(trades) {
  if (trades.length === 0) return 0;
  
  const profitableTrades = trades.filter(trade => {
    // Simple profit calculation - this would be more complex in reality
    return trade.type === 'SELL' && parseFloat(trade.price) > parseFloat(trade.avg_buy_price || trade.price);
  });
  
  return (profitableTrades.length / trades.length) * 100;
}

function generateCSV(data) {
  const { portfolio, trades } = data;
  
  let csv = 'Type,Symbol,Amount,Price,Value,Profit/Loss,Date\n';
  
  // Add portfolio data
  portfolio.forEach(asset => {
    csv += `Portfolio,${asset.symbol},${asset.amount},${asset.current_price},${asset.total_value},${asset.profit_loss},${asset.updated_at}\n`;
  });
  
  // Add trades data
  trades.forEach(trade => {
    csv += `Trade,${trade.symbol},${trade.amount},${trade.price},${trade.total},${trade.profit_loss || 0},${trade.created_at}\n`;
  });
  
  return csv;
}

function calculateDiversificationScore(allocation) {
  if (allocation.length === 0) return 0;
  
  // Simple diversification score based on how evenly distributed the portfolio is
  const idealPercentage = 100 / allocation.length;
  const variance = allocation.reduce((sum, asset) => {
    return sum + Math.pow(asset.percentage - idealPercentage, 2);
  }, 0) / allocation.length;
  
  // Convert to a score from 0-10 (10 being perfectly diversified)
  const maxVariance = Math.pow(100 - idealPercentage, 2);
  return Math.max(0, 10 - (variance / maxVariance) * 10);
}

module.exports = router;