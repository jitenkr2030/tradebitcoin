import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTrading } from '../contexts/TradingContext';
import { Shield, Key, CreditCard, Users, Bell, Lock } from 'lucide-react';

function Settings() {
  const { user, enable2FA, updateApiKeys, upgradeSubscription } = useAuth();
  const { tradingState } = useTrading();
  const [exchange, setExchange] = useState('binance');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const handleApiKeyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateApiKeys(exchange, apiKey, apiSecret);
      setApiKey('');
      setApiSecret('');
    } catch (error) {
      console.error('API key update failed:', error);
    }
  };

  const handleSubscriptionUpgrade = async (plan: 'PRO' | 'ENTERPRISE') => {
    try {
      await upgradeSubscription(plan);
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Keys */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Key className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">API Keys</h2>
          </div>
          
          <form onSubmit={handleApiKeyUpdate} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Exchange</label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="binance">Binance</option>
                <option value="coinbase">Coinbase</option>
                <option value="kraken">Kraken</option>
                <option value="bitfinex">Bitfinex</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter API Key"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter API Secret"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Update API Keys
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Security</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Two-Factor Authentication</h3>
                <p className="text-gray-400">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() => enable2FA()}
                className={`px-4 py-2 rounded-lg ${
                  user?.twoFactorEnabled
                    ? 'bg-green-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={user?.twoFactorEnabled}
              >
                {user?.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">API Key Encryption</h3>
                <p className="text-gray-400">Your API keys are encrypted at rest</p>
              </div>
              <span className="text-green-500">Active</span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Subscription</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">Current Plan</h3>
              <p className="text-gray-400">You are currently on the {tradingState.subscription} plan</p>
            </div>
            
            {tradingState.subscription === 'FREE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Pro Plan</h4>
                  <p className="text-gray-400 mb-4">Advanced AI trading strategies</p>
                  <button
                    onClick={() => handleSubscriptionUpgrade('PRO')}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    Upgrade to Pro - $29/month
                  </button>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Enterprise Plan</h4>
                  <p className="text-gray-400 mb-4">Unlimited trading, premium support</p>
                  <button
                    onClick={() => handleSubscriptionUpgrade('ENTERPRISE')}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    Upgrade to Enterprise - $99/month
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Referral Program</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">Your Referral Code</h3>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  value={user?.referralCode || ''}
                  readOnly
                  className="flex-1 bg-gray-700 rounded-lg px-4 py-2"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(user?.referralCode || '')}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold">Referral Stats</h3>
              <p className="text-gray-400 mt-2">
                You have referred {user?.referralCount || 0} users
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;