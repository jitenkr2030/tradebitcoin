import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TradingProvider } from './contexts/TradingContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Backtesting from './pages/Backtesting';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import AIAdvisor from './components/AIAdvisor';
import TaxAssistant from './components/TaxAssistant';
import DeFiDashboard from './components/DeFiDashboard';
import EducationCenter from './components/EducationCenter';
import CopyTrading from './components/CopyTrading';
import AdvancedOrders from './components/AdvancedOrders';
import RiskManagement from './components/RiskManagement';
import EnhancedAI from './components/EnhancedAI';
import ARTradingView from './components/ARTradingView';
import SocialTradingPlatform from './components/SocialTradingPlatform';
import AIMarketplace from './components/AIMarketplace';
import BankingIntegration from './components/BankingIntegration';
import GlobalExpansion from './components/GlobalExpansion';
import MarketingAutomation from './components/MarketingAutomation';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <TradingProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><Dashboard /></PrivateRoute>
                </div>
              } />
              <Route path="/portfolio" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><Portfolio /></PrivateRoute>
                </div>
              } />
              <Route path="/backtesting" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><Backtesting /></PrivateRoute>
                </div>
              } />
              <Route path="/ai-advisor" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><AIAdvisor /></PrivateRoute>
                </div>
              } />
              <Route path="/tax-assistant" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><TaxAssistant /></PrivateRoute>
                </div>
              } />
              <Route path="/defi" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><DeFiDashboard /></PrivateRoute>
                </div>
              } />
              <Route path="/education" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><EducationCenter /></PrivateRoute>
                </div>
              } />
              <Route path="/copy-trading" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><CopyTrading /></PrivateRoute>
                </div>
              } />
              <Route path="/advanced-orders" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><AdvancedOrders currentPrice={67523} symbol="BTC/USDT" /></PrivateRoute>
                </div>
              } />
              <Route path="/risk-management" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><RiskManagement /></PrivateRoute>
                </div>
              } />
              <Route path="/enhanced-ai" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><EnhancedAI /></PrivateRoute>
                </div>
              } />
              <Route path="/ar-trading" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><ARTradingView /></PrivateRoute>
                </div>
              } />
              <Route path="/social-trading" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><SocialTradingPlatform /></PrivateRoute>
                </div>
              } />
              <Route path="/ai-marketplace" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><AIMarketplace /></PrivateRoute>
                </div>
              } />
              <Route path="/banking" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><BankingIntegration /></PrivateRoute>
                </div>
              } />
              <Route path="/global-expansion" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><GlobalExpansion /></PrivateRoute>
                </div>
              } />
              <Route path="/marketing" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><MarketingAutomation /></PrivateRoute>
                </div>
              } />
              <Route path="/settings" element={
                <div className="min-h-screen bg-gray-900 text-white">
                  <Navbar />
                  <PrivateRoute><Settings /></PrivateRoute>
                </div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TradingProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;