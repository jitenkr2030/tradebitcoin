const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const AIService = require('../services/AIService');
const logger = require('../utils/logger');

const router = express.Router();
const aiService = new AIService();

// Get AI recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol = 'BTC/USDT', timeframe = '1h' } = req.query;

    const recommendations = await aiService.generateRecommendations(userId, symbol, timeframe);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Get AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations'
    });
  }
});

// AI Chat
router.post('/chat', [
  body('message').notEmpty().isLength({ max: 1000 })
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
    const { message, context } = req.body;

    const response = await aiService.processChat(userId, message, context);

    // Save chat history
    await db('chat_history').insert({
      user_id: userId,
      user_message: message,
      ai_response: response,
      context: JSON.stringify(context || {})
    });

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
});

// Get portfolio analysis
router.get('/portfolio-analysis', async (req, res) => {
  try {
    const userId = req.user.userId;

    const analysis = await aiService.analyzePortfolio(userId);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Portfolio analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze portfolio'
    });
  }
});

// Get market sentiment
router.get('/sentiment', async (req, res) => {
  try {
    const { symbol = 'BTC' } = req.query;

    const sentiment = await aiService.getMarketSentiment(symbol);

    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    logger.error('Get sentiment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market sentiment'
    });
  }
});

// Get price prediction
router.get('/prediction', async (req, res) => {
  try {
    const { symbol = 'BTC/USDT', timeframe = '1h' } = req.query;

    const prediction = await aiService.getPricePrediction(symbol, timeframe);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    logger.error('Get prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate price prediction'
    });
  }
});

module.exports = router;