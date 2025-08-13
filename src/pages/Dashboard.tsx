import React, { useState, useEffect } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

function Dashboard() {
  const { tradingState, startTrading, stopTrading, executeManualTrade } = useTrading();
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(0);

  const indicators = tradingState.marketData?.indicators || {
    rsi: 0,
    macd: { MACD: 0, signal: 0, histogram: 0 },
    bollingerBands: { upper: 0, middle: 0, lower: 0 }
  };

  const marketSentiment = tradingState.marketData?.sentimentScore || 0;
  const currentPrice = tradingState.marketData?.price || 0;

  const handleTradeExecution = async (type: 'BUY' | 'SELL') => {
    try {
      await executeManualTrade(type, amount);
      setAmount(0);
    } catch (error) {
      console.error('Trade execution failed:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Trading Status and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Trading Status</h2>
            <div className="flex items-center space-x-2">
              <span className={`h-3 w-3 rounded-full ${tradingState.isTrading ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>{tradingState.isTrading ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={startTrading}
              disabled={tradingState.isTrading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                tradingState.isTrading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Play className="w-5 h-5" />
              <span>Start Trading</span>
            </button>
            
            <button
              onClick={stopTrading}
              disabled={!tradingState.isTrading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                !tradingState.isTrading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Pause className="w-5 h-5" />
              <span>Stop Trading</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Manual Trading</h2>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Amount (BTC)"
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleTradeExecution('BUY')}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg"
            >
              Buy
            </button>
            <button
              onClick={() => handleTradeExecution('SELL')}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg"
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      {/* Market Data and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Market Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Current Price</span>
              <span className="text-xl font-bold">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">24h Change</span>
              <span className={`flex items-center ${tradingState.marketData?.change24h && tradingState.marketData.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tradingState.marketData?.change24h}%
                {tradingState.marketData?.change24h && tradingState.marketData.change24h > 0 ? <TrendingUp className="w-4 h-4 ml-1" /> : <TrendingDown className="w-4 h-4 ml-1" />}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">24h Volume</span>
              <span>${tradingState.marketData?.volume.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Technical Indicators</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">RSI</span>
              <span className={`${
                indicators.rsi > 70 ? 'text-red-500' : indicators.rsi < 30 ? 'text-green-500' : 'text-white'
              }`}>
                {indicators.rsi.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">MACD</span>
              <span className={`${indicators.macd.histogram > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {indicators.macd.MACD.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bollinger Bands</span>
              <div className="text-right">
                <div className="text-sm text-gray-400">Upper: {indicators.bollingerBands.upper.toFixed(2)}</div>
                <div className="text-sm">Middle: {indicators.bollingerBands.middle.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Lower: {indicators.bollingerBands.lower.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Market Sentiment</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Overall Sentiment</span>
              <span className={`${
                marketSentiment > 0.6 ? 'text-green-500' : marketSentiment < 0.4 ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {marketSentiment > 0.6 ? 'Bullish' : marketSentiment < 0.4 ? 'Bearish' : 'Neutral'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  marketSentiment > 0.6 ? 'bg-green-500' : marketSentiment < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${marketSentiment * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Price Chart</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tradingState.marketData?.priceHistory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="timestamp" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Active Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-4 text-gray-400">Type</th>
                <th className="pb-4 text-gray-400">Entry Price</th>
                <th className="pb-4 text-gray-400">Amount</th>
                <th className="pb-4 text-gray-400">Current P/L</th>
                <th className="pb-4 text-gray-400">Stop Loss</th>
                <th className="pb-4 text-gray-400">Take Profit</th>
              </tr>
            </thead>
            <tbody>
              {tradingState.positions.map((position, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className={`py-4 ${position.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                    {position.type}
                  </td>
                  <td className="py-4">${position.price.toLocaleString()}</td>
                  <td className="py-4">{position.amount} BTC</td>
                  <td className={`py-4 ${position.profitLoss > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {position.profitLoss > 0 ? '+' : ''}{position.profitLoss.toFixed(2)}%
                  </td>
                  <td className="py-4">${position.stopLoss?.toLocaleString()}</td>
                  <td className="py-4">${position.takeProfit?.toLocaleString()}</td>
                </tr>
              ))}
              {tradingState.positions.length === 0 && (
                <tr className="border-t border-gray-700">
                  <td colSpan={6} className="py-4 text-center text-gray-400">
                    No active positions
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

export default Dashboard;