import React, { useState, useEffect } from 'react';
import { Users, Star, TrendingUp, Shield, Award, Copy, UserCheck } from 'lucide-react';

interface Trader {
  id: string;
  name: string;
  totalFollowers: number;
  totalProfit: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  verifiedTrader: boolean;
  subscriptionFee: number;
  performanceFee: number;
  description: string;
  tradingExperience: number;
}

function CopyTrading() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [allocationPercent, setAllocationPercent] = useState(10);
  const [maxRisk, setMaxRisk] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopTraders();
    fetchFollowing();
  }, []);

  const fetchTopTraders = async () => {
    try {
      const response = await fetch('/api/v1/copy-trading/leaderboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setTraders(data.data || []);
    } catch (error) {
      console.error('Error fetching traders:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await fetch('/api/v1/copy-trading/following', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setFollowing(data.data?.map((f: any) => f.trader_id) || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleFollowTrader = async () => {
    if (!selectedTrader) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/v1/copy-trading/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          traderId: selectedTrader.id,
          allocationPercent,
          maxRiskPercent: maxRisk,
          stopLoss: 10
        })
      });

      if (response.ok) {
        setFollowing(prev => [...prev, selectedTrader.id]);
        setSelectedTrader(null);
      }
    } catch (error) {
      console.error('Error following trader:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (drawdown: number) => {
    if (drawdown <= 5) return 'text-green-400';
    if (drawdown <= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceColor = (profit: number) => {
    if (profit >= 20) return 'text-green-400';
    if (profit >= 10) return 'text-blue-400';
    if (profit >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Users className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold">Copy Trading</h1>
        <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
          Follow Expert Traders
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400">Following</span>
          </div>
          <div className="text-2xl font-bold">{following.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-gray-400">Avg Performance</span>
          </div>
          <div className="text-2xl font-bold text-green-400">+12.5%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400">Risk Score</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">Medium</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400">Top Traders</span>
          </div>
          <div className="text-2xl font-bold">{traders.length}</div>
        </div>
      </div>

      {/* Top Traders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {traders.map((trader) => (
          <div
            key={trader.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer transform hover:scale-105"
            onClick={() => setSelectedTrader(trader)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {trader.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold flex items-center space-x-2">
                    <span>{trader.name}</span>
                    {trader.verifiedTrader && (
                      <Shield className="w-4 h-4 text-blue-400" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-400">{trader.totalFollowers} followers</p>
                </div>
              </div>
              {following.includes(trader.id) && (
                <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Following</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Total Profit</p>
                <p className={`font-bold ${getPerformanceColor(trader.totalProfit)}`}>
                  +{trader.totalProfit.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="font-bold">{trader.winRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Max Drawdown</p>
                <p className={`font-bold ${getRiskColor(trader.maxDrawdown)}`}>
                  {trader.maxDrawdown.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Sharpe Ratio</p>
                <p className="font-bold">{trader.sharpeRatio.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Experience</p>
              <p className="text-sm text-gray-300">{trader.description}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Fee: {trader.subscriptionFee}% + {trader.performanceFee}% profit
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(trader.sharpeRatio) ? 'text-yellow-400 fill-current' : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Follow Trader Modal */}
      {selectedTrader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Follow {selectedTrader.name}</h2>
              <button
                onClick={() => setSelectedTrader(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-400 mb-2">
                  Portfolio Allocation ({allocationPercent}%)
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={allocationPercent}
                  onChange={(e) => setAllocationPercent(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>1%</span>
                  <span>50%</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Max Risk Per Trade ({maxRisk}%)
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>1%</span>
                  <span>20%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Copy Trading Terms:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Subscription Fee: {selectedTrader.subscriptionFee}% monthly</li>
                <li>• Performance Fee: {selectedTrader.performanceFee}% of profits</li>
                <li>• Minimum follow period: 7 days</li>
                <li>• You can stop copying anytime</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedTrader(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleFollowTrader}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>{loading ? 'Following...' : 'Start Copying'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CopyTrading;