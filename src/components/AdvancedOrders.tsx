import React, { useState } from 'react';
import { ArrowUpDown, Clock, Layers, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdvancedOrdersProps {
  currentPrice: number;
  symbol: string;
}

function AdvancedOrders({ currentPrice, symbol }: AdvancedOrdersProps) {
  const [orderType, setOrderType] = useState<'OCO' | 'TWAP' | 'ICEBERG'>('OCO');
  const [formData, setFormData] = useState({
    amount: '',
    limitPrice: '',
    stopPrice: '',
    stopLimitPrice: '',
    duration: '60',
    intervalMinutes: '5',
    visibleAmount: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let endpoint = '';
      let payload = {};

      switch (orderType) {
        case 'OCO':
          endpoint = '/api/v1/advanced-orders/oco';
          payload = {
            symbol,
            amount: parseFloat(formData.amount),
            limitPrice: parseFloat(formData.limitPrice),
            stopPrice: parseFloat(formData.stopPrice),
            stopLimitPrice: parseFloat(formData.stopLimitPrice)
          };
          break;
        case 'TWAP':
          endpoint = '/api/v1/advanced-orders/twap';
          payload = {
            symbol,
            totalAmount: parseFloat(formData.amount),
            duration: parseInt(formData.duration),
            intervalMinutes: parseInt(formData.intervalMinutes)
          };
          break;
        case 'ICEBERG':
          endpoint = '/api/v1/advanced-orders/iceberg';
          payload = {
            symbol,
            totalAmount: parseFloat(formData.amount),
            visibleAmount: parseFloat(formData.visibleAmount),
            price: parseFloat(formData.limitPrice)
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Reset form
        setFormData({
          amount: '',
          limitPrice: '',
          stopPrice: '',
          stopLimitPrice: '',
          duration: '60',
          intervalMinutes: '5',
          visibleAmount: ''
        });
      }
    } catch (error) {
      console.error('Error creating advanced order:', error);
    }
  };

  const orderTypes = [
    { type: 'OCO', icon: ArrowUpDown, label: 'One-Cancels-Other' },
    { type: 'TWAP', icon: Clock, label: 'Time-Weighted Avg' },
    { type: 'ICEBERG', icon: Layers, label: 'Iceberg Order' }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Target className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">Advanced Orders</h2>
      </div>

      {/* Order Type Selector */}
      <div className="flex space-x-2 mb-6">
        {orderTypes.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => setOrderType(type as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              orderType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Common Fields */}
        <div>
          <label className="block text-gray-400 mb-2">Amount ({symbol.split('/')[0]})</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            step="0.0001"
            min="0"
            className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.001"
            required
          />
        </div>

        {/* OCO Specific Fields */}
        {orderType === 'OCO' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Limit Price</label>
                <input
                  type="number"
                  value={formData.limitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, limitPrice: e.target.value }))}
                  step="0.01"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={currentPrice.toString()}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Stop Price</label>
                <input
                  type="number"
                  value={formData.stopPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, stopPrice: e.target.value }))}
                  step="0.01"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={(currentPrice * 0.95).toFixed(2)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Stop Limit Price</label>
              <input
                type="number"
                value={formData.stopLimitPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, stopLimitPrice: e.target.value }))}
                step="0.01"
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={(currentPrice * 0.93).toFixed(2)}
                required
              />
            </div>
          </motion.div>
        )}

        {/* TWAP Specific Fields */}
        {orderType === 'TWAP' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Duration (minutes)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                  <option value="480">8 hours</option>
                  <option value="1440">24 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Interval (minutes)</label>
                <select
                  value={formData.intervalMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, intervalMinutes: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 minute</option>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Iceberg Specific Fields */}
        {orderType === 'ICEBERG' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Visible Amount</label>
                <input
                  type="number"
                  value={formData.visibleAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibleAmount: e.target.value }))}
                  step="0.0001"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Limit Price</label>
                <input
                  type="number"
                  value={formData.limitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, limitPrice: e.target.value }))}
                  step="0.01"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={currentPrice.toString()}
                  required
                />
              </div>
            </div>
          </motion.div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          Create {orderType} Order
        </button>
      </form>

      {/* Order Type Explanations */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
        <h3 className="font-semibold mb-2">Order Type Explanation:</h3>
        {orderType === 'OCO' && (
          <p className="text-sm text-gray-400">
            OCO orders place both a limit order and a stop-limit order simultaneously. 
            When one order executes, the other is automatically cancelled.
          </p>
        )}
        {orderType === 'TWAP' && (
          <p className="text-sm text-gray-400">
            TWAP orders split your large order into smaller chunks executed over time 
            to minimize market impact and achieve better average pricing.
          </p>
        )}
        {orderType === 'ICEBERG' && (
          <p className="text-sm text-gray-400">
            Iceberg orders hide the full order size by only showing small portions 
            in the order book, preventing market manipulation.
          </p>
        )}
      </div>
    </div>
  );
}

export default AdvancedOrders;