const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const SIPService = require('../services/SIPService');
const PaymentService = require('../services/PaymentService');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

const router = express.Router();
const sipService = new SIPService();
const paymentService = new PaymentService();

// Get SIP plans for user
router.get('/plans', async (req, res) => {
  try {
    const userId = req.user.userId;

    const plans = await db.prepare(`
      SELECT sp.*, ba.bank_name, ba.account_number
      FROM sip_plans sp
      LEFT JOIN bank_accounts ba ON sp.bank_account_id = ba.id
      WHERE sp.user_id = ? AND sp.is_active = 1
      ORDER BY sp.created_at DESC
    `).all(userId);

    // Calculate next execution dates and performance
    for (let plan of plans) {
      plan.nextExecution = sipService.calculateNextExecution(plan);
      plan.performance = await sipService.calculateSIPPerformance(plan.id);
      plan.totalInvested = await sipService.getTotalInvested(plan.id);
      plan.currentValue = await sipService.getCurrentValue(plan.id);
    }

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    logger.error('Get SIP plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SIP plans'
    });
  }
});

// Create new SIP plan
router.post('/create', [
  body('amount').isFloat({ min: 100, max: 100000 }),
  body('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
  body('bankAccountId').isUUID(),
  body('startDate').isISO8601(),
  body('duration').optional().isInt({ min: 6, max: 120 })
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
    const {
      amount,
      frequency,
      bankAccountId,
      startDate,
      duration,
      goalType,
      goalAmount,
      autoIncrease,
      incrementPercent
    } = req.body;

    // Verify bank account belongs to user
    const bankAccount = await db.prepare(`
      SELECT * FROM bank_accounts 
      WHERE id = ? AND user_id = ? AND is_verified = 1
    `).get(bankAccountId, userId);

    if (!bankAccount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unverified bank account'
      });
    }

    // Check user's SIP limit (max 10 active SIPs)
    const activeSIPs = await db.prepare(`
      SELECT COUNT(*) as count FROM sip_plans 
      WHERE user_id = ? AND status = 'ACTIVE'
    `).get(userId);

    if (activeSIPs.count >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 active SIP plans allowed'
      });
    }

    const sipId = generateUUID();
    const sipData = {
      id: sipId,
      user_id: userId,
      amount: amount,
      frequency: frequency,
      bank_account_id: bankAccountId,
      start_date: startDate,
      duration_months: duration,
      goal_type: goalType || 'AMOUNT',
      goal_amount: goalAmount,
      auto_increase: autoIncrease || false,
      increment_percent: incrementPercent || 0,
      status: 'ACTIVE',
      next_execution: sipService.calculateNextExecution({
        frequency,
        start_date: startDate
      }),
      total_invested: 0,
      total_bitcoin: 0,
      average_price: 0,
      created_at: new Date().toISOString()
    };

    await db.prepare(`
      INSERT INTO sip_plans (
        id, user_id, amount, frequency, bank_account_id, start_date,
        duration_months, goal_type, goal_amount, auto_increase,
        increment_percent, status, next_execution, total_invested,
        total_bitcoin, average_price, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sipData.id, sipData.user_id, sipData.amount, sipData.frequency,
      sipData.bank_account_id, sipData.start_date, sipData.duration_months,
      sipData.goal_type, sipData.goal_amount, sipData.auto_increase,
      sipData.increment_percent, sipData.status, sipData.next_execution,
      sipData.total_invested, sipData.total_bitcoin, sipData.average_price,
      sipData.created_at
    );

    // Create auto-debit mandate
    const mandateResult = await paymentService.createAutoDebitMandate(
      userId,
      bankAccountId,
      amount,
      frequency
    );

    logger.info(`SIP plan created: ${sipId} for user ${userId}`);

    res.json({
      success: true,
      message: 'SIP plan created successfully',
      data: {
        sipId,
        mandateId: mandateResult.mandateId,
        nextExecution: sipData.next_execution
      }
    });
  } catch (error) {
    logger.error('Create SIP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create SIP plan'
    });
  }
});

// Execute SIP investment
router.post('/execute/:sipId', async (req, res) => {
  try {
    const { sipId } = req.params;
    const userId = req.user.userId;

    const sipPlan = await db.prepare(`
      SELECT * FROM sip_plans 
      WHERE id = ? AND user_id = ? AND status = 'ACTIVE'
    `).get(sipId, userId);

    if (!sipPlan) {
      return res.status(404).json({
        success: false,
        message: 'SIP plan not found or inactive'
      });
    }

    const executionResult = await sipService.executeSIPInvestment(sipPlan);

    res.json({
      success: true,
      message: 'SIP investment executed successfully',
      data: executionResult
    });
  } catch (error) {
    logger.error('Execute SIP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute SIP investment'
    });
  }
});

// Pause/Resume SIP
router.patch('/toggle/:sipId', async (req, res) => {
  try {
    const { sipId } = req.params;
    const { action } = req.body; // 'PAUSE' or 'RESUME'
    const userId = req.user.userId;

    const sipPlan = await db.prepare(`
      SELECT * FROM sip_plans WHERE id = ? AND user_id = ?
    `).get(sipId, userId);

    if (!sipPlan) {
      return res.status(404).json({
        success: false,
        message: 'SIP plan not found'
      });
    }

    const newStatus = action === 'PAUSE' ? 'PAUSED' : 'ACTIVE';
    const nextExecution = action === 'RESUME' 
      ? sipService.calculateNextExecution(sipPlan)
      : null;

    await db.prepare(`
      UPDATE sip_plans 
      SET status = ?, next_execution = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, nextExecution, sipId);

    logger.info(`SIP ${action.toLowerCase()}d: ${sipId}`);

    res.json({
      success: true,
      message: `SIP ${action.toLowerCase()}d successfully`
    });
  } catch (error) {
    logger.error('Toggle SIP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SIP status'
    });
  }
});

