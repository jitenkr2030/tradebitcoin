const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../utils/logger');

// Use SQLite for development
const dbPath = path.join(__dirname, '../database.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
const initializeDatabase = () => {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        subscription TEXT DEFAULT 'FREE',
        subscription_expires_at DATETIME,
        api_keys TEXT DEFAULT '{}',
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        referral_code TEXT UNIQUE,
        referral_count INTEGER DEFAULT 0,
        preferences TEXT DEFAULT '{}',
        risk_profile TEXT DEFAULT 'MODERATE',
        tax_settings TEXT DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trading strategies table
    db.exec(`
      CREATE TABLE IF NOT EXISTS trading_strategies (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        stop_loss REAL NOT NULL,
        take_profit REAL NOT NULL,
        trailing_stop BOOLEAN DEFAULT FALSE,
        indicators TEXT DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trades table
    db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        strategy_id TEXT,
        type TEXT NOT NULL,
        symbol TEXT NOT NULL,
        price REAL NOT NULL,
        amount REAL NOT NULL,
        total REAL NOT NULL,
        fee REAL DEFAULT 0,
        exchange TEXT NOT NULL,
        status TEXT DEFAULT 'FILLED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Portfolio table
    db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        amount REAL NOT NULL,
        avg_price REAL NOT NULL,
        current_price REAL NOT NULL,
        total_value REAL NOT NULL,
        profit_loss REAL DEFAULT 0,
        profit_loss_percent REAL DEFAULT 0,
        exchange TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, symbol, exchange)
      )
    `);

    // Tax reports table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tax_reports (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        tax_year TEXT NOT NULL,
        total_gains REAL DEFAULT 0,
        total_losses REAL DEFAULT 0,
        net_gains REAL DEFAULT 0,
        tax_liability REAL DEFAULT 0,
        transactions TEXT DEFAULT '[]',
        status TEXT DEFAULT 'COMPLETED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // DeFi positions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS defi_positions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        protocol TEXT NOT NULL,
        type TEXT NOT NULL,
        symbol TEXT NOT NULL,
        amount REAL NOT NULL,
        apy REAL NOT NULL,
        current_value REAL NOT NULL,
        rewards_earned REAL DEFAULT 0,
        start_date DATETIME NOT NULL,
        network TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat history table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        context TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Copy trading tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS copy_traders (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        total_followers INTEGER DEFAULT 0,
        total_profit REAL DEFAULT 0,
        win_rate REAL DEFAULT 0,
        max_drawdown REAL DEFAULT 0,
        sharpe_ratio REAL DEFAULT 0,
        total_trades INTEGER DEFAULT 0,
        avg_monthly_return REAL DEFAULT 0,
        risk_score REAL DEFAULT 0,
        verified_trader BOOLEAN DEFAULT FALSE,
        subscription_fee REAL DEFAULT 0,
        performance_fee REAL DEFAULT 0,
        description TEXT,
        trading_experience INTEGER,
        accepting_followers BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS copy_trading_follows (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        trader_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        allocation_percent REAL NOT NULL,
        max_risk_percent REAL NOT NULL,
        stop_loss REAL,
        status TEXT DEFAULT 'ACTIVE',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Advanced orders table
    db.exec(`
      CREATE TABLE IF NOT EXISTS advanced_orders (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        symbol TEXT NOT NULL,
        amount REAL NOT NULL,
        price REAL,
        status TEXT DEFAULT 'PENDING',
        order_group_id TEXT,
        parent_order_id TEXT,
        parameters TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Risk management tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS risk_limits (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        max_daily_loss REAL DEFAULT 5,
        max_position_size REAL DEFAULT 20,
        max_drawdown REAL DEFAULT 10,
        stop_loss_percent REAL DEFAULT 2,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS risk_events (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        description TEXT,
        severity TEXT DEFAULT 'MEDIUM',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

// Helper functions for database operations
const dbHelpers = {
  // Get user by email
  getUserByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  // Create user
  createUser: (userData) => {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, referral_code, preferences)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      userData.email,
      userData.password_hash,
      userData.name,
      userData.referral_code,
      JSON.stringify(userData.preferences || {})
    );
  },

  // Get user trades
  getUserTrades: (userId, limit = 50) => {
    return db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit);
  },

  // Get user portfolio
  getUserPortfolio: (userId) => {
    return db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(userId);
  },

  // Insert trade
  insertTrade: (tradeData) => {
    const stmt = db.prepare(`
      INSERT INTO trades (user_id, strategy_id, type, symbol, price, amount, total, exchange)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      tradeData.user_id,
      tradeData.strategy_id,
      tradeData.type,
      tradeData.symbol,
      tradeData.price,
      tradeData.amount,
      tradeData.total,
      tradeData.exchange
    );
  }
};

module.exports = { db, ...dbHelpers };