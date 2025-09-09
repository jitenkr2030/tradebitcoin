const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const BankingService = require('../services/BankingService');
const logger = require('../utils/logger');

const router = express.Router();
const bankingService = new BankingService();

// Add bank account
router.post('/accounts', [
  body('accountNumber').isLength({ min: 9, max: 18 }),
  body('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  body('accountHolderName').isLength({ min: 2, max: 100 }),
  body('bankName').notEmpty(),
  body('accountType').isIn(['SAVINGS', 'CURRENT'])
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
    const { accountNumber, ifscCode, accountHolderName, bankName, accountType } = req.body;

    // Check if account already exists
    const existing = await db.prepare(`
      SELECT * FROM bank_accounts 
      WHERE user_id = ? AND account_number = ?
    `).get(userId, accountNumber);

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bank account already added'
      });
    }

    const verification = await bankingService.verifyBankAccount(
      accountNumber, ifscCode, accountHolderName
    );

    const accountId = require('../utils/helpers').generateUUID();
    await db.prepare(`
      INSERT INTO bank_accounts (
        id, user_id, account_number, ifsc_code, account_holder_name,
        bank_name, account_type, verification_status, verification_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      accountId, userId, accountNumber, ifscCode, accountHolderName,
      bankName, accountType, verification.status, JSON.stringify(verification.data)
    );

    res.json({
      success: true,
      message: 'Bank account added successfully',
      data: { accountId, verificationStatus: verification.status }
    });
  } catch (error) {
    logger.error('Add bank account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bank account'
    });
  }
});

// Get user bank accounts
router.get('/accounts', async (req, res) => {
  try {
    const userId = req.user.userId;

    const accounts = await db.prepare(`
      SELECT id, bank_name, account_number, account_holder_name,
             account_type, verification_status, is_primary, created_at
      FROM bank_accounts 
      WHERE user_id = ? AND is_active = 1
      ORDER BY is_primary DESC, created_at DESC
    `).all(userId);

    // Mask account numbers for security
    const maskedAccounts = accounts.map(account => ({
      ...account,
      account_number: account.account_number.replace(/\d(?=\d{4})/g, '*')
    }));

    res.json({
      success: true,
      data: maskedAccounts
    });
  } catch (error) {
    logger.error('Get bank accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank accounts'
    });
  }
});

// Initiate deposit
router.post('/deposit', [
  body('amount').isFloat({ min: 100, max: 1000000 }),
  body('bankAccountId').isUUID()
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
    const { amount, bankAccountId } = req.body;

    const deposit = await bankingService.initiateDeposit(userId, bankAccountId, amount);

    res.json({
      success: true,
      message: 'Deposit initiated successfully',
      data: deposit
    });
  } catch (error) {
    logger.error('Initiate deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate deposit'
    });
  }
});

// Initiate withdrawal
router.post('/withdraw', [
  body('amount').isFloat({ min: 100 }),
  body('bankAccountId').isUUID()
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
    const { amount, bankAccountId } = req.body;

    const withdrawal = await bankingService.initiateWithdrawal(userId, bankAccountId, amount);

    res.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      data: withdrawal
    });
  } catch (error) {
    logger.error('Initiate withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate withdrawal'
    });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, status, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT bt.*, ba.bank_name, ba.account_number
      FROM banking_transactions bt
      LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.user_id = ?
    `;
    const params = [userId];

    if (type) {
      query += ` AND bt.type = ?`;
      params.push(type);
    }

    if (status) {
      query += ` AND bt.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY bt.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const transactions = await db.prepare(query).all(...params);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    logger.error('Get banking transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

module.exports = router;