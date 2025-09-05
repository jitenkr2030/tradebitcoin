import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Target, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface RiskMetrics {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  metrics: {
    totalValue: number;
    totalPnL: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    var95: number;
    var99: number;
    volatility: number;
    concentration: number;
  };
  recommendations: Array<{
    type: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    action: string;
  }>;
}

function RiskManagement() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [riskLimits, setRiskLimits] = useState({
    maxDailyLoss: 5,
    maxPositionSize: 20,
    maxDrawdown: 10,
    stopLossPercent: 2
  });
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    fetchRiskAssessment();
  }, []);

  const fetchRiskAssessment = async () => {
    try {
      const response = await fetch('/api/v1/risk-management/assessment', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setRiskMetrics(data.data);
    } catch (error) {
      console.error('Error fetching risk assessment:', error);
    }
  };

  const updateRiskLimits = async () => {
    try {
      const response = await fetch('/api/v1/risk-management/limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(riskLimits)
      });

      if (response.ok) {
        await fetchRiskAssessment();
      }
    } catch (error) {
      console.error('Error updating risk limits:', error);
    }
  };

  const emergencyStop = async () => {
    try {
      const response = await fetch('/api/v1/risk-management/emergency-stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.ok) {
        setEmergencyMode(true);
        setTimeout(() => setEmergencyMode(false), 5000);
      }
    } catch (error) {
      console.error('Error executing emergency stop:', error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500/20 border-green-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'HIGH': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  if (!riskMetrics) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Risk Management</h2>
          </div>
          <button
            onClick={emergencyStop}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              emergencyMode
                ? 'bg-green-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {emergencyMode ? '✓ Emergency Stop Active' : '🚨 Emergency Stop'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Score */}
          <div className={`rounded-lg p-4 border ${getRiskBgColor(riskMetrics.riskLevel)}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Risk Score</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold mb-2">
              <span className={getRiskColor(riskMetrics.riskLevel)}>
                {riskMetrics.riskScore}/100
              </span>
            </div>
            <div className={`text-sm font-semibold ${getRiskColor(riskMetrics.riskLevel)}`}>
              {riskMetrics.riskLevel} RISK
            </div>
          </div>

          {/* Portfolio Value */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Portfolio Value</h3>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold mb-2">
              ${riskMetrics.metrics.totalValue.toLocaleString()}
            </div>
            <div className={`text-sm ${
              riskMetrics.metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {riskMetrics.metrics.totalPnL >= 0 ? '+' : ''}
              ${Math.abs(riskMetrics.metrics.totalPnL).toLocaleString()} P&L
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Max Drawdown</h3>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold mb-2 text-red-400">
              {riskMetrics.metrics.maxDrawdown.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-400">
              Limit: {riskLimits.maxDrawdown}%
            </div>
          </div>
        </div>
      </div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-2">Win Rate</h3>
          <div className="text-xl font-bold">{riskMetrics.metrics.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-2">Sharpe Ratio</h3>
          <div className="text-xl font-bold">{riskMetrics.metrics.sharpeRatio.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-2">VaR (95%)</h3>
          <div className="text-xl font-bold text-red-400">
            ${riskMetrics.metrics.var95.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm mb-2">Volatility</h3>
          <div className="text-xl font-bold">{(riskMetrics.metrics.volatility * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Risk Limits Configuration */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Risk Limits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">
                Max Daily Loss ({riskLimits.maxDailyLoss}%)
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={riskLimits.maxDailyLoss}
                onChange={(e) => setRiskLimits(prev => ({ 
                  ...prev, 
                  maxDailyLoss: Number(e.target.value) 
                }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">
                Max Position Size ({riskLimits.maxPositionSize}%)
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={riskLimits.maxPositionSize}
                onChange={(e) => setRiskLimits(prev => ({ 
                  ...prev, 
                  maxPositionSize: Number(e.target.value) 
                }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">
                Max Drawdown ({riskLimits.maxDrawdown}%)
              </label>
              <input
                type="range"
                min="2"
                max="30"
                value={riskLimits.maxDrawdown}
                onChange={(e) => setRiskLimits(prev => ({ 
                  ...prev, 
                  maxDrawdown: Number(e.target.value) 
                }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">
                Stop Loss ({riskLimits.stopLossPercent}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={riskLimits.stopLossPercent}
                onChange={(e) => setRiskLimits(prev => ({ 
                  ...prev, 
                  stopLossPercent: Number(e.target.value) 
                }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <button
          onClick={updateRiskLimits}
          className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
        >
          Update Risk Limits
        </button>
      </div>

      {/* Risk Recommendations */}
      {riskMetrics.recommendations.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Risk Recommendations</h2>
          
          <div className="space-y-4">
            {riskMetrics.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  rec.priority === 'HIGH' ? 'bg-red-500/10 border-red-500/30' :
                  rec.priority === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`w-5 h-5 ${
                      rec.priority === 'HIGH' ? 'text-red-400' :
                      rec.priority === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                    <span className="font-semibold">{rec.message}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    rec.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    rec.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{rec.action}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskManagement;