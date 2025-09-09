import React, { useState, useEffect } from 'react';
import { Brain, Star, Download, ShoppingCart, Code, Zap, TrendingUp, Award } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  description: string;
  author: string;
  category: 'PREDICTION' | 'SENTIMENT' | 'ARBITRAGE' | 'RISK' | 'PORTFOLIO';
  price: number;
  rating: number;
  downloads: number;
  accuracy: number;
  performance: number;
  lastUpdated: string;
  tags: string[];
  preview: boolean;
}

interface AIStrategy {
  id: string;
  name: string;
  description: string;
  creator: string;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  price: number;
  subscribers: number;
  verified: boolean;
}

function AIMarketplace() {
  const [activeTab, setActiveTab] = useState<'models' | 'strategies' | 'myAI'>('models');
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [aiStrategies, setAIStrategies] = useState<AIStrategy[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchAIModels();
    fetchAIStrategies();
  }, []);

  const fetchAIModels = async () => {
    const mockModels: AIModel[] = [
      {
        id: '1',
        name: 'Bitcoin Price Predictor Pro',
        description: 'Advanced LSTM model for Bitcoin price prediction with 85% accuracy',
        author: 'CryptoAI Labs',
        category: 'PREDICTION',
        price: 299,
        rating: 4.8,
        downloads: 1250,
        accuracy: 85.2,
        performance: 92.1,
        lastUpdated: '2024-12-01',
        tags: ['LSTM', 'Deep Learning', 'Bitcoin', 'Prediction'],
        preview: true
      },
      {
        id: '2',
        name: 'Multi-Source Sentiment Analyzer',
        description: 'Real-time sentiment analysis from Twitter, Reddit, and news sources',
        author: 'SentimentAI',
        category: 'SENTIMENT',
        price: 199,
        rating: 4.6,
        downloads: 890,
        accuracy: 78.9,
        performance: 88.5,
        lastUpdated: '2024-11-28',
        tags: ['NLP', 'Sentiment', 'Social Media', 'News'],
        preview: true
      },
      {
        id: '3',
        name: 'Cross-Exchange Arbitrage Bot',
        description: 'Automated arbitrage opportunities detection across 15+ exchanges',
        author: 'ArbitrageAI',
        category: 'ARBITRAGE',
        price: 499,
        rating: 4.9,
        downloads: 567,
        accuracy: 94.3,
        performance: 96.7,
        lastUpdated: '2024-12-02',
        tags: ['Arbitrage', 'Multi-Exchange', 'Automation'],
        preview: false
      }
    ];
    setAIModels(mockModels);
  };

  const fetchAIStrategies = async () => {
    const mockStrategies: AIStrategy[] = [
      {
        id: '1',
        name: 'Quantum Momentum Strategy',
        description: 'AI-powered momentum strategy using quantum computing principles',
        creator: 'QuantumTrader',
        winRate: 78.5,
        totalReturn: 145.8,
        maxDrawdown: 8.2,
        sharpeRatio: 2.4,
        price: 99,
        subscribers: 450,
        verified: true
      },
      {
        id: '2',
        name: 'Neural Network Scalping',
        description: 'High-frequency scalping strategy powered by deep neural networks',
        creator: 'NeuralTrader',
        winRate: 82.1,
        totalReturn: 89.3,
        maxDrawdown: 5.1,
        sharpeRatio: 3.1,
        price: 149,
        subscribers: 320,
        verified: true
      }
    ];
    setAIStrategies(mockStrategies);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'PREDICTION': 'bg-blue-500/20 text-blue-400',
      'SENTIMENT': 'bg-green-500/20 text-green-400',
      'ARBITRAGE': 'bg-purple-500/20 text-purple-400',
      'RISK': 'bg-red-500/20 text-red-400',
      'PORTFOLIO': 'bg-yellow-500/20 text-yellow-400'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const filteredModels = selectedCategory === 'ALL' 
    ? aiModels 
    : aiModels.filter(model => model.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">AI Marketplace</h2>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
              Beta
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('models')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'models' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              AI Models
            </button>
            <button
              onClick={() => setActiveTab('strategies')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'strategies' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              AI Strategies
            </button>
            <button
              onClick={() => setActiveTab('myAI')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'myAI' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              My AI
            </button>
          </div>
        </div>

        {/* Category Filter for Models */}
        {activeTab === 'models' && (
          <div className="flex items-center space-x-2 overflow-x-auto">
            {['ALL', 'PREDICTION', 'SENTIMENT', 'ARBITRAGE', 'RISK', 'PORTFOLIO'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Models Tab */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div key={model.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(model.category)}`}>
                    {model.category}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm">{model.rating}</span>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2">{model.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{model.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-green-400">{model.accuracy}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Performance:</span>
                  <span className="text-blue-400">{model.performance}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Downloads:</span>
                  <span>{model.downloads.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {model.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-purple-400">
                  ${model.price}
                </div>
                <div className="flex items-center space-x-2">
                  {model.preview && (
                    <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                      <Code className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  )}
                  <button className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Strategies Tab */}
      {activeTab === 'strategies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiStrategies.map((strategy) => (
            <div key={strategy.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-bold">{strategy.name}</h3>
                  {strategy.verified && (
                    <Award className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">${strategy.price}/mo</div>
                  <div className="text-xs text-gray-400">{strategy.subscribers} subscribers</div>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">{strategy.description}</p>
              <p className="text-sm text-gray-500 mb-4">by {strategy.creator}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{strategy.winRate}%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">+{strategy.totalReturn}%</div>
                  <div className="text-xs text-gray-400">Total Return</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-400">{strategy.maxDrawdown}%</div>
                  <div className="text-xs text-gray-400">Max Drawdown</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">{strategy.sharpeRatio}</div>
                  <div className="text-xs text-gray-400">Sharpe Ratio</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Subscribe</span>
                </button>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My AI Tab */}
      {activeTab === 'myAI' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Create Your Own AI Models</h3>
            <p className="text-gray-400 mb-6">
              Build and monetize your own AI trading models and strategies
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg flex items-center justify-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Create AI Model</span>
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Create Strategy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIMarketplace;