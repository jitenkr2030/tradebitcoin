const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Get education content
router.get('/content', async (req, res) => {
  try {
    const { level, type, language = 'en', page = 1, limit = 20 } = req.query;

    let query = db('education_content').where({ is_active: true });

    if (level) query = query.where({ level });
    if (type && type !== 'ALL') query = query.where({ type });
    if (language) query = query.where({ language });

    const content = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const total = await db('education_content')
      .where({ is_active: true })
      .count('* as count');

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total[0].count),
          pages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get education content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education content'
    });
  }
});

// Get learning paths
router.get('/learning-paths', async (req, res) => {
  try {
    const { language = 'en' } = req.query;

    const learningPaths = [
      {
        id: 'crypto-basics',
        title: language === 'hi' ? 'क्रिप्टो बेसिक्स' : 'Crypto Basics',
        description: language === 'hi' 
          ? 'ब्लॉकचेन, बिटकॉइन और ट्रेडिंग की बुनियादी बातें सीखें'
          : 'Learn fundamentals of blockchain, Bitcoin, and trading basics',
        level: 'BEGINNER',
        lessons: 12,
        duration: 180, // minutes
        color: 'green'
      },
      {
        id: 'trading-strategies',
        title: language === 'hi' ? 'ट्रेडिंग रणनीतियां' : 'Trading Strategies',
        description: language === 'hi'
          ? 'उन्नत ट्रेडिंग तकनीकें और जोखिम प्रबंधन सीखें'
          : 'Learn advanced trading techniques and risk management',
        level: 'INTERMEDIATE',
        lessons: 18,
        duration: 300,
        color: 'yellow'
      },
      {
        id: 'defi-web3',
        title: language === 'hi' ? 'DeFi और Web3' : 'DeFi & Web3',
        description: language === 'hi'
          ? 'विकेंद्रीकृत वित्त और Web3 के अवसरों का अन्वेषण करें'
          : 'Explore decentralized finance and Web3 opportunities',
        level: 'ADVANCED',
        lessons: 15,
        duration: 240,
        color: 'purple'
      }
    ];

    res.json({
      success: true,
      data: learningPaths
    });
  } catch (error) {
    logger.error('Get learning paths error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning paths'
    });
  }
});

// Get webinars
router.get('/webinars', async (req, res) => {
  try {
    const { upcoming = true } = req.query;
    const now = new Date();

    const webinars = [
      {
        id: 'btc-analysis',
        title: 'Bitcoin Technical Analysis Masterclass',
        description: 'Learn advanced charting techniques and market psychology',
        date: '2024-12-25',
        time: '19:00',
        timezone: 'IST',
        instructor: 'Expert Trader',
        registrationUrl: '#',
        isUpcoming: new Date('2024-12-25') > now
      },
      {
        id: 'crypto-tax',
        title: 'Crypto Tax Planning for 2024',
        description: 'Navigate Indian crypto tax regulations and optimize your returns',
        date: '2024-12-28',
        time: '18:00',
        timezone: 'IST',
        instructor: 'CA Expert',
        registrationUrl: '#',
        isUpcoming: new Date('2024-12-28') > now
      }
    ];

    const filteredWebinars = upcoming 
      ? webinars.filter(w => w.isUpcoming)
      : webinars;

    res.json({
      success: true,
      data: filteredWebinars
    });
  } catch (error) {
    logger.error('Get webinars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webinars'
    });
  }
});

// Track user progress
router.post('/progress', [
  body('contentId').notEmpty(),
  body('progress').isFloat({ min: 0, max: 100 })
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
    const { contentId, progress, timeSpent } = req.body;

    await db('user_progress').insert({
      user_id: userId,
      content_id: contentId,
      progress,
      time_spent: timeSpent || 0,
      completed: progress >= 100
    }).onConflict(['user_id', 'content_id']).merge();

    res.json({
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    logger.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

// Get user progress
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user.userId;

    const progress = await db('user_progress')
      .select('user_progress.*', 'education_content.title', 'education_content.type')
      .leftJoin('education_content', 'user_progress.content_id', 'education_content.id')
      .where('user_progress.user_id', userId)
      .orderBy('user_progress.updated_at', 'desc');

    const stats = {
      totalContent: progress.length,
      completedContent: progress.filter(p => p.completed).length,
      totalTimeSpent: progress.reduce((sum, p) => sum + (p.time_spent || 0), 0),
      averageProgress: progress.reduce((sum, p) => sum + p.progress, 0) / progress.length || 0
    };

    res.json({
      success: true,
      data: {
        progress,
        stats
      }
    });
  } catch (error) {
    logger.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress'
    });
  }
});

module.exports = router;