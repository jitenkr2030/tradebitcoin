import React, { useState } from 'react';
import { useTrading } from '../contexts/TradingContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Settings, AlertTriangle } from 'lucide-react';

function Backtesting() {
  const { tradingState, runBacktest } = useTrading();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunBacktest = async () => {
    try {
      setIsRunning(true);
      const backtestResults = await runBacktest(startDate, endDate);
      setResults(backtestResults);
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Backtest Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Backtest Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleRunBacktest}
              disabled={isRunning || !startDate || !endDate}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
                isRunning || !startDate || !endDate
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Play className="w-5 h-5" />
              <span>{isRunning ? 'Running...' : 'Run Backtest'}</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Strategy Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Stop Loss (%)</label>
              <input
                type="number"
                value={tradingState.currentStrategy?.stopLoss}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Take Profit (%)</label>
              <input
                type="number"
                value={tradingState.currentStrategy?.takeProfit}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Trailing Stop</span>
              <span className={tradingState.currentStrategy?.trailingStop ? 'text-green-500' : 'text-red-500'}>
                {tradingState.currentStrategy?.trailingStop ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backtest Results */}
      {results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Initial Balance</span>
                  <span>${results.initialBalance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Final Balance</span>
                  <span>${results.finalBalance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Return</span>
                  <span className={`${results.performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.performance >= 0 ? '+' : ''}{results.performance.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Trading Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Trades</span>
                  <span>{results.totalTrades}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Win Rate</span>
                  <span className={`${results.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.winRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Profit Factor</span>
                  <span>{results.metrics.profitFactor.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Risk Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Sharpe Ratio</span>
                  <span>{results.metrics.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Max Drawdown</span>
                  <span className="text-red-500">
                    {results.metrics.maxDrawdown.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Curve */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Equity Curve</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.trades}>
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
                    dataKey="balance"
                    name="Portfolio Value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade List */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Trade History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-4 text-gray-400">Date</th>
                    <th className="pb-4 text-gray-400">Type</th>
                    <th className="pb-4 text-gray-400">Price</th>
                    <th className="pb-4 text-gray-400">Amount</th>
                    <th className="pb-4 text-gray-400">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades.map((trade, index) => (
                    <tr key={index} className="border-t border-gray-700">
                      <td className="py-4">{new Date(trade.timestamp).toLocaleString()}</td>
                      <td className={`py-4 ${trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.type}
                      </td>
                      <td className="py-4">${trade.price.toLocaleString()}</td>
                      <td className="py-4">{trade.amount} BTC</td>
                      <td className={`py-4 ${trade.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profit > 0 ? '+' : ''}${Math.abs(trade.profit).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Backtesting;