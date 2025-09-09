import React, { useState, useEffect } from 'react';
import { Globe, MapPin, DollarSign, Users, TrendingUp, Flag } from 'lucide-react';

interface RegionData {
  country: string;
  flag: string;
  currency: string;
  users: number;
  volume: number;
  growth: number;
  status: 'ACTIVE' | 'COMING_SOON' | 'BETA';
  exchanges: string[];
  regulations: {
    legal: boolean;
    kyc: boolean;
    taxCompliant: boolean;
  };
}

interface CurrencyRate {
  currency: string;
  symbol: string;
  rate: number;
  change24h: number;
}

function GlobalExpansion() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('IN');

  useEffect(() => {
    fetchRegionData();
    fetchCurrencyRates();
  }, []);

  const fetchRegionData = async () => {
    const mockRegions: RegionData[] = [
      {
        country: 'India',
        flag: '🇮🇳',
        currency: 'INR',
        users: 125000,
        volume: 2500000000,
        growth: 45.8,
        status: 'ACTIVE',
        exchanges: ['CoinDCX', 'WazirX', 'Binance'],
        regulations: { legal: true, kyc: true, taxCompliant: true }
      },
      {
        country: 'United States',
        flag: '🇺🇸',
        currency: 'USD',
        users: 89000,
        volume: 5200000000,
        growth: 32.1,
        status: 'ACTIVE',
        exchanges: ['Coinbase', 'Kraken', 'Binance.US'],
        regulations: { legal: true, kyc: true, taxCompliant: true }
      },
      {
        country: 'United Kingdom',
        flag: '🇬🇧',
        currency: 'GBP',
        users: 45000,
        volume: 1800000000,
        growth: 28.7,
        status: 'ACTIVE',
        exchanges: ['Binance', 'Kraken', 'Coinbase'],
        regulations: { legal: true, kyc: true, taxCompliant: true }
      },
      {
        country: 'Germany',
        flag: '🇩🇪',
        currency: 'EUR',
        users: 38000,
        volume: 1600000000,
        growth: 35.2,
        status: 'BETA',
        exchanges: ['Binance', 'Kraken', 'Bitpanda'],
        regulations: { legal: true, kyc: true, taxCompliant: true }
      },
      {
        country: 'Japan',
        flag: '🇯🇵',
        currency: 'JPY',
        users: 0,
        volume: 0,
        growth: 0,
        status: 'COMING_SOON',
        exchanges: ['Binance', 'BitFlyer', 'Coincheck'],
        regulations: { legal: true, kyc: true, taxCompliant: false }
      },
      {
        country: 'Singapore',
        flag: '🇸🇬',
        currency: 'SGD',
        users: 0,
        volume: 0,
        growth: 0,
        status: 'COMING_SOON',
        exchanges: ['Binance', 'Coinhako', 'Gemini'],
        regulations: { legal: true, kyc: true, taxCompliant: false }
      }
    ];
    setRegions(mockRegions);
  };

  const fetchCurrencyRates = async () => {
    const mockRates: CurrencyRate[] = [
      { currency: 'USD', symbol: '$', rate: 1.0, change24h: 0 },
      { currency: 'INR', symbol: '₹', rate: 83.25, change24h: -0.15 },
      { currency: 'EUR', symbol: '€', rate: 0.92, change24h: 0.08 },
      { currency: 'GBP', symbol: '£', rate: 0.79, change24h: 0.12 },
      { currency: 'JPY', symbol: '¥', rate: 149.50, change24h: -0.25 },
      { currency: 'SGD', symbol: 'S$', rate: 1.35, change24h: 0.05 }
    ];
    setCurrencyRates(mockRates);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400';
      case 'BETA': return 'bg-yellow-500/20 text-yellow-400';
      case 'COMING_SOON': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Globe className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold">Global Expansion</h2>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
            6 Countries
          </span>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">297K+</div>
            <div className="text-sm text-gray-400">Global Users</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">$11.1B</div>
            <div className="text-sm text-gray-400">Total Volume</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">+38.2%</div>
            <div className="text-sm text-gray-400">Avg Growth</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <Flag className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">4</div>
            <div className="text-sm text-gray-400">Active Regions</div>
          </div>
        </div>

        {/* Currency Rates */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Live Currency Rates (vs USD)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currencyRates.map((rate) => (
              <div key={rate.currency} className="text-center">
                <div className="font-bold">{rate.symbol}{rate.rate.toFixed(2)}</div>
                <div className={`text-xs ${rate.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {rate.change24h >= 0 ? '+' : ''}{rate.change24h.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map((region) => (
          <div
            key={region.country}
            className={`bg-gray-800 rounded-lg p-6 border transition-all cursor-pointer ${
              selectedRegion === region.country.slice(0, 2).toUpperCase()
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedRegion(region.country.slice(0, 2).toUpperCase())}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{region.flag}</span>
                <div>
                  <h3 className="font-bold">{region.country}</h3>
                  <p className="text-sm text-gray-400">{region.currency}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(region.status)}`}>
                {region.status.replace('_', ' ')}
              </span>
            </div>

            {region.status === 'ACTIVE' && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{region.users.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Users</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-400">+{region.growth}%</div>
                    <div className="text-xs text-gray-400">Growth</div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Volume (24h):</p>
                  <p className="font-bold">${(region.volume / 1000000).toFixed(1)}M</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Supported Exchanges:</p>
                  <div className="flex flex-wrap gap-1">
                    {region.exchanges.map((exchange, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-600 rounded text-xs">
                        {exchange}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Legal Status:</span>
                    <span className={region.regulations.legal ? 'text-green-400' : 'text-red-400'}>
                      {region.regulations.legal ? 'Legal' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">KYC Required:</span>
                    <span className={region.regulations.kyc ? 'text-yellow-400' : 'text-green-400'}>
                      {region.regulations.kyc ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Tax Compliant:</span>
                    <span className={region.regulations.taxCompliant ? 'text-green-400' : 'text-yellow-400'}>
                      {region.regulations.taxCompliant ? 'Yes' : 'In Progress'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {region.status === 'COMING_SOON' && (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">Coming Soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  We're working on regulatory approval and local partnerships
                </p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
                  Notify Me
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expansion Roadmap */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6">Expansion Roadmap</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <h4 className="font-semibold">Q4 2024 - India & US Launch</h4>
              <p className="text-sm text-gray-400">Full platform launch with complete feature set</p>
            </div>
            <span className="text-green-400 text-sm font-semibold">COMPLETED</span>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <h4 className="font-semibold">Q1 2025 - European Expansion</h4>
              <p className="text-sm text-gray-400">UK, Germany, France with MiCA compliance</p>
            </div>
            <span className="text-blue-400 text-sm font-semibold">IN PROGRESS</span>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <h4 className="font-semibold">Q2 2025 - Asia Pacific</h4>
              <p className="text-sm text-gray-400">Japan, Singapore, Australia, South Korea</p>
            </div>
            <span className="text-yellow-400 text-sm font-semibold">PLANNED</span>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <div className="flex-1">
              <h4 className="font-semibold">Q3 2025 - Latin America</h4>
              <p className="text-sm text-gray-400">Brazil, Mexico, Argentina</p>
            </div>
            <span className="text-gray-400 text-sm font-semibold">RESEARCH</span>
          </div>
        </div>
      </div>

      {/* Regional Compliance */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6">Regulatory Compliance Status</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-4 text-gray-400">Country</th>
                <th className="pb-4 text-gray-400">Legal Status</th>
                <th className="pb-4 text-gray-400">KYC Required</th>
                <th className="pb-4 text-gray-400">Tax Compliance</th>
                <th className="pb-4 text-gray-400">Local Partnerships</th>
              </tr>
            </thead>
            <tbody>
              {regions.filter(r => r.status !== 'COMING_SOON').map((region) => (
                <tr key={region.country} className="border-t border-gray-700">
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{region.flag}</span>
                      <span>{region.country}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      region.regulations.legal ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {region.regulations.legal ? 'Legal' : 'Restricted'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={region.regulations.kyc ? 'text-yellow-400' : 'text-green-400'}>
                      {region.regulations.kyc ? 'Required' : 'Optional'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={region.regulations.taxCompliant ? 'text-green-400' : 'text-yellow-400'}>
                      {region.regulations.taxCompliant ? 'Compliant' : 'In Progress'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {region.exchanges.slice(0, 2).map((exchange, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-600 rounded text-xs">
                          {exchange}
                        </span>
                      ))}
                      {region.exchanges.length > 2 && (
                        <span className="px-2 py-1 bg-gray-600 rounded text-xs">
                          +{region.exchanges.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GlobalExpansion;