const express = require('express');
const ExchangeService = require('../services/ExchangeService');
const logger = require('../utils/logger');

const router = express.Router();
const exchangeService = new ExchangeService();

// Get all supported exchanges
router.get('/', async (req, res) => {
  try {
    const exchanges = await exchangeService.getAllExchangeInfo();
    
    res.json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    logger.error('Get exchanges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchanges'
    });
  }
});

// Get exchange-specific info
router.get('/:exchangeName', async (req, res) => {
  try {
    const { exchangeName } = req.params;
    const exchangeInfo = await exchangeService.getExchangeInfo(exchangeName);
    
    if (!exchangeInfo) {
      return res.status(404).json({
        success: false,
        message: 'Exchange not found'
      });
    }

    res.json({
      success: true,
      data: exchangeInfo
    });
  } catch (error) {
    logger.error('Get exchange info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange info'
    });
  }
});

// Get aggregated price across exchanges
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const aggregatedPrice = await exchangeService.getAggregatedPrice(symbol);
    
    if (!aggregatedPrice) {
      return res.status(404).json({
        success: false,
        message: 'Price data not available'
      });
    }

    res.json({
      success: true,
      data: aggregatedPrice
    });
  } catch (error) {
    logger.error('Get aggregated price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price data'
    });
  }
});

// Get arbitrage opportunities
router.get('/arbitrage/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { minSpread = 0.5 } = req.query;
    
    const aggregatedData = await exchangeService.getAggregatedPrice(symbol);
    
    if (!aggregatedData || !aggregatedData.arbitrageOpportunities) {
      return res.json({
        success: true,
        data: []
      });
    }

    const opportunities = aggregatedData.arbitrageOpportunities
      .filter(opp => opp.spread >= parseFloat(minSpread))
      .slice(0, 10); // Top 10 opportunities

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    logger.error('Get arbitrage opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch arbitrage opportunities'
    });
  }
});

module.exports = router;