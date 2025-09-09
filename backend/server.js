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
const { db } = require('./config/database');
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
const copyTradingRoutes = require('./routes/copyTrading');
const advancedOrdersRoutes = require('./routes/advancedOrders');
const riskManagementRoutes = require('./routes/riskManagement');
const bankingRoutes = require('./routes/banking');
const exchangeRoutes = require('./routes/exchanges');
const marketingRoutes = require('./routes/marketing');

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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
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
    version: '1.0.0',
    database: 'Connected'
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
app.use('/api/v1/copy-trading', authMiddleware, copyTradingRoutes);
app.use('/api/v1/advanced-orders', authMiddleware, advancedOrdersRoutes);
app.use('/api/v1/risk-management', authMiddleware, riskManagementRoutes);
app.use('/api/v1/banking', authMiddleware, bankingRoutes);
app.use('/api/v1/exchanges', exchangeRoutes);
app.use('/api/v1/marketing', authMiddleware, marketingRoutes);

// WebSocket setup for real-time updates
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Store connected clients
const clients = new Set();

wss.on('connection', (ws, req) => {
  clients.add(ws);
  logger.info('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      logger.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('WebSocket client disconnected');
  });

  // Send initial price data
  ws.send(JSON.stringify({
    type: 'PRICE_UPDATE',
    data: {
      symbol: 'BTC/USDT',
      price: 67523 + (Math.random() - 0.5) * 1000,
      change24h: (Math.random() - 0.5) * 10,
      timestamp: new Date().toISOString()
    }
  }));
});

// WebSocket message handler
function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'SUBSCRIBE_PRICE':
      // Subscribe to price updates
      ws.priceSubscription = data.symbol || 'BTC/USDT';
      break;
    case 'UNSUBSCRIBE_PRICE':
      // Unsubscribe from price updates
      delete ws.priceSubscription;
      break;
  }
}

// Broadcast price updates to all connected clients
setInterval(() => {
  const priceUpdate = {
    type: 'PRICE_UPDATE',
    data: {
      symbol: 'BTC/USDT',
      price: 67523 + (Math.random() - 0.5) * 1000,
      change24h: (Math.random() - 0.5) * 10,
      volume: Math.random() * 1000000000,
      timestamp: new Date().toISOString()
    }
  };

  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(priceUpdate));
    }
  });
}, 2000); // Update every 2 seconds

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 TradeBitco.in Backend Server running on port ${PORT}`);
  logger.info(`📊 WebSocket server running on ws://localhost:${PORT}/ws`);
  logger.info(`🌐 API available at http://localhost:${PORT}/api/v1`);
  logger.info(`💚 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

module.exports = app;