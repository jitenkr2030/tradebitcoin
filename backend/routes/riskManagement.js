const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const RiskManagementService = require('../services/RiskManagementService');
const logger = require('../utils/logger');

const router = express.Router();
const riskService = new RiskManagementService();

// Get risk assessment
router.get('/assessment', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const assessment = await riskService.calculateRiskAssessment(userId);

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate risk assessment'
    });
  }
});

// Set risk limits
router.post('/limits', [
  body('maxDailyLoss').isFloat({ min: 1, max: 50 }),
  body('maxPositionSize').isFloat({ min: 1, max: 100 }),
  body('maxDrawdown').isFloat({ min: 1, max: 50 }),
  body('stopLossPercent').isFloat({ min: 0.1, max: 20 })
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
    const riskLimits = req.body;

    await db.prepare(`
      INSERT OR REPLACE INTO risk_limits (
        user_id, max_daily_loss, max_position_size, 
        max_drawdown, stop_loss_percent, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      userId,
      riskLimits.maxDailyLoss,
      riskLimits.maxPositionSize,
      riskLimits.maxDrawdown,
      riskLimits.stopLossPercent
    );

    res.json({
      success: true,
      message: 'Risk limits updated successfully'
    });
  } catch (error) {
    logger.error('Set risk limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set risk limits'
    });
  }
});

// Get portfolio risk metrics
router.get('/portfolio-risk', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const riskMetrics = await riskService.calculatePortfolioRisk(userId);

    res.json({
      success: true,
      data: riskMetrics
    });
  } catch (error) {
    logger.error('Portfolio risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate portfolio risk'
    });
  }
});

// Emergency stop all trading
router.post('/emergency-stop', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Stop all active strategies
    await db.prepare(`
      UPDATE trading_strategies 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(userId);

    // Cancel all pending orders
    await db.prepare(`
      UPDATE advanced_orders 
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND status IN ('PENDING', 'PARTIALLY_FILLED')
    `).run(userId);

    // Log emergency stop
    await db.prepare(`
      INSERT INTO risk_events (
        id, user_id, type, description, severity, created_at
      ) VALUES (?, ?, 'EMERGENCY_STOP', 'User triggered emergency stop', 'HIGH', CURRENT_TIMESTAMP)
    `).run(generateUUID(), userId);

    logger.warn(`Emergency stop triggered by user ${userId}`);

    res.json({
      success: true,
      message: 'Emergency stop executed successfully'
    });
  } catch (error) {
    logger.error('Emergency stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute emergency stop'
    });
  }
});

module.exports = router;