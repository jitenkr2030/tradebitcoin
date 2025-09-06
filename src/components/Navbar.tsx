import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, TrendingUp, Briefcase, Brain, Calculator, Coins, BookOpen, Settings, LogOut, Users, Target, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="bg-gray-800 p-4 border-b border-gray-700">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Bot className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-bold">TradeBitco.in</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <TrendingUp className="w-5 h-5" />
            <span>Trading</span>
          </Link>
          
          <Link to="/portfolio" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Briefcase className="w-5 h-5" />
            <span>Portfolio</span>
          </Link>
          
          <Link to="/ai-advisor" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Brain className="w-5 h-5" />
            <span>AI Advisor</span>
          </Link>
          
          <Link to="/tax-assistant" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Calculator className="w-5 h-5" />
            <span>Tax Assistant</span>
          </Link>
          
          <Link to="/defi" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Coins className="w-5 h-5" />
            <span>DeFi</span>
          </Link>
          
          <Link to="/education" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <BookOpen className="w-5 h-5" />
            <span>Education</span>
          </Link>
          
          <Link to="/copy-trading" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Users className="w-5 h-5" />
            <span>Copy Trading</span>
          </Link>
          
          <Link to="/advanced-orders" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Target className="w-5 h-5" />
            <span>Advanced Orders</span>
          </Link>
          
          <Link to="/risk-management" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Shield className="w-5 h-5" />
            <span>Risk Management</span>
          </Link>
          
          <Link to="/enhanced-ai" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Brain className="w-5 h-5" />
            <span>Enhanced AI</span>
          </Link>
          
          <Link to="/settings" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{user.name || user.email}</div>
              <div className={`text-xs px-2 py-1 rounded ${
                user.subscription === 'ELITE' ? 'bg-purple-500/20 text-purple-400' :
                user.subscription === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {user.subscription}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;