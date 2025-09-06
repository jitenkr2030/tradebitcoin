const db = require('../config/database');
const logger = require('../utils/logger');
const { calculateSMA, calculateEMA } = require('../utils/helpers');

class RiskManagementService {
  constructor() {
    this.riskThresholds = {
      LOW: { maxDrawdown: 5, maxDailyLoss: 2, maxPositionSize: 10 },
      MEDIUM: { maxDrawdown: 10, maxDailyLoss: 5, maxPositionSize: 20 },
      HIGH: { maxDrawdown: 20, maxDailyLoss: 10, maxPositionSize: 50 }
    };
  }

  async calculateRiskAssessment(userId) {
    try {
      const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      const portfolio = await db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(userId);
      const trades = await db.prepare(`
        SELECT * FROM trades 
        WHERE user_id = ? AND created_at >= date('now', '-30 days')
        ORDER BY created_at DESC
      `).all(userId);

      // Calculate portfolio metrics
      const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
      const totalPnL = portfolio.reduce((sum, asset) => sum + parseFloat(asset.profit_loss || 0), 0);

      // Calculate trading metrics
      const winningTrades = trades.filter(t => parseFloat(t.profit_loss || 0) > 0);
      const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

      // Calculate drawdown
      const dailyReturns = this.calculateDailyReturns(trades);
      const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);

      // Calculate Sharpe ratio
      const sharpeRatio = this.calculateSharpeRatio(dailyReturns);

      // Calculate VaR (Value at Risk)
      const var95 = this.calculateVaR(dailyReturns, 0.95);
      const var99 = this.calculateVaR(dailyReturns, 0.99);

      // Risk score calculation
      const riskScore = this.calculateRiskScore({
        maxDrawdown,
        winRate,
        sharpeRatio,
        portfolioConcentration: this.calculateConcentration(portfolio),
        volatility: this.calculateVolatility(dailyReturns)
      });

      return {
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        metrics: {
          totalValue,
          totalPnL,
          winRate,
          maxDrawdown,
          sharpeRatio,
          var95,
          var99,
          volatility: this.calculateVolatility(dailyReturns),
          concentration: this.calculateConcentration(portfolio)
        },
        recommendations: this.generateRiskRecommendations(riskScore, {
          maxDrawdown,
          winRate,
          concentration: this.calculateConcentration(portfolio)
        })
      };
    } catch (error) {
      logger.error('Calculate risk assessment error:', error);
      throw error;
    }
  }

  calculateDailyReturns(trades) {
    const dailyPnL = {};
    
    trades.forEach(trade => {
      const date = trade.created_at.split('T')[0];
      if (!dailyPnL[date]) dailyPnL[date] = 0;
      dailyPnL[date] += parseFloat(trade.profit_loss || 0);
    });

    return Object.values(dailyPnL);
  }

  calculateMaxDrawdown(returns) {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    returns.forEach(ret => {
      cumulative += ret;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak > 0 ? (peak - cumulative) / peak : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return maxDrawdown * 100;
  }

  calculateSharpeRatio(returns) {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;
  }

  calculateVaR(returns, confidence) {
    if (returns.length === 0) return 0;
    
    const sorted = returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);
    return Math.abs(sorted[index] || 0);
  }

  calculateVolatility(returns) {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  calculateConcentration(portfolio) {
    if (portfolio.length === 0) return 0;
    
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
    const weights = portfolio.map(asset => parseFloat(asset.total_value) / totalValue);
    
    return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  }

  calculateRiskScore(metrics) {
    let score = 50;
    
    if (metrics.maxDrawdown > 20) score += 20;
    else if (metrics.maxDrawdown > 10) score += 10;
    else if (metrics.maxDrawdown < 5) score -= 10;
    
    if (metrics.winRate > 70) score -= 15;
    else if (metrics.winRate < 40) score += 15;
    
    if (metrics.sharpeRatio > 2) score -= 20;
    else if (metrics.sharpeRatio < 0.5) score += 20;
    
    if (metrics.portfolioConcentration > 0.5) score += 15;
    else if (metrics.portfolioConcentration < 0.2) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  getRiskLevel(score) {
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MEDIUM';
    return 'HIGH';
  }

  generateRiskRecommendations(riskScore, metrics) {
    const recommendations = [];
    
    if (metrics.maxDrawdown > 15) {
      recommendations.push({
        type: 'REDUCE_DRAWDOWN',
        priority: 'HIGH',
        message: 'Consider tighter stop-losses to reduce maximum drawdown',
        action: 'Reduce position sizes or implement trailing stops'
      });
    }
    
    if (metrics.winRate < 50) {
      recommendations.push({
        type: 'IMPROVE_STRATEGY',
        priority: 'MEDIUM',
        message: 'Win rate below 50%, consider strategy optimization',
        action: 'Review entry/exit criteria or try different strategies'
      });
    }
    
    if (metrics.concentration > 0.5) {
      recommendations.push({
        type: 'DIVERSIFY',
        priority: 'HIGH',
        message: 'Portfolio is highly concentrated, consider diversification',
        action: 'Spread investments across more assets'
      });
    }
    
    return recommendations;
  }
}

module.exports = RiskManagementService;