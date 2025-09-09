const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

class BankingService {
  constructor() {
    this.supportedBanks = [
      'SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK', 'YES', 'INDUSIND',
      'PNB', 'BOB', 'CANARA', 'UNION', 'IOB', 'FEDERAL', 'RBL'
    ];
    
    this.upiProviders = [
      'PAYTM', 'PHONEPE', 'GPAY', 'BHIM', 'AMAZON_PAY', 'MOBIKWIK'
    ];
  }

  async verifyBankAccount(accountNumber, ifscCode, accountHolderName) {
    try {
      // In production, integrate with bank verification APIs
      // For demo, simulate verification process
      
      const bankCode = ifscCode.substring(0, 4);
      const bankName = this.getBankName(bankCode);
      
      if (!bankName) {
        return {
          status: 'FAILED',
          message: 'Invalid IFSC code',
          data: null
        };
      }

      // Simulate penny drop verification
      const verificationAmount = Math.floor(Math.random() * 99) + 1;
      
      return {
        status: 'PENDING',
        message: 'Verification initiated',
        data: {
          bankName,
          verificationAmount,
          verificationId: generateUUID(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } catch (error) {
      logger.error('Bank account verification error:', error);
      return {
        status: 'FAILED',
        message: 'Verification failed',
        data: null
      };
    }
  }

  async initiateDeposit(userId, bankAccountId, amount) {
    try {
      const bankAccount = await db.prepare(`
        SELECT * FROM bank_accounts 
        WHERE id = ? AND user_id = ? AND verification_status = 'VERIFIED'
      `).get(bankAccountId, userId);

      if (!bankAccount) {
        throw new Error('Bank account not found or not verified');
      }

      const depositId = generateUUID();
      const upiId = this.generateUPIId();
      
      // Create deposit transaction
      await db.prepare(`
        INSERT INTO banking_transactions (
          id, user_id, bank_account_id, type, amount, currency,
          status, upi_id, qr_code, expires_at
        ) VALUES (?, ?, ?, 'DEPOSIT', ?, 'INR', 'PENDING', ?, ?, ?)
      `).run(
        depositId,
        userId,
        bankAccountId,
        amount,
        upiId,
        this.generateQRCode(upiId, amount),
        new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes expiry
      );

      return {
        depositId,
        upiId,
        qrCode: this.generateQRCode(upiId, amount),
        amount,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        instructions: [
          'Scan the QR code with any UPI app',
          'Or pay to the UPI ID provided',
          'Payment will be processed within 2-3 minutes',
          'Bitcoin will be credited to your account automatically'
        ]
      };
    } catch (error) {
      logger.error('Initiate deposit error:', error);
      throw error;
    }
  }

  async initiateWithdrawal(userId, bankAccountId, amount) {
    try {
      // Check user balance
      const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      const portfolio = await db.prepare(`
        SELECT SUM(total_value) as total FROM portfolio WHERE user_id = ?
      `).get(userId);

      const availableBalance = parseFloat(portfolio.total || 0);
      
      if (amount > availableBalance) {
        throw new Error('Insufficient balance');
      }

      const bankAccount = await db.prepare(`
        SELECT * FROM bank_accounts 
        WHERE id = ? AND user_id = ? AND verification_status = 'VERIFIED'
      `).get(bankAccountId, userId);

      if (!bankAccount) {
        throw new Error('Bank account not found or not verified');
      }

      const withdrawalId = generateUUID();
      
      // Create withdrawal transaction
      await db.prepare(`
        INSERT INTO banking_transactions (
          id, user_id, bank_account_id, type, amount, currency,
          status, processing_fee
        ) VALUES (?, ?, ?, 'WITHDRAWAL', ?, 'INR', 'PENDING', ?)
      `).run(
        withdrawalId,
        userId,
        bankAccountId,
        amount,
        Math.max(10, amount * 0.001) // 0.1% fee, minimum ₹10
      );

      return {
        withdrawalId,
        amount,
        processingFee: Math.max(10, amount * 0.001),
        estimatedTime: '2-4 business hours',
        bankAccount: {
          bankName: bankAccount.bank_name,
          accountNumber: bankAccount.account_number.replace(/\d(?=\d{4})/g, '*')
        }
      };
    } catch (error) {
      logger.error('Initiate withdrawal error:', error);
      throw error;
    }
  }

  async processUPIPayment(upiTransactionId, amount, upiId) {
    try {
      // Find pending deposit
      const deposit = await db.prepare(`
        SELECT * FROM banking_transactions 
        WHERE upi_id = ? AND amount = ? AND status = 'PENDING' AND type = 'DEPOSIT'
      `).get(upiId, amount);

      if (!deposit) {
        throw new Error('Deposit transaction not found');
      }

      // Update transaction status
      await db.prepare(`
        UPDATE banking_transactions 
        SET status = 'COMPLETED', upi_transaction_id = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(upiTransactionId, deposit.id);

      // Credit Bitcoin to user account
      const currentPrice = await this.getCurrentBitcoinPrice();
      const bitcoinAmount = parseFloat(amount) / currentPrice;

      await this.creditBitcoin(deposit.user_id, bitcoinAmount, currentPrice);

      logger.info(`Deposit completed: ${deposit.id}, Amount: ₹${amount}, BTC: ${bitcoinAmount}`);

      return {
        success: true,
        bitcoinAmount,
        currentPrice
      };
    } catch (error) {
      logger.error('Process UPI payment error:', error);
      throw error;
    }
  }

  async creditBitcoin(userId, bitcoinAmount, price) {
    try {
      // Update or create portfolio entry
      const existing = await db.prepare(`
        SELECT * FROM portfolio 
        WHERE user_id = ? AND symbol = 'BTC/USDT' AND exchange = 'tradebitco'
      `).get(userId);

      if (existing) {
        const newAmount = parseFloat(existing.amount) + bitcoinAmount;
        const newAvgPrice = ((parseFloat(existing.amount) * parseFloat(existing.avg_price)) + 
                            (bitcoinAmount * price)) / newAmount;
        
        await db.prepare(`
          UPDATE portfolio 
          SET amount = ?, avg_price = ?, current_price = ?, 
              total_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newAmount, newAvgPrice, price, newAmount * price, existing.id);
      } else {
        await db.prepare(`
          INSERT INTO portfolio (
            id, user_id, symbol, amount, avg_price, current_price,
            total_value, exchange
          ) VALUES (?, ?, 'BTC/USDT', ?, ?, ?, ?, 'tradebitco')
        `).run(
          generateUUID(), userId, bitcoinAmount, price, price, 
          bitcoinAmount * price
        );
      }
    } catch (error) {
      logger.error('Credit Bitcoin error:', error);
      throw error;
    }
  }

  getBankName(bankCode) {
    const bankCodes = {
      'SBIN': 'State Bank of India',
      'HDFC': 'HDFC Bank',
      'ICIC': 'ICICI Bank',
      'UTIB': 'Axis Bank',
      'KKBK': 'Kotak Mahindra Bank',
      'YESB': 'Yes Bank',
      'INDB': 'IndusInd Bank',
      'PUNB': 'Punjab National Bank',
      'BARB': 'Bank of Baroda',
      'CNRB': 'Canara Bank'
    };
    return bankCodes[bankCode] || 'Unknown Bank';
  }

  generateUPIId() {
    return `tradebitco.${Date.now()}@payu`;
  }

  generateQRCode(upiId, amount) {
    // Generate UPI QR code data
    return `upi://pay?pa=${upiId}&pn=TradeBitco.in&am=${amount}&cu=INR&tn=Bitcoin Purchase`;
  }

  async getCurrentBitcoinPrice() {
    try {
      // Get current Bitcoin price
      const TradingService = require('./TradingService');
      const tradingService = new TradingService();
      const priceData = await tradingService.getCurrentPrice('BTC/USDT', 'binance');
      return priceData.price;
    } catch (error) {
      logger.error('Get Bitcoin price error:', error);
      return 67500; // Fallback price
    }
  }
}

module.exports = BankingService;