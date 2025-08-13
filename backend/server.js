const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const logger = require('./utils/logger');
const db = require('./config/database');
const redis = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');
const portfolioRoutes = require('./routes/portfolio');
const paymentRoutes = require('./routes/payment');
const aiRoutes = require('./routes/ai');
const taxRoutes = require('./routes/tax');
const defiRoutes = require('./routes/defi');
const educationRoutes = require('./routes/education');
const webhookRoutes = require('./routes/webhooks');

// Import services
const TradingService = require('./services/TradingService');
const WebSocketService = require('./services/WebSocketService');
const CronService = require('./services/CronService');

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tradebitco.in', 'https://www.tradebitco.in']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/trading', authMiddleware, tradingRoutes);
app.use('/api/v1/portfolio', authMiddleware, portfolioRoutes);
app.use('/api/v1/payment', authMiddleware, paymentRoutes);
app.use('/api/v1/ai', authMiddleware, aiRoutes);
app.use('/api/v1/tax', authMiddleware, taxRoutes);
app.use('/api/v1/defi', authMiddleware, defiRoutes);
app.use('/api/v1/education', authMiddleware, educationRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// WebSocket setup
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

const wsService = new WebSocketService(wss);

// Initialize services
const tradingService = new TradingService();
const cronService = new CronService();

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    logger.info('Database connected successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connected successfully');

    // Start cron jobs
    cronService.start();
    logger.info('Cron jobs started');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections
    db.destroy();
    redis.disconnect();
    
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;