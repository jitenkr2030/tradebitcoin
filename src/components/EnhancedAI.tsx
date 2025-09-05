import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

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

function EnhancedAI() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [whaleActivity, setWhaleActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAIInsights();
    fetchMarketSentiment();
    fetchPredictions();
    fetchWhaleActivity();
  }, []);

  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/v1/ai/insights', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setInsights(data.data || []);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const fetchMarketSentiment = async () => {
    try {
      const response = await fetch('/api/v1/ai/sentiment-analysis', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setSentiment(data.data);
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/v1/ai/predictions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setPredictions(data.data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchWhaleActivity = async () => {
    try {
      const response = await fetch('/api/v1/ai/whale-activity', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setWhaleActivity(data.data || []);
    } catch (error) {
      console.error('Error fetching whale activity:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'ANALYSIS': return <Brain className="w-5 h-5 text-blue-400" />;
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700 rounded-lg p-4"
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
            </motion.div>
          ))}
        </div>
      </div>

      {/* Market Sentiment Analysis */}
      {sentiment && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Eye className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Market Sentiment Analysis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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

            <div>
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
          </div>

          {sentiment.trending.length > 0 && (
            <div className="mt-6">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">{prediction.symbol}</h3>
                <span className="text-sm text-gray-400">{prediction.timeframe}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current:</span>
                  <span>${prediction.currentPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Predicted:</span>
                  <span className={`font-bold ${
                    prediction.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${prediction.predictedPrice?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Change:</span>
                  <span className={`font-bold ${
                    prediction.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {prediction.change > 0 ? '+' : ''}{prediction.change?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className={getConfidenceColor(prediction.confidence)}>
                    {prediction.confidence?.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Whale Activity */}
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
                  <span className={`text-sm ${
                    activity.type === 'LARGE_BUY' ? 'text-green-400' :
                    activity.type === 'LARGE_SELL' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {activity.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{activity.timeAgo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">
                  {activity.amount} {activity.symbol.split('/')[0]} 
                  (${activity.value?.toLocaleString()})
                </span>
                <span className="text-sm text-gray-400">
                  Exchange: {activity.exchange}
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