import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { executeTrade } from '../store/slices/tradingSlice';
import { ArrowUpDown, DollarSign } from 'lucide-react';

interface OCOOrderFormProps {
  currentPrice: number;
}

function OCOOrderForm({ currentPrice }: OCOOrderFormProps) {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [stopLimitPrice, setStopLimitPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!amount || !limitPrice || !stopPrice || !stopLimitPrice) return;
    
    // Create OCO order
    dispatch(executeTrade({
      type: 'BUY',
      amount: parseFloat(amount),
      pair: 'BTC/USDT',
      orderType: 'OCO',
      params: {
        limitPrice: parseFloat(limitPrice),
        stopPrice: parseFloat(stopPrice),
        stopLimitPrice: parseFloat(stopLimitPrice)
      }
    }));

    // Reset form
    setAmount('');
    setLimitPrice('');
    setStopPrice('');
    setStopLimitPrice('');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <ArrowUpDown className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">OCO Order</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-2">Amount (BTC)</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.0001"
              min="0"
              className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Limit Price</label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              step="0.01"
              min="0"
              className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={currentPrice.toString()}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Stop Price</label>
            <input
              type="number"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              step="0.01"
              min="0"
              className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={currentPrice.toString()}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Stop Limit Price</label>
          <input
            type="number"
            value={stopLimitPrice}
            onChange={(e) => setStopLimitPrice(e.target.value)}
            step="0.01"
            min="0"
            className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={currentPrice.toString()}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center justify-center"
        >
          Place OCO Order
        </button>
      </form>

      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Order Summary</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>If price reaches</span>
            <span>${limitPrice || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span>Buy</span>
            <span>{amount || '0.00'} BTC</span>
          </div>
          <div className="flex justify-between">
            <span>Stop Loss at</span>
            <span>${stopPrice || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span>Stop Limit at</span>
            <span>${stopLimitPrice || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OCOOrderForm;