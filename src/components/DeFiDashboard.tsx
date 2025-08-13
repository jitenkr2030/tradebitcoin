import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Coins, TrendingUp, Zap, Shield, ExternalLink } from 'lucide-react';
import { DeFiPosition } from '../types/trading';

function DeFiDashboard() {
  const { user } = useAuth();
  const [defiPositions, setDefiPositions] = useState<DeFiPosition[]>([]);
  const [yieldOpportunities, setYieldOpportunities] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    fetchDeFiPositions();
    fetchYieldOpportunities();
  }, []);

  const fetchDeFiPositions = async () => {
    try {
      const response = await fetch('/api/defi/positions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDefiPositions(data);
      
      const total = data.reduce((sum: number, pos: DeFiPosition) => sum + pos.value, 0);
      const rewards = data.reduce((sum: number, pos: DeFiPosition) => sum + pos.rewards, 0);
      setTotalValue(total);
      setTotalRewards(rewards);
    } catch (error) {
      console.error('Error fetching DeFi positions:', error);
    }
  };

  const fetchYieldOpportunities = async () => {
    try {
      const response = await fetch('/api/defi/opportunities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setYieldOpportunities(data);
    } catch (error) {
      console.error('Error fetching yield opportunities:', error);
    }
  };

  const getProtocolIcon = (protocol: string) => {
    const icons: { [key: string]: string } = {
      'Lido': '🌊',
      'Rocket Pool': '🚀',
      'Uniswap': '🦄',
      'Compound': '🏛️',
      'Aave': '👻',
      'Curve': '🌀'
    };
    return icons[protocol] || '🔗';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STAKING': return 'bg-blue-500/20 text-blue-400';
      case 'LENDING': return 'bg-green-500/20 text-green-400';
      case 'YIELD_FARMING': return 'bg-yellow-500/20 text-yellow-400';
      case 'LIQUIDITY_POOL': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Coins className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold">DeFi Dashboard</h1>
      </div>

      {/* DeFi Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Total DeFi Value</h3>
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            ${totalValue.toLocaleString()}
          </div>
          <p className="text-sm text-gray-400 mt-1">Across all protocols</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Total Rewards</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${totalRewards.toLocaleString()}
          </div>
          <p className="text-sm text-gray-400 mt-1">Earned rewards</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Active Positions</h3>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {defiPositions.length}
          </div>
          <p className="text-sm text-gray-400 mt-1">Across protocols</p>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Active DeFi Positions</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-4 text-gray-400">Protocol</th>
                <th className="pb-4 text-gray-400">Type</th>
                <th className="pb-4 text-gray-400">Asset</th>
                <th className="pb-4 text-gray-400">Amount</th>
                <th className="pb-4 text-gray-400">APY</th>
                <th className="pb-4 text-gray-400">Value</th>
                <th className="pb-4 text-gray-400">Rewards</th>
                <th className="pb-4 text-gray-400">Network</th>
              </tr>
            </thead>
            <tbody>
              {defiPositions.map((position) => (
                <tr key={position.id} className="border-t border-gray-700">
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getProtocolIcon(position.protocol)}</span>
                      <span>{position.protocol}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-sm ${getTypeColor(position.type)}`}>
                      {position.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 font-semibold">{position.asset}</td>
                  <td className="py-4">{position.amount.toFixed(4)}</td>
                  <td className="py-4 text-green-400">{position.apy.toFixed(2)}%</td>
                  <td className="py-4">${position.value.toLocaleString()}</td>
                  <td className="py-4 text-green-400">${position.rewards.toFixed(2)}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-gray-700 rounded text-sm">
                      {position.network}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yield Opportunities */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Top Yield Opportunities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {yieldOpportunities.map((opportunity: any, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getProtocolIcon(opportunity.protocol)}</span>
                  <div>
                    <h3 className="font-semibold">{opportunity.protocol}</h3>
                    <p className="text-sm text-gray-400">{opportunity.asset}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    {opportunity.apy.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400">APY</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className={`px-2 py-1 rounded ${getTypeColor(opportunity.type)}`}>
                    {opportunity.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span>{opportunity.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TVL:</span>
                  <span>${opportunity.tvl?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`${
                    opportunity.riskLevel === 'LOW' ? 'text-green-400' :
                    opportunity.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {opportunity.riskLevel}
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2">
                <span>Invest</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeFiDashboard;