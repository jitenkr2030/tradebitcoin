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