const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const TradingService = require('../services/TradingService');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

const router = express.Router();
const tradingService = new TradingService();

// Create OCO (One-Cancels-Other) order
router.post('/oco', [
  body('symbol').notEmpty(),
  body('amount').isFloat({ min: 0.0001 }),
  body('limitPrice').isFloat({ min: 0.01 }),
  body('stopPrice').isFloat({ min: 0.01 }),
  body('stopLimitPrice').isFloat({ min: 0.01 })
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
    const { symbol, amount, limitPrice, stopPrice, stopLimitPrice, side = 'BUY' } = req.body;

    const orderId = generateUUID();
    const limitOrderId = generateUUID();
    const stopOrderId = generateUUID();

    // Create OCO order group
    await db.prepare(`
      INSERT INTO advanced_orders (
        id, user_id, type, symbol, amount, status, 
        order_group_id, parameters
      ) VALUES (?, ?, 'OCO', ?, ?, 'PENDING', ?, ?)
    `).run(
      orderId, 
      userId, 
      symbol, 
      amount, 
      orderId,
      JSON.stringify({
        side,
        limitPrice,
        stopPrice,
        stopLimitPrice,
        limitOrderId,
        stopOrderId
      })
    );

    // Create limit order
    await db.prepare(`
      INSERT INTO advanced_orders (
        id, user_id, type, symbol, amount, price, status,
        order_group_id, parent_order_id
      ) VALUES (?, ?, 'LIMIT', ?, ?, ?, 'PENDING', ?, ?)
    `).run(limitOrderId, userId, symbol, amount, limitPrice, orderId, orderId);

    // Create stop-limit order
    await db.prepare(`
      INSERT INTO advanced_orders (
        id, user_id, type, symbol, amount, price, status,
        order_group_id, parent_order_id, parameters
      ) VALUES (?, ?, 'STOP_LIMIT', ?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(
      stopOrderId, 
      userId, 
      symbol, 
      amount, 
      stopLimitPrice, 
      orderId, 
      orderId,
      JSON.stringify({ stopPrice })
    );

    res.json({
      success: true,
      message: 'OCO order created successfully',
      data: { orderId, limitOrderId, stopOrderId }
    });
  } catch (error) {
    logger.error('Create OCO order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create OCO order'
    });
  }
});

// Create TWAP (Time-Weighted Average Price) order
router.post('/twap', [
  body('symbol').notEmpty(),
  body('totalAmount').isFloat({ min: 0.0001 }),
  body('duration').isInt({ min: 1, max: 1440 }), // 1 minute to 24 hours
  body('intervalMinutes').isInt({ min: 1, max: 60 })
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
    const { symbol, totalAmount, duration, intervalMinutes, side = 'BUY' } = req.body;

    const orderId = generateUUID();
    const numberOfOrders = Math.ceil(duration / intervalMinutes);
    const amountPerOrder = totalAmount / numberOfOrders;

    await db.prepare(`
      INSERT INTO advanced_orders (
        id, user_id, type, symbol, amount, status, parameters
      ) VALUES (?, ?, 'TWAP', ?, ?, 'PENDING', ?)
    `).run(
      orderId,
      userId,
      symbol,
      totalAmount,
      JSON.stringify({
        side,
        duration,
        intervalMinutes,
        numberOfOrders,
        amountPerOrder,
        executedOrders: 0,
        startTime: new Date().toISOString()
      })
    );

    // Schedule TWAP execution
    await tradingService.scheduleTWAPExecution(orderId);

    res.json({
      success: true,
      message: 'TWAP order created successfully',
      data: { orderId, numberOfOrders, amountPerOrder }
    });
  } catch (error) {
    logger.error('Create TWAP order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create TWAP order'
    });
  }
});

// Create Iceberg order
router.post('/iceberg', [
  body('symbol').notEmpty(),
  body('totalAmount').isFloat({ min: 0.0001 }),
  body('visibleAmount').isFloat({ min: 0.0001 }),
  body('price').isFloat({ min: 0.01 })
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
    const { symbol, totalAmount, visibleAmount, price, side = 'BUY' } = req.body;

    if (visibleAmount >= totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Visible amount must be less than total amount'
      });
    }

    const orderId = generateUUID();
    
    await db.prepare(`
      INSERT INTO advanced_orders (
        id, user_id, type, symbol, amount, price, status, parameters
      ) VALUES (?, ?, 'ICEBERG', ?, ?, ?, 'PENDING', ?)
    `).run(
      orderId,
      userId,
      symbol,
      totalAmount,
      price,
      JSON.stringify({
        side,
        visibleAmount,
        remainingAmount: totalAmount,
        executedAmount: 0
      })
    );

    res.json({
      success: true,
      message: 'Iceberg order created successfully',
      data: { orderId }
    });
  } catch (error) {
    logger.error('Create Iceberg order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Iceberg order'
    });
  }
});

// Get user's advanced orders
router.get('/orders', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, type, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT * FROM advanced_orders 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const orders = await db.prepare(query).all(...params);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Get advanced orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advanced orders'
    });
  }
});

// Cancel advanced order
router.delete('/orders/:orderId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await db.prepare(`
      SELECT * FROM advanced_orders 
      WHERE id = ? AND user_id = ?
    `).get(orderId, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'PENDING' && order.status !== 'PARTIALLY_FILLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in current status'
      });
    }

    await db.prepare(`
      UPDATE advanced_orders 
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

module.exports = router;