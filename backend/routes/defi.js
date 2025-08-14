const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const DeFiService = require('../services/DeFiService');
const logger = require('../utils/logger');

const router = express.Router();
const defiService = new DeFiService();

// Get DeFi positions
router.get('/positions', async (req, res) => {
  try {
    const userId = req.user.userId;

    const positions = await db('defi_positions')
      .where({ user_id: userId, is_active: true })
      .orderBy('current_value', 'desc');

    // Update current values
    for (let position of positions) {
      try {
        const updatedData = await defiService.updatePositionValue(position);
        await db('defi_positions')
          .where({ id: position.id })
          .update(updatedData);
        
        Object.assign(position, updatedData);
      } catch (error) {
        logger.error(`Error updating DeFi position ${position.id}:`, error);
      }
    }

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    logger.error('Get DeFi positions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DeFi positions'
    });
  }
});

// Get yield opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const { network, minApy = 0, maxRisk = 'HIGH' } = req.query;

    const opportunities = await defiService.getYieldOpportunities({
      network,
      minApy: parseFloat(minApy),
      maxRisk
    });

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    logger.error('Get yield opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yield opportunities'
    });
  }
});

// Add DeFi position
router.post('/positions', [
  body('protocol').notEmpty(),
  body('type').isIn(['LENDING', 'STAKING', 'YIELD_FARMING', 'LIQUIDITY_POOL']),
  body('symbol').notEmpty(),
  body('amount').isFloat({ min: 0.0001 }),
  body('network').notEmpty()
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
    const positionData = {
      user_id: userId,
      protocol: req.body.protocol,
      type: req.body.type,
      symbol: req.body.symbol,
      amount: req.body.amount,
      apy: req.body.apy || 0,
      current_value: req.body.amount * (req.body.price || 1),
      start_date: new Date(),
      network: req.body.network,
      transaction_hash: req.body.transactionHash,
      metadata: JSON.stringify(req.body.metadata || {})
    };

    const [position] = await db('defi_positions').insert(positionData).returning('*');

    res.json({
      success: true,
      message: 'DeFi position added successfully',
      data: position
    });
  } catch (error) {
    logger.error('Add DeFi position error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add DeFi position'
    });
  }
});

// Get protocol analytics
router.get('/analytics/:protocol', async (req, res) => {
  try {
    const { protocol } = req.params;

    const analytics = await defiService.getProtocolAnalytics(protocol);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get protocol analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch protocol analytics'
    });
  }
});

// Get DeFi portfolio summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;

    const positions = await db('defi_positions')
      .where({ user_id: userId, is_active: true });

    const summary = {
      totalValue: positions.reduce((sum, pos) => sum + parseFloat(pos.current_value), 0),
      totalRewards: positions.reduce((sum, pos) => sum + parseFloat(pos.rewards_earned), 0),
      activePositions: positions.length,
      protocols: [...new Set(positions.map(pos => pos.protocol))].length,
      averageApy: positions.reduce((sum, pos) => sum + parseFloat(pos.apy), 0) / positions.length || 0,
      byProtocol: positions.reduce((acc, pos) => {
        if (!acc[pos.protocol]) {
          acc[pos.protocol] = { value: 0, count: 0 };
        }
        acc[pos.protocol].value += parseFloat(pos.current_value);
        acc[pos.protocol].count += 1;
        return acc;
      }, {}),
      byType: positions.reduce((acc, pos) => {
        if (!acc[pos.type]) {
          acc[pos.type] = { value: 0, count: 0 };
        }
        acc[pos.type].value += parseFloat(pos.current_value);
        acc[pos.type].count += 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get DeFi summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DeFi summary'
    });
  }
});

module.exports = router;