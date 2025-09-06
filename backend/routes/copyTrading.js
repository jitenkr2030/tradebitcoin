const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

const router = express.Router();

// Get top traders leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { period = '30d', limit = 50 } = req.query;
    
    const traders = await db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ct.total_followers,
        ct.total_profit,
        ct.win_rate,
        ct.max_drawdown,
        ct.sharpe_ratio,
        ct.total_trades,
        ct.avg_monthly_return,
        ct.risk_score,
        ct.verified_trader,
        ct.subscription_fee,
        ct.performance_fee,
        ct.description,
        ct.trading_experience,
        ct.created_at
      FROM copy_traders ct
      JOIN users u ON ct.user_id = u.id
      WHERE ct.is_active = 1 AND ct.accepting_followers = 1
      ORDER BY ct.sharpe_ratio DESC, ct.total_profit DESC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      data: traders
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trader leaderboard'
    });
  }
});

// Follow a trader
router.post('/follow', [
  body('traderId').isUUID(),
  body('allocationPercent').isFloat({ min: 1, max: 100 }),
  body('maxRiskPercent').isFloat({ min: 1, max: 50 })
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
    const { traderId, allocationPercent, maxRiskPercent, stopLoss } = req.body;

    // Check if trader exists and is accepting followers
    const trader = await db.prepare(`
      SELECT * FROM copy_traders 
      WHERE user_id = ? AND is_active = 1 AND accepting_followers = 1
    `).get(traderId);

    if (!trader) {
      return res.status(404).json({
        success: false,
        message: 'Trader not found or not accepting followers'
      });
    }

    // Check if already following
    const existingFollow = await db.prepare(`
      SELECT * FROM copy_trading_follows 
      WHERE follower_id = ? AND trader_id = ? AND is_active = 1
    `).get(userId, traderId);

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Already following this trader'
      });
    }

    // Create follow relationship
    const followId = generateUUID();
    await db.prepare(`
      INSERT INTO copy_trading_follows (
        id, follower_id, trader_id, allocation_percent, 
        max_risk_percent, stop_loss, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(followId, userId, traderId, allocationPercent, maxRiskPercent, stopLoss);

    // Update trader's follower count
    await db.prepare(`
      UPDATE copy_traders 
      SET total_followers = total_followers + 1 
      WHERE user_id = ?
    `).run(traderId);

    logger.info(`User ${userId} started following trader ${traderId}`);

    res.json({
      success: true,
      message: 'Successfully started following trader',
      data: { followId }
    });
  } catch (error) {
    logger.error('Follow trader error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow trader'
    });
  }
});

// Get user's followed traders
router.get('/following', async (req, res) => {
  try {
    const userId = req.user.userId;

    const following = await db.prepare(`
      SELECT 
        ctf.*,
        u.name as trader_name,
        ct.total_profit,
        ct.win_rate,
        ct.sharpe_ratio,
        ct.max_drawdown,
        ct.verified_trader
      FROM copy_trading_follows ctf
      JOIN users u ON ctf.trader_id = u.id
      JOIN copy_traders ct ON ctf.trader_id = ct.user_id
      WHERE ctf.follower_id = ? AND ctf.is_active = 1
      ORDER BY ctf.created_at DESC
    `).all(userId);

    res.json({
      success: true,
      data: following
    });
  } catch (error) {
    logger.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followed traders'
    });
  }
});

// Apply to become a copy trader
router.post('/apply-trader', [
  body('tradingExperience').isInt({ min: 1 }),
  body('description').isLength({ min: 50, max: 1000 }),
  body('subscriptionFee').isFloat({ min: 0, max: 1000 }),
  body('performanceFee').isFloat({ min: 0, max: 30 })
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
    const { tradingExperience, description, subscriptionFee, performanceFee } = req.body;

    // Check if already applied
    const existing = await db.prepare(`
      SELECT * FROM copy_trader_applications WHERE user_id = ?
    `).get(userId);

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Application already submitted'
      });
    }

    const applicationId = generateUUID();
    await db.prepare(`
      INSERT INTO copy_trader_applications (
        id, user_id, trading_experience, description,
        subscription_fee, performance_fee, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(applicationId, userId, tradingExperience, description, subscriptionFee, performanceFee);

    res.json({
      success: true,
      message: 'Copy trader application submitted successfully'
    });
  } catch (error) {
    logger.error('Apply trader error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

module.exports = router;