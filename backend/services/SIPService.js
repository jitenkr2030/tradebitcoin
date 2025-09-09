const db = require('../config/database');
const TradingService = require('./TradingService');
const PaymentService = require('./PaymentService');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

class SIPService {
  constructor() {
    this.tradingService = new TradingService();
    this.paymentService = new PaymentService();
    this.initializeScheduler();
  }

  initializeScheduler() {
    // Run SIP execution check every hour
    setInterval(() => {
      this.processPendingSIPs();
    }, 60 * 60 * 1000);

    // Initial check on startup
    setTimeout(() => {
      this.processPendingSIPs();
    }, 5000);
  }

  async processPendingSIPs() {
    try {
      const now = new Date();
      const pendingSIPs = await db.prepare(`
        SELECT sp.*, ba.account_number, ba.bank_name, u.email, u.name
        FROM sip_plans sp
        JOIN bank_accounts ba ON sp.bank_account_id = ba.id
        JOIN users u ON sp.user_id = u.id
        WHERE sp.status = 'ACTIVE' 
        AND sp.next_execution <= ?
        AND sp.is_active = 1
      `).all(now.toISOString());

      logger.info(`Processing ${pendingSIPs.length} pending SIP investments`);

      for (const sip of pendingSIPs) {
        try {
          await this.executeSIPInvestment(sip);
        } catch (error) {
          logger.error(`SIP execution failed for ${sip.id}:`, error);
          await this.handleSIPFailure(sip, error.message);
        }
      }
    } catch (error) {
      logger.error('Process pending SIPs error:', error);
    }
  }

  async executeSIPInvestment(sipPlan) {
    try {
      const transactionId = generateUUID();
      
      // Get current Bitcoin price
      const priceData = await this.tradingService.getCurrentPrice('BTC/USDT', 'binance');
      const currentPrice = priceData.price;
      
      // Calculate Bitcoin amount to purchase
      const bitcoinAmount = parseFloat(sipPlan.amount) / currentPrice;
      
      // Process payment
      const paymentResult = await this.paymentService.processAutoDebit(
        sipPlan.user_id,
        sipPlan.bank_account_id,
        sipPlan.amount,
        `SIP Investment - ${sipPlan.id}`
      );

      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.message}`);
      }

      // Execute Bitcoin purchase
      const tradeResult = await this.tradingService.executeTrade(sipPlan.user_id, {
        type: 'BUY',
        symbol: 'BTC/USDT',
        amount: bitcoinAmount,
        price: currentPrice,
        exchange: 'binance',
        strategyId: 'sip',
        orderType: 'MARKET'
      });

      // Record SIP transaction
      await db.prepare(`
        INSERT INTO sip_transactions (
          id, sip_plan_id, user_id, amount_inr, bitcoin_amount,
          bitcoin_price, transaction_fee, payment_id, trade_id,
          status, execution_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
      `).run(
        transactionId,
        sipPlan.id,
        sipPlan.user_id,
        sipPlan.amount,
        bitcoinAmount,
        currentPrice,
        tradeResult.fee || 0,
        paymentResult.paymentId,
        tradeResult.id,
        new Date().toISOString()
      );

      // Update SIP plan statistics
      const newTotalInvested = parseFloat(sipPlan.total_invested) + parseFloat(sipPlan.amount);
      const newTotalBitcoin = parseFloat(sipPlan.total_bitcoin) + bitcoinAmount;
      const newAveragePrice = newTotalInvested / newTotalBitcoin;
      const nextExecution = this.calculateNextExecution(sipPlan);

      await db.prepare(`
        UPDATE sip_plans 
        SET total_invested = ?, total_bitcoin = ?, average_price = ?,
            next_execution = ?, last_execution = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        newTotalInvested,
        newTotalBitcoin,
        newAveragePrice,
        nextExecution,
        new Date().toISOString(),
        sipPlan.id
      );

      // Check if goal is achieved
      await this.checkGoalAchievement(sipPlan.id);

      // Send success notification
      await this.sendSIPNotification(sipPlan.user_id, 'SIP_SUCCESS', {
        amount: sipPlan.amount,
        bitcoinAmount: bitcoinAmount.toFixed(8),
        price: currentPrice
      });

      logger.info(`SIP executed successfully: ${sipPlan.id}, Amount: ₹${sipPlan.amount}, BTC: ${bitcoinAmount}`);

      return {
        transactionId,
        bitcoinAmount,
        currentPrice,
        totalInvested: newTotalInvested,
        totalBitcoin: newTotalBitcoin,
        averagePrice: newAveragePrice
      };
    } catch (error) {
      logger.error('Execute SIP investment error:', error);
      throw error;
    }
  }

  calculateNextExecution(sipPlan) {
    const startDate = new Date(sipPlan.start_date || sipPlan.next_execution);
    const frequency = sipPlan.frequency;
    
    let nextDate = new Date(startDate);
    
    switch (frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    
    // Ensure execution happens during market hours (9 AM to 6 PM IST)
    nextDate.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
    
    return nextDate.toISOString();
  }

  async calculateSIPPerformance(sipId) {
    try {
      const sipPlan = await db.prepare('SELECT * FROM sip_plans WHERE id = ?').get(sipId);
      if (!sipPlan) return null;

      const currentPrice = await this.tradingService.getCurrentPrice('BTC/USDT', 'binance');
      const currentValue = parseFloat(sipPlan.total_bitcoin) * currentPrice.price;
      const totalInvested = parseFloat(sipPlan.total_invested);
      
      const absoluteReturn = currentValue - totalInvested;
      const percentageReturn = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0;
      
      // Calculate XIRR (Extended Internal Rate of Return)
      const transactions = await db.prepare(`
        SELECT amount_inr, execution_date FROM sip_transactions 
        WHERE sip_plan_id = ? AND status = 'COMPLETED'
        ORDER BY execution_date ASC
      `).all(sipId);

      const xirr = this.calculateXIRR(transactions, currentValue);

      return {
        totalInvested,
        currentValue,
        absoluteReturn,
        percentageReturn,
        xirr,
        averagePrice: parseFloat(sipPlan.average_price),
        totalBitcoin: parseFloat(sipPlan.total_bitcoin)
      };
    } catch (error) {
      logger.error('Calculate SIP performance error:', error);
      return null;
    }
  }

  async getSIPRecommendations(userId) {
    try {
      const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      const existingSIPs = await db.prepare(`
        SELECT * FROM sip_plans WHERE user_id = ? AND status = 'ACTIVE'
      `).all(userId);

      const recommendations = [];

      // First SIP recommendation
      if (existingSIPs.length === 0) {
        recommendations.push({
          type: 'FIRST_SIP',
          title: 'Start Your Bitcoin SIP Journey',
          description: 'Begin with ₹1,000 monthly SIP to build your Bitcoin portfolio systematically',
          suggestedAmount: 1000,
          suggestedFrequency: 'MONTHLY',
          reasoning: 'Perfect starting amount for beginners with manageable risk',
          priority: 'HIGH'
        });
      }

      // Amount optimization
      const totalSIPAmount = existingSIPs.reduce((sum, sip) => {
        const monthlyEquivalent = this.convertToMonthlyAmount(sip.amount, sip.frequency);
        return sum + monthlyEquivalent;
      }, 0);

      if (totalSIPAmount < 5000 && user.risk_profile !== 'CONSERVATIVE') {
        recommendations.push({
          type: 'INCREASE_AMOUNT',
          title: 'Consider Increasing Your SIP Amount',
          description: 'Based on your risk profile, you could invest more to accelerate wealth building',
          suggestedAmount: Math.min(totalSIPAmount * 1.5, 10000),
          reasoning: 'Higher amounts can lead to better long-term wealth accumulation',
          priority: 'MEDIUM'
        });
      }

      // Frequency optimization based on market volatility
      const marketVolatility = await this.getMarketVolatility();
      if (marketVolatility > 0.6) {
        recommendations.push({
          type: 'FREQUENCY_CHANGE',
          title: 'Consider Daily SIP During High Volatility',
          description: 'Daily SIPs can better average out prices during volatile periods',
          suggestedFrequency: 'DAILY',
          reasoning: 'High market volatility detected, daily averaging recommended',
          priority: 'MEDIUM'
        });
      }

      // Goal-based recommendations
      if (!existingSIPs.some(sip => sip.goal_type === 'TARGET_AMOUNT')) {
        recommendations.push({
          type: 'SET_GOAL',
          title: 'Set Investment Goals',
          description: 'Define clear investment targets to stay motivated and track progress',
          suggestedGoal: 1000000, // ₹10 Lakh
          reasoning: 'Goal-based investing improves discipline and success rates',
          priority: 'LOW'
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Get SIP recommendations error:', error);
      throw error;
    }
  }

  async getSIPAnalytics(sipId, userId) {
    try {
      const sipPlan = await db.prepare(`
        SELECT * FROM sip_plans WHERE id = ? AND user_id = ?
      `).get(sipId, userId);

      if (!sipPlan) {
        throw new Error('SIP plan not found');
      }

      const transactions = await db.prepare(`
        SELECT * FROM sip_transactions 
        WHERE sip_plan_id = ? AND status = 'COMPLETED'
        ORDER BY execution_date ASC
      `).all(sipId);

      const performance = await this.calculateSIPPerformance(sipId);
      
      // Calculate monthly breakdown
      const monthlyBreakdown = this.calculateMonthlyBreakdown(transactions);
      
      // Calculate investment consistency
      const consistency = this.calculateInvestmentConsistency(sipPlan, transactions);
      
      // Market comparison
      const marketComparison = await this.calculateMarketComparison(sipPlan, transactions);

      return {
        sipPlan,
        performance,
        transactions,
        monthlyBreakdown,
        consistency,
        marketComparison,
        projections: this.calculateFutureProjections(sipPlan, performance)
      };
    } catch (error) {
      logger.error('Get SIP analytics error:', error);
      throw error;
    }
  }

  // Helper methods
  convertToMonthlyAmount(amount, frequency) {
    switch (frequency) {
      case 'DAILY': return amount * 30;
      case 'WEEKLY': return amount * 4.33;
      case 'MONTHLY': return amount;
      default: return amount;
    }
  }

  async getMarketVolatility() {
    try {
      const ohlcv = await this.tradingService.getOHLCV('BTC/USDT', '1d', 30);
      const prices = ohlcv.map(candle => candle.close);
      
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
      
      const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
      
      return Math.sqrt(variance) * Math.sqrt(365); // Annualized volatility
    } catch (error) {
      logger.error('Get market volatility error:', error);
      return 0.5; // Default volatility
    }
  }

  calculateXIRR(transactions, currentValue) {
    // Simplified XIRR calculation
    if (transactions.length === 0) return 0;
    
    const totalInvested = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount_inr), 0);
    const totalReturn = (currentValue - totalInvested) / totalInvested;
    
    // Annualize based on investment period
    const firstInvestment = new Date(transactions[0].execution_date);
    const daysDiff = (new Date() - firstInvestment) / (1000 * 60 * 60 * 24);
    const years = daysDiff / 365;
    
    return years > 0 ? (Math.pow(1 + totalReturn, 1/years) - 1) * 100 : 0;
  }

  calculateMonthlyBreakdown(transactions) {
    const breakdown = {};
    
    transactions.forEach(tx => {
      const month = tx.execution_date.substring(0, 7); // YYYY-MM
      if (!breakdown[month]) {
        breakdown[month] = {
          month,
          totalInvested: 0,
          bitcoinPurchased: 0,
          averagePrice: 0,
          transactionCount: 0
        };
      }
      
      breakdown[month].totalInvested += parseFloat(tx.amount_inr);
      breakdown[month].bitcoinPurchased += parseFloat(tx.bitcoin_amount);
      breakdown[month].transactionCount += 1;
    });

    // Calculate average prices
    Object.values(breakdown).forEach(month => {
      month.averagePrice = month.totalInvested / month.bitcoinPurchased;
    });

    return Object.values(breakdown).sort((a, b) => a.month.localeCompare(b.month));
  }

  calculateInvestmentConsistency(sipPlan, transactions) {
    const startDate = new Date(sipPlan.start_date);
    const now = new Date();
    const expectedTransactions = this.calculateExpectedTransactions(sipPlan, startDate, now);
    const actualTransactions = transactions.length;
    
    return {
      consistencyScore: (actualTransactions / expectedTransactions) * 100,
      expectedTransactions,
      actualTransactions,
      missedTransactions: expectedTransactions - actualTransactions
    };
  }

  calculateExpectedTransactions(sipPlan, startDate, endDate) {
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    
    switch (sipPlan.frequency) {
      case 'DAILY': return Math.floor(daysDiff);
      case 'WEEKLY': return Math.floor(daysDiff / 7);
      case 'MONTHLY': return Math.floor(daysDiff / 30);
      default: return 0;
    }
  }

  async calculateMarketComparison(sipPlan, transactions) {
    try {
      // Compare SIP performance vs lump sum investment
      const firstTransaction = transactions[0];
      if (!firstTransaction) return null;

      const initialPrice = parseFloat(firstTransaction.bitcoin_price);
      const currentPrice = await this.tradingService.getCurrentPrice('BTC/USDT', 'binance');
      
      const totalInvested = parseFloat(sipPlan.total_invested);
      const lumpSumBitcoin = totalInvested / initialPrice;
      const lumpSumCurrentValue = lumpSumBitcoin * currentPrice.price;
      
      const sipCurrentValue = parseFloat(sipPlan.total_bitcoin) * currentPrice.price;
      
      return {
        sipValue: sipCurrentValue,
        lumpSumValue: lumpSumCurrentValue,
        sipAdvantage: sipCurrentValue - lumpSumValue,
        sipAdvantagePercent: ((sipCurrentValue - lumpSumValue) / lumpSumValue) * 100
      };
    } catch (error) {
      logger.error('Calculate market comparison error:', error);
      return null;
    }
  }

  calculateFutureProjections(sipPlan, performance) {
    if (!performance) return null;

    const monthlyAmount = this.convertToMonthlyAmount(sipPlan.amount, sipPlan.frequency);
    const currentXIRR = performance.xirr / 100;
    
    // Project 1, 3, 5 year scenarios
    const projections = [];
    
    [1, 3, 5].forEach(years => {
      const totalMonths = years * 12;
      const totalInvestment = monthlyAmount * totalMonths;
      
      // Conservative, moderate, optimistic scenarios
      const scenarios = [
        { name: 'Conservative', annualReturn: 0.15 },
        { name: 'Moderate', annualReturn: 0.25 },
        { name: 'Optimistic', annualReturn: 0.40 }
      ];
      
      const yearProjection = {
        years,
        totalInvestment,
        scenarios: scenarios.map(scenario => {
          const futureValue = this.calculateSIPFutureValue(
            monthlyAmount,
            scenario.annualReturn,
            totalMonths
          );
          
          return {
            name: scenario.name,
            futureValue,
            profit: futureValue - totalInvestment,
            profitPercent: ((futureValue - totalInvestment) / totalInvestment) * 100
          };
        })
      };
      
      projections.push(yearProjection);
    });

    return projections;
  }

  calculateSIPFutureValue(monthlyAmount, annualReturn, months) {
    const monthlyReturn = annualReturn / 12;
    let futureValue = 0;
    
    for (let i = 0; i < months; i++) {
      futureValue = (futureValue + monthlyAmount) * (1 + monthlyReturn);
    }
    
    return futureValue;
  }

  async handleSIPFailure(sipPlan, errorMessage) {
    try {
      // Record failed transaction
      await db.prepare(`
        INSERT INTO sip_transactions (
          id, sip_plan_id, user_id, amount_inr, status, 
          failure_reason, execution_date
        ) VALUES (?, ?, ?, ?, 'FAILED', ?, ?)
      `).run(
        generateUUID(),
        sipPlan.id,
        sipPlan.user_id,
        sipPlan.amount,
        errorMessage,
        new Date().toISOString()
      );

      // Update next execution (retry in 1 hour)
      const nextRetry = new Date();
      nextRetry.setHours(nextRetry.getHours() + 1);
      
      await db.prepare(`
        UPDATE sip_plans 
        SET next_execution = ?, failure_count = failure_count + 1
        WHERE id = ?
      `).run(nextRetry.toISOString(), sipPlan.id);

      // Send failure notification
      await this.sendSIPNotification(sipPlan.user_id, 'SIP_FAILED', {
        amount: sipPlan.amount,
        reason: errorMessage,
        nextRetry: nextRetry.toISOString()
      });

      // Pause SIP if too many failures
      const failureCount = await db.prepare(`
        SELECT failure_count FROM sip_plans WHERE id = ?
      `).get(sipPlan.id);

      if (failureCount.failure_count >= 3) {
        await db.prepare(`
          UPDATE sip_plans SET status = 'PAUSED' WHERE id = ?
        `).run(sipPlan.id);

        await this.sendSIPNotification(sipPlan.user_id, 'SIP_PAUSED', {
          reason: 'Multiple consecutive failures'
        });
      }
    } catch (error) {
      logger.error('Handle SIP failure error:', error);
    }
  }

  async checkGoalAchievement(sipId) {
    try {
      const sipPlan = await db.prepare('SELECT * FROM sip_plans WHERE id = ?').get(sipId);
      if (!sipPlan || !sipPlan.goal_amount) return;

      const currentValue = await this.getCurrentValue(sipId);
      
      if (currentValue >= parseFloat(sipPlan.goal_amount)) {
        await db.prepare(`
          UPDATE sip_plans SET status = 'GOAL_ACHIEVED' WHERE id = ?
        `).run(sipId);

        await this.sendSIPNotification(sipPlan.user_id, 'GOAL_ACHIEVED', {
          goalAmount: sipPlan.goal_amount,
          currentValue: currentValue
        });
      }
    } catch (error) {
      logger.error('Check goal achievement error:', error);
    }
  }

  async getCurrentValue(sipId) {
    try {
      const sipPlan = await db.prepare('SELECT total_bitcoin FROM sip_plans WHERE id = ?').get(sipId);
      const currentPrice = await this.tradingService.getCurrentPrice('BTC/USDT', 'binance');
      
      return parseFloat(sipPlan.total_bitcoin) * currentPrice.price;
    } catch (error) {
      logger.error('Get current value error:', error);
      return 0;
    }
  }

  async getTotalInvested(sipId) {
    try {
      const result = await db.prepare(`
        SELECT SUM(amount_inr) as total FROM sip_transactions 
        WHERE sip_plan_id = ? AND status = 'COMPLETED'
      `).get(sipId);
      
      return parseFloat(result.total || 0);
    } catch (error) {
      logger.error('Get total invested error:', error);
      return 0;
    }
  }

  async sendSIPNotification(userId, type, data) {
    try {
      // Implementation would integrate with notification service
      logger.info(`SIP notification sent: ${type} to user ${userId}`);
    } catch (error) {
      logger.error('Send SIP notification error:', error);
    }
  }
}

module.exports = SIPService;