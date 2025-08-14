const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const sentiment = require('sentiment');

const db = require('../config/database');
const TradingService = require('./TradingService');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.tradingService = new TradingService();
    this.sentimentAnalyzer = new sentiment();
    this.initializeModels();
  }

  async initializeModels() {
    try {
      // Initialize AI models for predictions and analysis
      this.priceModel = tf.sequential({
        layers: [
          tf.layers.lstm({ units: 50, returnSequences: true, inputShape: [30, 5] }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.lstm({ units: 50, returnSequences: false }),
          tf.layers.dense({ units: 1 })
        ]
      });

      this.priceModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError'
      });

      logger.info('AI models initialized successfully');
    } catch (error) {
      logger.error('AI model initialization error:', error);
    }
  }

  async generateRecommendations(userId, symbol = 'BTC/USDT', timeframe = '1h') {
    try {
      // Get user's risk profile and preferences
      const user = await db('users').where({ id: userId }).first();
      const riskProfile = user?.risk_profile || 'MODERATE';

      // Get market data and technical indicators
      const ohlcv = await this.tradingService.getOHLCV(symbol, timeframe, 100);
      const prices = ohlcv.map(candle => candle.close);
      const indicators = this.tradingService.calculateTechnicalIndicators(prices, []);

      // Get price prediction
      const prediction = await this.getPricePrediction(symbol, timeframe);

      // Get market sentiment
      const sentiment = await this.getMarketSentiment(symbol.split('/')[0]);

      // Generate recommendations based on analysis
      const recommendations = [];

      // RSI-based recommendation
      if (indicators.rsi < 30 && prediction.direction === 'UP' && sentiment.score > 0.3) {
        recommendations.push({
          type: 'BUY',
          asset: symbol,
          confidence: Math.min(90, 60 + (30 - indicators.rsi) + prediction.confidence * 20),
          reasoning: `Strong buy signal: RSI oversold (${indicators.rsi.toFixed(2)}), positive sentiment, and AI predicts upward movement`,
          targetPrice: prices[prices.length - 1] * 1.05,
          stopLoss: prices[prices.length - 1] * 0.97,
          timeframe: '1-3 days'
        });
      }

      // MACD-based recommendation
      if (indicators.macd.histogram > 0 && indicators.macd.MACD > indicators.macd.signal) {
        recommendations.push({
          type: 'BUY',
          asset: symbol,
          confidence: Math.min(85, 50 + Math.abs(indicators.macd.histogram) * 10),
          reasoning: `MACD bullish crossover detected with positive histogram`,
          targetPrice: prices[prices.length - 1] * 1.03,
          stopLoss: prices[prices.length - 1] * 0.98,
          timeframe: '2-5 days'
        });
      }

      // Bollinger Bands recommendation
      if (prices[prices.length - 1] < indicators.bollingerBands.lower) {
        recommendations.push({
          type: 'BUY',
          asset: symbol,
          confidence: 70,
          reasoning: `Price below lower Bollinger Band, potential bounce expected`,
          targetPrice: indicators.bollingerBands.middle,
          stopLoss: prices[prices.length - 1] * 0.95,
          timeframe: '1-2 days'
        });
      }

      // Risk-adjusted recommendations
      const adjustedRecommendations = this.adjustForRiskProfile(recommendations, riskProfile);

      return adjustedRecommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      logger.error('Generate recommendations error:', error);
      throw error;
    }
  }

  async processChat(userId, message, context = {}) {
    try {
      const user = await db('users').where({ id: userId }).first();
      
      // Simple rule-based chatbot for crypto queries
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        const symbol = this.extractSymbol(message) || 'BTC/USDT';
        const priceData = await this.tradingService.getCurrentPrice(symbol);
        return `The current price of ${symbol} is $${priceData.price.toLocaleString()}. It's ${priceData.change24h > 0 ? 'up' : 'down'} ${Math.abs(priceData.change24h).toFixed(2)}% in the last 24 hours.`;
      }

      if (lowerMessage.includes('buy') || lowerMessage.includes('invest')) {
        const recommendations = await this.generateRecommendations(userId);
        if (recommendations.length > 0) {
          const topRec = recommendations[0];
          return `Based on current market analysis, I ${topRec.type === 'BUY' ? 'recommend buying' : 'suggest being cautious with'} ${topRec.asset}. Confidence: ${topRec.confidence}%. ${topRec.reasoning}`;
        }
        return "Based on current market conditions, I recommend waiting for better entry opportunities. The market seems uncertain right now.";
      }

      if (lowerMessage.includes('portfolio') || lowerMessage.includes('balance')) {
        const portfolio = await db('portfolio').where({ user_id: userId });
        const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
        return `Your portfolio is currently worth $${totalValue.toLocaleString()}. You have ${portfolio.length} different assets. Would you like me to analyze your portfolio performance?`;
      }

      if (lowerMessage.includes('tax') || lowerMessage.includes('taxes')) {
        return "For crypto taxes in India, you need to pay 30% tax on gains plus 1% TDS on transactions above ₹10,000. I can help you generate tax reports. Would you like me to calculate your tax liability?";
      }

      if (lowerMessage.includes('risk') || lowerMessage.includes('safe')) {
        return `Based on your risk profile (${user?.risk_profile || 'MODERATE'}), I recommend diversifying across 5-8 different cryptocurrencies and never investing more than 5-10% of your total portfolio in any single asset. Would you like personalized risk management advice?`;
      }

      if (lowerMessage.includes('defi') || lowerMessage.includes('yield')) {
        return "DeFi offers great yield opportunities! Current top yields: Lido stETH (~4-5% APY), Compound lending (~2-8% APY), and Uniswap LP pools (5-20% APY but with impermanent loss risk). Would you like me to find the best opportunities for your portfolio?";
      }

      // Default response
      return "I'm TradeBitco AI, your crypto trading assistant! I can help you with:\n\n• Market analysis and price predictions\n• Trading recommendations\n• Portfolio optimization\n• Tax calculations\n• DeFi opportunities\n• Risk management\n\nWhat would you like to know about crypto trading?";
    } catch (error) {
      logger.error('Process chat error:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.";
    }
  }

  async analyzePortfolio(userId) {
    try {
      const portfolio = await db('portfolio').where({ user_id: userId });
      const user = await db('users').where({ id: userId }).first();
      
      if (portfolio.length === 0) {
        return {
          score: 0,
          recommendations: ['Start building your portfolio by making your first investment'],
          riskLevel: 'UNKNOWN',
          diversificationScore: 0
        };
      }

      const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
      const totalProfitLoss = portfolio.reduce((sum, asset) => sum + parseFloat(asset.profit_loss || 0), 0);
      
      // Calculate diversification score
      const diversificationScore = this.calculateDiversificationScore(portfolio);
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(portfolio);
      
      // Generate recommendations
      const recommendations = [];
      
      if (diversificationScore < 5) {
        recommendations.push('Consider diversifying into more assets to reduce risk');
      }
      
      if (riskScore > 7 && user?.risk_profile === 'CONSERVATIVE') {
        recommendations.push('Your portfolio risk is high for a conservative investor. Consider rebalancing.');
      }
      
      const largestPosition = portfolio.reduce((largest, current) => 
        parseFloat(current.total_value) > parseFloat(largest.total_value) ? current : largest
      );
      
      if ((parseFloat(largestPosition.total_value) / totalValue) > 0.5) {
        recommendations.push(`Your ${largestPosition.symbol} position is over 50% of your portfolio. Consider reducing concentration risk.`);
      }

      return {
        score: Math.min(10, diversificationScore + (totalProfitLoss > 0 ? 2 : 0)),
        recommendations,
        riskLevel: riskScore > 7 ? 'HIGH' : riskScore > 4 ? 'MEDIUM' : 'LOW',
        diversificationScore,
        totalValue,
        totalProfitLoss,
        profitLossPercent: totalValue > 0 ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100 : 0
      };
    } catch (error) {
      logger.error('Analyze portfolio error:', error);
      throw error;
    }
  }

  async getMarketSentiment(symbol = 'BTC') {
    try {
      // Simulate sentiment analysis from various sources
      // In production, this would fetch from Twitter API, Reddit API, news APIs, etc.
      
      const sentimentSources = [
        { source: 'Twitter', score: Math.random() * 2 - 1, weight: 0.3 },
        { source: 'Reddit', score: Math.random() * 2 - 1, weight: 0.2 },
        { source: 'News', score: Math.random() * 2 - 1, weight: 0.3 },
        { source: 'Technical', score: Math.random() * 2 - 1, weight: 0.2 }
      ];

      const weightedScore = sentimentSources.reduce((sum, source) => 
        sum + (source.score * source.weight), 0
      );

      const normalizedScore = (weightedScore + 1) / 2; // Convert to 0-1 range

      return {
        score: normalizedScore,
        label: normalizedScore > 0.6 ? 'Bullish' : normalizedScore < 0.4 ? 'Bearish' : 'Neutral',
        sources: sentimentSources,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Get market sentiment error:', error);
      throw error;
    }
  }

  async getPricePrediction(symbol = 'BTC/USDT', timeframe = '1h') {
    try {
      const ohlcv = await this.tradingService.getOHLCV(symbol, timeframe, 100);
      const prices = ohlcv.map(candle => candle.close);
      
      if (prices.length < 30) {
        throw new Error('Insufficient data for prediction');
      }

      // Simple prediction based on recent trends and technical indicators
      const recentPrices = prices.slice(-10);
      const trend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
      
      const indicators = this.tradingService.calculateTechnicalIndicators(prices, []);
      
      // Combine multiple signals for prediction
      let predictionScore = 0;
      
      // Trend signal
      predictionScore += trend > 0 ? 0.3 : -0.3;
      
      // RSI signal
      if (indicators.rsi < 30) predictionScore += 0.2;
      else if (indicators.rsi > 70) predictionScore -= 0.2;
      
      // MACD signal
      if (indicators.macd.histogram > 0) predictionScore += 0.2;
      else predictionScore -= 0.2;

      const currentPrice = prices[prices.length - 1];
      const predictedChange = predictionScore * 0.05; // Max 5% change prediction
      const predictedPrice = currentPrice * (1 + predictedChange);

      return {
        currentPrice,
        predictedPrice,
        change: predictedChange * 100,
        direction: predictedChange > 0 ? 'UP' : 'DOWN',
        confidence: Math.min(95, Math.abs(predictionScore) * 100 + 50),
        timeframe: '24h',
        factors: {
          trend: trend > 0 ? 'Positive' : 'Negative',
          rsi: indicators.rsi < 30 ? 'Oversold' : indicators.rsi > 70 ? 'Overbought' : 'Neutral',
          macd: indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'
        }
      };
    } catch (error) {
      logger.error('Get price prediction error:', error);
      throw error;
    }
  }

  // Helper methods
  extractSymbol(message) {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK', 'XRP', 'LTC'];
    const found = symbols.find(symbol => 
      message.toUpperCase().includes(symbol)
    );
    return found ? `${found}/USDT` : null;
  }

  adjustForRiskProfile(recommendations, riskProfile) {
    return recommendations.map(rec => {
      let adjustedRec = { ...rec };
      
      switch (riskProfile) {
        case 'CONSERVATIVE':
          adjustedRec.confidence *= 0.8; // Reduce confidence
          adjustedRec.stopLoss = rec.stopLoss * 1.02; // Tighter stop loss
          break;
        case 'AGGRESSIVE':
          adjustedRec.confidence *= 1.1; // Increase confidence
          adjustedRec.targetPrice = rec.targetPrice * 1.02; // Higher targets
          break;
        default: // MODERATE
          // No adjustment needed
          break;
      }
      
      return adjustedRec;
    });
  }

  calculateDiversificationScore(portfolio) {
    if (portfolio.length === 0) return 0;
    
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
    const allocations = portfolio.map(asset => parseFloat(asset.total_value) / totalValue);
    
    // Calculate Herfindahl-Hirschman Index (lower is more diversified)
    const hhi = allocations.reduce((sum, allocation) => sum + Math.pow(allocation, 2), 0);
    
    // Convert to 0-10 score (10 being perfectly diversified)
    return Math.max(0, 10 - hhi * 10);
  }

  calculateRiskScore(portfolio) {
    // Simple risk calculation based on volatility and concentration
    const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.total_value), 0);
    const maxAllocation = Math.max(...portfolio.map(asset => parseFloat(asset.total_value) / totalValue));
    
    // Higher concentration = higher risk
    let riskScore = maxAllocation * 10;
    
    // Add volatility risk (simplified)
    const avgVolatility = portfolio.reduce((sum, asset) => 
      sum + parseFloat(asset.volatility_score || 5), 0
    ) / portfolio.length;
    
    riskScore += avgVolatility;
    
    return Math.min(10, riskScore);
  }
}

module.exports = AIService;