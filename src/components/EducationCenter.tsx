import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Play, Users, Award, Globe } from 'lucide-react';
import { EducationContent } from '../types/trading';

function EducationCenter() {
  const { user } = useAuth();
  const [content, setContent] = useState<EducationContent[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [selectedType, setSelectedType] = useState<'ALL' | 'ARTICLE' | 'VIDEO' | 'WEBINAR' | 'COURSE'>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    fetchEducationContent();
  }, [selectedLevel, selectedType, selectedLanguage]);

  const fetchEducationContent = async () => {
    try {
      const params = new URLSearchParams({
        level: selectedLevel,
        type: selectedType === 'ALL' ? '' : selectedType,
        language: selectedLanguage
      });

      const response = await fetch(`/api/education/content?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error('Error fetching education content:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE': return <BookOpen className="w-5 h-5" />;
      case 'VIDEO': return <Play className="w-5 h-5" />;
      case 'WEBINAR': return <Users className="w-5 h-5" />;
      case 'COURSE': return <Award className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-500/20 text-green-400';
      case 'INTERMEDIATE': return 'bg-yellow-500/20 text-yellow-400';
      case 'ADVANCED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <BookOpen className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold">Crypto Education Center</h1>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="ARTICLE">Articles</option>
              <option value="VIDEO">Videos</option>
              <option value="WEBINAR">Webinars</option>
              <option value="COURSE">Courses</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchEducationContent}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Featured Learning Paths */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Featured Learning Paths</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold">Crypto Basics</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Start your crypto journey with fundamentals of blockchain, Bitcoin, and trading basics.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">12 lessons • 3 hours</span>
              <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">
                Start Learning
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-6 border border-yellow-500/30">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold">Trading Strategies</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Learn advanced trading techniques, technical analysis, and risk management.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">18 lessons • 5 hours</span>
              <button className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm">
                Start Learning
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold">DeFi & Web3</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Explore decentralized finance, yield farming, and Web3 opportunities.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">15 lessons • 4 hours</span>
              <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm">
                Start Learning
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-blue-400">
                {getTypeIcon(item.type)}
                <span className="text-sm font-semibold">{item.type}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getLevelColor(item.level)}`}>
                {item.level}
              </span>
            </div>

            <h3 className="text-lg font-bold mb-2">{item.title}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-3">{item.content}</p>

            <div className="flex items-center justify-between mb-4">
              {item.duration && (
                <span className="text-sm text-gray-400">
                  {formatDuration(item.duration)}
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {item.language === 'hi' ? 'हिंदी' : 'English'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2">
              {item.type === 'VIDEO' ? <Play className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              <span>{item.type === 'VIDEO' ? 'Watch' : 'Read'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Upcoming Webinars */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Upcoming Live Webinars</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Bitcoin Technical Analysis Masterclass</h3>
              <p className="text-gray-400 text-sm">Learn advanced charting techniques and market psychology</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <span>📅 Dec 25, 2024</span>
                <span>🕐 7:00 PM IST</span>
                <span>👨‍🏫 Expert Trader</span>
              </div>
            </div>
            <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg">
              Register Free
            </button>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Crypto Tax Planning for 2024</h3>
              <p className="text-gray-400 text-sm">Navigate Indian crypto tax regulations and optimize your returns</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <span>📅 Dec 28, 2024</span>
                <span>🕐 6:00 PM IST</span>
                <span>👨‍💼 CA Expert</span>
              </div>
            </div>
            <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg">
              Register Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EducationCenter;