// Get SIP analytics
router.get('/analytics/:sipId', async (req, res) => {
  try {
    const { sipId } = req.params;
    const userId = req.user.userId;

    const analytics = await sipService.getSIPAnalytics(sipId, userId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get SIP analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SIP analytics'
    });
  }
});

// Get SIP recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.userId;

    const recommendations = await sipService.getSIPRecommendations(userId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Get SIP recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SIP recommendations'
    });
  }
});

// Cancel SIP
router.delete('/:sipId', async (req, res) => {
  try {
    const { sipId } = req.params;
    const userId = req.user.userId;

    const sipPlan = await db.prepare(`
      SELECT * FROM sip_plans WHERE id = ? AND user_id = ?
    `).get(sipId, userId);

    if (!sipPlan) {
      return res.status(404).json({
        success: false,
        message: 'SIP plan not found'
      });
    }

    // Cancel auto-debit mandate
    await paymentService.cancelAutoDebitMandate(sipPlan.mandate_id);

    // Update SIP status
    await db.prepare(`
      UPDATE sip_plans 
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(sipId);

    logger.info(`SIP cancelled: ${sipId}`);

    res.json({
      success: true,
      message: 'SIP plan cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel SIP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel SIP plan'
    });
  }
});

// Get SIP history
router.get('/history/:sipId', async (req, res) => {
  try {
    const { sipId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    const history = await db.prepare(`
      SELECT * FROM sip_transactions 
      WHERE sip_plan_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(sipId, userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const total = await db.prepare(`
      SELECT COUNT(*) as count FROM sip_transactions 
      WHERE sip_plan_id = ? AND user_id = ?
    `).get(sipId, userId);

    res.json({
      success: true,
      data: {
        transactions: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total.count,
          pages: Math.ceil(total.count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get SIP history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SIP history'
    });
  }
});

module.exports = router;