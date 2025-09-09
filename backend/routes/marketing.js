const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const MarketingService = require('../services/MarketingService');
const logger = require('../utils/logger');

const router = express.Router();
const marketingService = new MarketingService();

// Get marketing campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM marketing_campaigns WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const campaigns = await db.prepare(query).all(...params);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    logger.error('Get marketing campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns'
    });
  }
});

// Create marketing campaign
router.post('/campaigns', [
  body('name').notEmpty(),
  body('type').isIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP']),
  body('audience').notEmpty(),
  body('content').notEmpty()
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

    const campaignData = req.body;
    const campaign = await marketingService.createCampaign(campaignData);

    res.json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign'
    });
  }
});

// Get user segments
router.get('/segments', async (req, res) => {
  try {
    const segments = await marketingService.getUserSegments();

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    logger.error('Get user segments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user segments'
    });
  }
});

// Get marketing analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const analytics = await marketingService.getAnalytics(period);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get marketing analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;