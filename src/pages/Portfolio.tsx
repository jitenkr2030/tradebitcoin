import React, { useState, useEffect } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Settings } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function Portfolio() {
  const { tradingState, rebalancePortfolio } = useTrading();
  const [isRebalancing, setIsRebalancing] = useState(false);

  const handleRebalance = async () => {
    try {
      setIsRebalancing(true);
      await rebalancePortfolio();
    } catch (error) {
      console.error('Portfolio rebalancing failed:', error);
    } finally {
      setIsRebalancing(false);
    }
  };

  const totalValue = tradingState.positions.reduce(
    (sum, position) => sum + position.amount * tradingState.marketData?.price,
    0
  );

  const pieData = tradingState.positions.map((position, index) => ({
    name: `${position.type} ${position.amount} BTC`,
    value: position.amount * tradingState.marketData?.price
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Total Portfolio Value</h3>
          <div className="text-3xl font-bold">${totalValue.toLocaleString()}</div>
          <div className={`flex items-center mt-2 ${tradingState.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {tradingState.profit >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
            <span>{tradingState.profit >= 0 ? '+' : ''}{tradingState.profit.toFixed(2)}%</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Available Balance</h3>
          <div className="text-3xl font-bold">${tradingState.balance.toLocaleString()}</div>
          <div className="text-gray-400 mt-2">Available for trading</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Portfolio Actions</h3>
          </div>
          <button
            onClick={handleRebalance}
            disabled={isRebalancing}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
              isRebalancing ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isRebalancing ? 'animate-spin' : ''}`} />
            <span>{isRebalancing ? 'Rebalancing...' : 'Rebalance Portfolio'}</span>
          </button>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Asset Allocation</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Portfolio Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Positions</span>
              <span>{tradingState.positions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Winning Positions</span>
              <span className="text-green-500">
                {tradingState.positions.filter(p => p.profitLoss > 0).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Losing Positions</span>
              <span className="text-red-500">
                {tradingState.positions.filter(p => p.profitLoss < 0).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Average Position Size</span>
              <span>
                ${(totalValue / tradingState.positions.length || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Position List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-4 text-gray-400">Asset</th>
                <th className="pb-4 text-gray-400">Type</th>
                <th className="pb-4 text-gray-400">Amount</th>
                <th className="pb-4 text-gray-400">Entry Price</th>
                <th className="pb-4 text-gray-400">Current Price</th>
                <th className="pb-4 text-gray-400">P/L</th>
                <th className="pb-4 text-gray-400">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {tradingState.positions.map((position, index) => {
                const currentValue = position.amount * tradingState.marketData?.price;
                const allocation = (currentValue / totalValue) * 100;
                
                return (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="py-4">BTC</td>
                    <td className={`py-4 ${position.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                      {position.type}
                    </td>
                    <td className="py-4">{position.amount} BTC</td>
                    <td className="py-4">${position.price.toLocaleString()}</td>
                    <td className="py-4">${tradingState.marketData?.price.toLocaleString()}</td>
                    <td className={`py-4 ${position.profitLoss > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {position.profitLoss > 0 ? '+' : ''}{position.profitLoss.toFixed(2)}%
                    </td>
                    <td className="py-4">{allocation.toFixed(2)}%</td>
                  </tr>
                );
              })}
              {tradingState.positions.length === 0 && (
                <tr className="border-t border-gray-700">
                  <td colSpan={7} className="py-4 text-center text-gray-400">
                    No positions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;