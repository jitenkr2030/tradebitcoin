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
      const losingTrades = trades.filter(t => parseFloat(t.profit_loss || 0) < 0);
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

  async calculatePortfolioRisk(userId) {
    try {
      const portfolio = await db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(userId);
      
      if (portfolio.length === 0) {
        return { riskScore: 0, metrics: {}, recommendations: [] };
      }

      const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
      
      // Calculate correlation matrix
      const correlationMatrix = await this.calculateCorrelationMatrix(portfolio);
      
      // Calculate portfolio beta
      const portfolioBeta = await this.calculatePortfolioBeta(portfolio);
      
      // Calculate diversification ratio
      const diversificationRatio = this.calculateDiversificationRatio(portfolio, correlationMatrix);

      return {
        totalValue,
        portfolioBeta,
        diversificationRatio,
        correlationMatrix,
        concentrationRisk: this.calculateConcentration(portfolio),
        recommendations: this.generatePortfolioRiskRecommendations(portfolio)
      };
    } catch (error) {
      logger.error('Calculate portfolio risk error:', error);
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
      const drawdown = (peak - cumulative) / peak;
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
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  }

  calculateConcentration(portfolio) {
    if (portfolio.length === 0) return 0;
    
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
    const weights = portfolio.map(asset => parseFloat(asset.total_value) / totalValue);
    
    // Herfindahl-Hirschman Index
    return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  }

  calculateRiskScore(metrics) {
    let score = 50; // Base score
    
    // Adjust based on drawdown
    if (metrics.maxDrawdown > 20) score += 20;
    else if (metrics.maxDrawdown > 10) score += 10;
    else if (metrics.maxDrawdown < 5) score -= 10;
    
    // Adjust based on win rate
    if (metrics.winRate > 70) score -= 15;
    else if (metrics.winRate < 40) score += 15;
    
    // Adjust based on Sharpe ratio
    if (metrics.sharpeRatio > 2) score -= 20;
    else if (metrics.sharpeRatio < 0.5) score += 20;
    
    // Adjust based on concentration
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

  generatePortfolioRiskRecommendations(portfolio) {
    const recommendations = [];
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
    
    // Check for over-concentration
    portfolio.forEach(asset => {
      const allocation = parseFloat(asset.total_value) / totalValue;
      if (allocation > 0.4) {
        recommendations.push({
          type: 'REDUCE_CONCENTRATION',
          priority: 'HIGH',
          message: `${asset.symbol} represents ${(allocation * 100).toFixed(1)}% of portfolio`,
          action: `Consider reducing ${asset.symbol} allocation below 30%`
        });
      }
    });
    
    return recommendations;
  }

  async calculateCorrelationMatrix(portfolio) {
    // Simplified correlation calculation
    const correlations = {};
    
    for (let i = 0; i < portfolio.length; i++) {
      for (let j = i + 1; j < portfolio.length; j++) {
        const asset1 = portfolio[i].symbol;
        const asset2 = portfolio[j].symbol;
        
        // In production, this would use historical price data
        const correlation = Math.random() * 2 - 1; // -1 to 1
        correlations[`${asset1}-${asset2}`] = correlation;
      }
    }
    
    return correlations;
  }

  async calculatePortfolioBeta(portfolio) {
    // Simplified beta calculation (vs BTC as market)
    return portfolio.reduce((sum, asset) => {
      const weight = parseFloat(asset.allocation_percent || 0) / 100;
      const assetBeta = asset.symbol === 'BTC' ? 1 : Math.random() * 2; // Simplified
      return sum + (weight * assetBeta);
    }, 0);
  }

  calculateDiversificationRatio(portfolio, correlationMatrix) {
    // Simplified diversification ratio
    const weights = portfolio.map(asset => parseFloat(asset.allocation_percent || 0) / 100);
    const avgCorrelation = Object.values(correlationMatrix).reduce((sum, corr) => sum + Math.abs(corr), 0) / Object.keys(correlationMatrix).length;
    
    return 1 - (avgCorrelation || 0);
  }
}

module.exports = RiskManagementService;