import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Users, TrendingUp, Target, Zap, Calendar, BarChart3 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  audience: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  startDate: string;
  endDate: string;
}

interface UserSegment {
  id: string;
  name: string;
  description: string;
  userCount: number;
  criteria: string[];
  avgValue: number;
  conversionRate: number;
}

function MarketingAutomation() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'segments' | 'analytics'>('campaigns');

  useEffect(() => {
    fetchCampaigns();
    fetchSegments();
  }, []);

  const fetchCampaigns = async () => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Bitcoin Bull Run Alert',
        type: 'EMAIL',
        status: 'ACTIVE',
        audience: 'Active Traders',
        sent: 15000,
        opened: 8500,
        clicked: 2100,
        converted: 420,
        revenue: 125000,
        startDate: '2024-12-01',
        endDate: '2024-12-31'
      },
      {
        id: '2',
        name: 'New User Onboarding',
        type: 'IN_APP',
        status: 'ACTIVE',
        audience: 'New Signups',
        sent: 5000,
        opened: 4200,
        clicked: 1800,
        converted: 900,
        revenue: 45000,
        startDate: '2024-11-15',
        endDate: '2025-01-15'
      },
      {
        id: '3',
        name: 'Pro Plan Upgrade',
        type: 'PUSH',
        status: 'COMPLETED',
        audience: 'Free Users',
        sent: 25000,
        opened: 12000,
        clicked: 3000,
        converted: 750,
        revenue: 225000,
        startDate: '2024-11-01',
        endDate: '2024-11-30'
      }
    ];
    setCampaigns(mockCampaigns);
  };

  const fetchSegments = async () => {
    const mockSegments: UserSegment[] = [
      {
        id: '1',
        name: 'High-Value Traders',
        description: 'Users with portfolio value > $10,000',
        userCount: 2500,
        criteria: ['Portfolio Value > $10,000', 'Active in last 7 days', 'Pro/Elite subscription'],
        avgValue: 25000,
        conversionRate: 15.8
      },
      {
        id: '2',
        name: 'New Users (7 days)',
        description: 'Recently registered users',
        userCount: 1200,
        criteria: ['Registered in last 7 days', 'Completed KYC', 'No trades yet'],
        avgValue: 0,
        conversionRate: 8.5
      },
      {
        id: '3',
        name: 'Inactive Traders',
        description: 'Users who haven\'t traded in 30 days',
        userCount: 8900,
        criteria: ['No trades in 30 days', 'Portfolio value > $100', 'Email verified'],
        avgValue: 1500,
        conversionRate: 3.2
      }
    ];
    setSegments(mockSegments);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400';
      case 'PAUSED': return 'bg-yellow-500/20 text-yellow-400';
      case 'DRAFT': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="w-4 h-4" />;
      case 'SMS': return <MessageSquare className="w-4 h-4" />;
      case 'PUSH': return <Zap className="w-4 h-4" />;
      case 'IN_APP': return <Target className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const calculateROI = (campaign: Campaign) => {
    const cost = campaign.sent * 0.1; // Assume $0.1 per message
    return cost > 0 ? ((campaign.revenue - cost) / cost * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">Marketing Automation</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'campaigns' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('segments')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'segments' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Segments
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'analytics' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <Mail className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">45K</div>
            <div className="text-sm text-gray-400">Messages Sent</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">12.5K</div>
            <div className="text-sm text-gray-400">Active Segments</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">8.2%</div>
            <div className="text-sm text-gray-400">Avg Conversion</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <BarChart3 className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">₹3.95L</div>
            <div className="text-sm text-gray-400">Revenue Generated</div>
          </div>
        </div>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(campaign.type)}
                  <div>
                    <h3 className="text-lg font-bold">{campaign.name}</h3>
                    <p className="text-sm text-gray-400">Target: {campaign.audience}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded text-sm ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      {calculateROI(campaign).toFixed(1)}% ROI
                    </div>
                    <div className="text-sm text-gray-400">
                      ₹{campaign.revenue.toLocaleString()} revenue
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{campaign.sent.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Sent</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Open Rate</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {((campaign.clicked / campaign.sent) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Click Rate</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">
                    {((campaign.converted / campaign.sent) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Conversion</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-yellow-400">
                    ₹{(campaign.revenue / campaign.converted).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">Avg Revenue</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <div key={segment.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{segment.name}</h3>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">
                    {segment.userCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Users</div>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">{segment.description}</p>

              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-sm">Criteria:</h4>
                {segment.criteria.map((criterion, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">{criterion}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">
                    ${segment.avgValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Avg Value</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {segment.conversionRate}%
                  </div>
                  <div className="text-xs text-gray-400">Conversion</div>
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                Create Campaign
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Campaign Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Campaigns:</span>
                <span className="font-bold">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Campaigns:</span>
                <span className="font-bold text-green-400">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg Open Rate:</span>
                <span className="font-bold text-blue-400">56.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg Click Rate:</span>
                <span className="font-bold text-purple-400">14.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg Conversion:</span>
                <span className="font-bold text-green-400">8.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Revenue:</span>
                <span className="font-bold text-yellow-400">₹12.5L</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Automation Rules</h3>
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">Welcome Series</span>
                </div>
                <p className="text-sm text-gray-400">
                  Trigger: New user registration → Send welcome email → Wait 24h → Send trading guide
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">Price Alert Follow-up</span>
                </div>
                <p className="text-sm text-gray-400">
                  Trigger: Price alert triggered → Wait 1h → Send trading opportunity notification
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">Re-engagement Campaign</span>
                </div>
                <p className="text-sm text-gray-400">
                  Trigger: No activity for 14 days → Send market update → Offer trading bonus
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingAutomation;