import React, { useState, useEffect } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { useAuth } from '../contexts/AuthContext';
import { Brain, TrendingUp, AlertTriangle, Target, MessageCircle } from 'lucide-react';

interface AIRecommendation {
  type: 'BUY' | 'SELL' | 'HOLD';
  asset: string;
  confidence: number;
  reasoning: string;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
}

function AIAdvisor() {
  const { tradingState } = useTrading();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/ai/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newMessage = { role: 'user' as const, message: userMessage };
    setChatMessages(prev => [...prev, newMessage]);
    setUserMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: userMessage, context: tradingState })
      });
      
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'ai', message: data.response }]);
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'SELL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HOLD': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Brain className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold">AI Investment Advisor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">AI Recommendations</h2>
            <button
              onClick={fetchRecommendations}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRecommendationColor(rec.type)}`}>
                      {rec.type}
                    </span>
                    <span className="font-bold">{rec.asset}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${getConfidenceColor(rec.confidence)}`}>
                      {rec.confidence}% Confidence
                    </div>
                    <div className="text-xs text-gray-400">{rec.timeframe}</div>
                  </div>
                </div>

                <p className="text-gray-300 mb-3">{rec.reasoning}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">Target:</span>
                    <span className="text-green-400">${rec.targetPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-gray-400">Stop Loss:</span>
                    <span className="text-red-400">${rec.stopLoss.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chatbot */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Ask TradeBitco AI</h2>
          </div>

          <div className="h-96 bg-gray-700 rounded-lg p-4 mb-4 overflow-y-auto">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ask TradeBitco AI anything about crypto trading, market analysis, or investment strategies!</p>
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
            
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block bg-gray-600 text-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span>TradeBitco AI is thinking...</span>
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
              placeholder="Ask about crypto, trading strategies, market analysis..."
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Portfolio Analysis */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Portfolio Analysis & Suggestions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Risk Assessment</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                user?.riskProfile === 'CONSERVATIVE' ? 'bg-green-500' :
                user?.riskProfile === 'MODERATE' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span>{user?.riskProfile || 'Not Set'}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Based on your trading history and preferences
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Diversification Score</h3>
            <div className="text-2xl font-bold text-blue-400">7.2/10</div>
            <p className="text-sm text-gray-400 mt-2">
              Good diversification across assets
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Next Action</h3>
            <div className="text-green-400 font-semibold">Rebalance Portfolio</div>
            <p className="text-sm text-gray-400 mt-2">
              Consider reducing BTC allocation by 5%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAdvisor;