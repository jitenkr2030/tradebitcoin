import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Eye, MessageSquare, BarChart3 } from 'lucide-react';

interface AIInsight {
  type: 'OPPORTUNITY' | 'WARNING' | 'ANALYSIS' | 'PREDICTION';
  title: string;
  description: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  actionable: boolean;
}

interface MarketSentiment {
  overall: number;
  sources: {
    twitter: number;
    reddit: number;
    news: number;
    onChain: number;
  };
  trending: string[];
}

interface PricePrediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  change: number;
  confidence: number;
  timeframe: string;
  factors: {
    trend: string;
    rsi: string;
    macd: string;
  };
}

function EnhancedAI() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [predictions, setPredictions] = useState<PricePrediction[]>([]);
  const [whaleActivity, setWhaleActivity] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAIInsights();
    fetchMarketSentiment();
    fetchPredictions();
    fetchWhaleActivity();
  }, []);

  const fetchAIInsights = async () => {
    try {
      // Simulate AI insights
      const mockInsights: AIInsight[] = [
        {
          type: 'OPPORTUNITY',
          title: 'Bitcoin Oversold Signal',
          description: 'RSI indicates oversold conditions with strong support at $65,000',
          confidence: 85,
          impact: 'HIGH',
          timeframe: '24-48 hours',
          actionable: true
        },
        {
          type: 'WARNING',
          title: 'High Volatility Expected',
          description: 'Options data suggests 15% volatility spike in next 72 hours',
          confidence: 78,
          impact: 'MEDIUM',
          timeframe: '3 days',
          actionable: true
        },
        {
          type: 'ANALYSIS',
          title: 'Institutional Accumulation',
          description: 'Large wallet addresses showing accumulation pattern',
          confidence: 92,
          impact: 'HIGH',
          timeframe: '1-2 weeks',
          actionable: false
        }
      ];
      setInsights(mockInsights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const fetchMarketSentiment = async () => {
    try {
      const mockSentiment: MarketSentiment = {
        overall: 0.72,
        sources: {
          twitter: 0.68,
          reddit: 0.75,
          news: 0.71,
          onChain: 0.74
        },
        trending: ['bitcoin', 'bullish', 'hodl', 'altseason', 'defi']
      };
      setSentiment(mockSentiment);
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const mockPredictions: PricePrediction[] = [
        {
          symbol: 'BTC/USDT',
          currentPrice: 67523,
          predictedPrice: 71000,
          change: 5.15,
          confidence: 78,
          timeframe: '7 days',
          factors: {
            trend: 'Bullish',
            rsi: 'Oversold',
            macd: 'Bullish Crossover'
          }
        },
        {
          symbol: 'ETH/USDT',
          currentPrice: 3215,
          predictedPrice: 3450,
          change: 7.31,
          confidence: 82,
          timeframe: '5 days',
          factors: {
            trend: 'Strong Bullish',
            rsi: 'Neutral',
            macd: 'Bullish'
          }
        }
      ];
      setPredictions(mockPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchWhaleActivity = async () => {
    try {
      const mockWhaleActivity = [
        {
          type: 'LARGE_BUY',
          symbol: 'BTC/USDT',
          amount: 150.5,
          value: 10162575,
          exchange: 'Binance',
          timeAgo: '2 minutes ago'
        },
        {
          type: 'LARGE_SELL',
          symbol: 'ETH/USDT',
          amount: 2500,
          value: 8037500,
          exchange: 'Coinbase',
          timeAgo: '15 minutes ago'
        }
      ];
      setWhaleActivity(mockWhaleActivity);
    } catch (error) {
      console.error('Error fetching whale activity:', error);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newMessage = { role: 'user' as const, message: userMessage };
    setChatMessages(prev => [...prev, newMessage]);
    setUserMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'ai', message: data.data.response }]);
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'ANALYSIS': return <BarChart3 className="w-5 h-5 text-blue-400" />;
      case 'PREDICTION': return <Target className="w-5 h-5 text-purple-400" />;
      default: return <Brain className="w-5 h-5 text-gray-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return 'text-green-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">AI Market Insights</h2>
          </div>
          <button
            onClick={fetchAIInsights}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.type)}
                  <span className="font-semibold">{insight.title}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${getConfidenceColor(insight.confidence)}`}>
                    {insight.confidence}%
                  </div>
                  <div className="text-xs text-gray-400">{insight.timeframe}</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">{insight.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  insight.impact === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                  insight.impact === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {insight.impact} Impact
                </span>
                {insight.actionable && (
                  <button className="text-blue-400 text-xs hover:text-blue-300">
                    Take Action →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Sentiment & Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Sentiment */}
        {sentiment && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Eye className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">Market Sentiment</h2>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-4">Overall Sentiment</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        sentiment.overall >= 0.6 ? 'bg-green-500' :
                        sentiment.overall >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sentiment.overall * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`font-bold ${getSentimentColor(sentiment.overall)}`}>
                  {sentiment.overall >= 0.6 ? 'Bullish' :
                   sentiment.overall >= 0.4 ? 'Neutral' : 'Bearish'}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-4">Source Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(sentiment.sources).map(([source, score]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="capitalize text-gray-400">{source}:</span>
                    <span className={`font-semibold ${getSentimentColor(score)}`}>
                      {(score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {sentiment.trending.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Trending Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {sentiment.trending.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price Predictions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold">AI Price Predictions</h2>
          </div>

          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{prediction.symbol}</h3>
                  <span className="text-sm text-gray-400">{prediction.timeframe}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-gray-400 text-sm">Current:</span>
                    <div className="font-bold">${prediction.currentPrice?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Predicted:</span>
                    <div className={`font-bold ${
                      prediction.change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${prediction.predictedPrice?.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${
                    prediction.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {prediction.change > 0 ? '+' : ''}{prediction.change?.toFixed(2)}%
                  </span>
                  <span className={`text-sm ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence?.toFixed(0)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced AI Chat */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold">Enhanced AI Assistant</h2>
        </div>

        <div className="h-96 bg-gray-700 rounded-lg p-4 mb-4 overflow-y-auto">
          {chatMessages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask TradeBitco AI about advanced trading strategies, risk management, or market analysis!</p>
            </div>
          )}
          
          {chatMessages.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-100'
              }`}>
                {msg.message}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block bg-gray-600 text-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span>TradeBitco AI is analyzing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleChatSubmit} className="flex space-x-2">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Ask about advanced strategies, risk management, market analysis..."
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !userMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
          >
            Send
          </button>
        </form>
      </div>

      {/* Whale Activity Monitor */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Eye className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold">Whale Activity Monitor</h2>
        </div>

        <div className="space-y-4">
          {whaleActivity.map((activity, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'LARGE_BUY' ? 'bg-green-500' :
                    activity.type === 'LARGE_SELL' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="font-semibold">{activity.symbol}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    activity.type === 'LARGE_BUY' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'LARGE_SELL' ? 'bg-red-500/20 text-red-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {activity.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{activity.timeAgo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">
                  {activity.amount} {activity.symbol.split('/')[0]} 
                  <span className="text-green-400 ml-2">
                    (${activity.value?.toLocaleString()})
                  </span>
                </span>
                <span className="text-sm text-gray-400">
                  {activity.exchange}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EnhancedAI;