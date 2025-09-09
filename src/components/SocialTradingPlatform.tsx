import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Trophy, Star, TrendingUp, Share2, Heart, MessageCircle } from 'lucide-react';

interface TradingPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
    winRate: number;
  };
  content: string;
  trade?: {
    type: 'BUY' | 'SELL';
    symbol: string;
    price: number;
    amount: number;
    reasoning: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
}

interface TradingCompetition {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  prize: number;
  participants: number;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  leaderboard: Array<{
    rank: number;
    trader: string;
    return: number;
    trades: number;
  }>;
}

function SocialTradingPlatform() {
  const [activeTab, setActiveTab] = useState<'feed' | 'competitions' | 'signals'>('feed');
  const [posts, setPosts] = useState<TradingPost[]>([]);
  const [competitions, setCompetitions] = useState<TradingCompetition[]>([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    fetchSocialFeed();
    fetchCompetitions();
  }, []);

  const fetchSocialFeed = async () => {
    // Mock social trading posts
    const mockPosts: TradingPost[] = [
      {
        id: '1',
        author: {
          name: 'CryptoKing',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
          verified: true,
          followers: 12500,
          winRate: 78.5
        },
        content: 'Just spotted a bullish divergence on BTC 4H chart. RSI showing oversold while price making higher lows. This could be the reversal we\'ve been waiting for! 🚀',
        trade: {
          type: 'BUY',
          symbol: 'BTC/USDT',
          price: 67500,
          amount: 0.5,
          reasoning: 'Bullish divergence + oversold RSI'
        },
        timestamp: '2 hours ago',
        likes: 245,
        comments: 38,
        shares: 12,
        liked: false
      },
      {
        id: '2',
        author: {
          name: 'AITrader',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
          verified: true,
          followers: 8900,
          winRate: 72.3
        },
        content: 'ETH looking strong above $3200 support. Volume is picking up and we might see a move to $3500 soon. Layer 2 adoption is driving fundamentals. 📈',
        timestamp: '4 hours ago',
        likes: 189,
        comments: 25,
        shares: 8,
        liked: true
      }
    ];
    setPosts(mockPosts);
  };

  const fetchCompetitions = async () => {
    const mockCompetitions: TradingCompetition[] = [
      {
        id: '1',
        name: 'Bitcoin Bull Run Challenge',
        description: 'Trade Bitcoin and compete for the highest returns in 30 days',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        prize: 100000,
        participants: 1250,
        status: 'ACTIVE',
        leaderboard: [
          { rank: 1, trader: 'CryptoMaster', return: 45.8, trades: 156 },
          { rank: 2, trader: 'BitcoinBull', return: 38.2, trades: 89 },
          { rank: 3, trader: 'TradingPro', return: 32.1, trades: 203 }
        ]
      },
      {
        id: '2',
        name: 'Altcoin Season Hunt',
        description: 'Find the best performing altcoins and maximize your portfolio',
        startDate: '2024-12-15',
        endDate: '2025-01-15',
        prize: 50000,
        participants: 890,
        status: 'UPCOMING',
        leaderboard: []
      }
    ];
    setCompetitions(mockCompetitions);
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleShare = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
  };

  const submitPost = () => {
    if (!newPost.trim()) return;
    
    // Add new post logic here
    setNewPost('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Social Trading Platform</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'feed' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'competitions' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Competitions
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'signals' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Signals
            </button>
          </div>
        </div>

        {/* Create Post */}
        <div className="bg-gray-700 rounded-lg p-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your trading insights, analysis, or ask questions..."
            className="w-full bg-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 px-3 py-1 bg-gray-600 rounded-lg text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Add Trade</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1 bg-gray-600 rounded-lg text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>Poll</span>
              </button>
            </div>
            <button
              onClick={submitPost}
              disabled={!newPost.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-lg p-6">
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold">{post.author.name}</h3>
                    {post.author.verified && (
                      <Star className="w-4 h-4 text-blue-400 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{post.author.followers.toLocaleString()} followers</span>
                    <span>{post.author.winRate}% win rate</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-300 mb-4">{post.content}</p>

              {/* Trade Details */}
              {post.trade && (
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        post.trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {post.trade.type}
                      </span>
                      <span className="font-bold">{post.trade.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${post.trade.price.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">{post.trade.amount} {post.trade.symbol.split('/')[0]}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{post.trade.reasoning}</p>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{post.shares}</span>
                  </button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
                  Copy Trade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'competitions' && (
        <div className="space-y-6">
          {competitions.map((competition) => (
            <div key={competition.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{competition.name}</h3>
                  <p className="text-gray-400">{competition.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">
                    ₹{competition.prize.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Prize Pool</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{competition.participants}</div>
                  <div className="text-sm text-gray-400">Participants</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{competition.startDate}</div>
                  <div className="text-sm text-gray-400">Start Date</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${
                    competition.status === 'ACTIVE' ? 'text-green-400' :
                    competition.status === 'UPCOMING' ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {competition.status}
                  </div>
                  <div className="text-sm text-gray-400">Status</div>
                </div>
              </div>

              {competition.leaderboard.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span>Leaderboard</span>
                  </h4>
                  <div className="space-y-2">
                    {competition.leaderboard.map((entry) => (
                      <div key={entry.rank} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            entry.rank === 1 ? 'bg-yellow-500 text-black' :
                            entry.rank === 2 ? 'bg-gray-400 text-black' :
                            entry.rank === 3 ? 'bg-orange-500 text-black' : 'bg-gray-600'
                          }`}>
                            {entry.rank}
                          </div>
                          <span className="font-semibold">{entry.trader}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">+{entry.return}%</div>
                          <div className="text-xs text-gray-400">{entry.trades} trades</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className={`w-full mt-4 px-4 py-2 rounded-lg font-semibold ${
                competition.status === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' :
                competition.status === 'UPCOMING' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-gray-600 cursor-not-allowed'
              }`}>
                {competition.status === 'ACTIVE' ? 'Join Competition' :
                 competition.status === 'UPCOMING' ? 'Register Now' : 'Competition Ended'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'signals' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Trading Signals</h3>
          <div className="text-center text-gray-400 py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Premium trading signals coming soon!</p>
            <p className="text-sm mt-2">Get real-time signals from verified traders</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialTradingPlatform;