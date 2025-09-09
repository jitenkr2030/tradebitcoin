const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createAutoDebitMandate(userId, bankAccountId, amount, frequency) {
    try {
      const bankAccount = await db.prepare(`
        SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?
      `).get(bankAccountId, userId);

      if (!bankAccount) {
        throw new Error('Bank account not found');
      }

      // Create Razorpay subscription
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: this.getPlanId(amount, frequency),
        customer_notify: 1,
        quantity: 1,
        total_count: frequency === 'MONTHLY' ? 120 : frequency === 'WEEKLY' ? 520 : 3650, // Max counts
        addons: [],
        notes: {
          user_id: userId,
          bank_account_id: bankAccountId,
          purpose: 'Bitcoin SIP'
        }
      });

      // Save mandate details
      const mandateId = generateUUID();
      await db.prepare(`
        INSERT INTO payment_mandates (
          id, user_id, bank_account_id, subscription_id, amount,
          frequency, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
      `).run(
        mandateId,
        userId,
        bankAccountId,
        subscription.id,
        amount,
        frequency,
        new Date().toISOString()
      );

      return {
        success: true,
        mandateId,
        subscriptionId: subscription.id,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Create auto-debit mandate error:', error);
      throw error;
    }
  }

  async processAutoDebit(userId, bankAccountId, amount, description) {
    try {
      // In production, this would integrate with actual payment gateway
      // For demo, we'll simulate successful payment
      
      const paymentId = generateUUID();
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Record payment
      await db.prepare(`
        INSERT INTO payments (
          id, user_id, amount, currency, status, payment_method,
          description, gateway_payment_id, created_at
        ) VALUES (?, ?, ?, 'INR', 'COMPLETED', 'AUTO_DEBIT', ?, ?, ?)
      `).run(
        paymentId,
        userId,
        amount,
        description,
        `razorpay_${Date.now()}`,
        new Date().toISOString()
      );

      return {
        success: true,
        paymentId,
        amount,
        status: 'COMPLETED'
      };
    } catch (error) {
      logger.error('Process auto-debit error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async cancelAutoDebitMandate(mandateId) {
    try {
      const mandate = await db.prepare(`
        SELECT * FROM payment_mandates WHERE id = ?
      `).get(mandateId);

      if (!mandate) {
        throw new Error('Mandate not found');
      }

      // Cancel Razorpay subscription
      await this.razorpay.subscriptions.cancel(mandate.subscription_id);

      // Update mandate status
      await db.prepare(`
        UPDATE payment_mandates 
        SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(mandateId);

      return { success: true };
    } catch (error) {
      logger.error('Cancel auto-debit mandate error:', error);
      throw error;
    }
  }

  getPlanId(amount, frequency) {
    // In production, these would be pre-created Razorpay plans
    const planMap = {
      'DAILY': 'plan_daily_bitcoin_sip',
      'WEEKLY': 'plan_weekly_bitcoin_sip',
      'MONTHLY': 'plan_monthly_bitcoin_sip'
    };
    
    return planMap[frequency] || planMap['MONTHLY'];
  }

  async verifyBankAccount(userId, accountNumber, ifscCode, accountHolderName) {
    try {
      // Penny drop verification
      const verificationAmount = Math.floor(Math.random() * 99) + 1; // ₹1-99
      
      const verification = await this.razorpay.payments.create({
        amount: verificationAmount * 100, // Convert to paise
        currency: 'INR',
        method: 'netbanking',
        bank_account: {
          account_number: accountNumber,
          ifsc: ifscCode,
          name: accountHolderName
        },
        description: 'Bank account verification'
      });

      // Save verification details
      const verificationId = generateUUID();
      await db.prepare(`
        INSERT INTO bank_verifications (
          id, user_id, account_number, ifsc_code, verification_amount,
          gateway_payment_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(
        verificationId,
        userId,
        accountNumber,
        ifscCode,
        verificationAmount,
        verification.id,
        new Date().toISOString()
      );

      return {
        success: true,
        verificationId,
        verificationAmount,
        message: `Please confirm the verification amount of ₹${verificationAmount} in your bank account`
      };
    } catch (error) {
      logger.error('Bank account verification error:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;