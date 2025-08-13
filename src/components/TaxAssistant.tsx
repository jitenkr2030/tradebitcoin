import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, Download, FileText, TrendingDown, AlertCircle } from 'lucide-react';
import { TaxReport } from '../types/trading';

function TaxAssistant() {
  const { user } = useAuth();
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [taxSummary, setTaxSummary] = useState({
    totalGains: 0,
    totalLosses: 0,
    netGains: 0,
    shortTermGains: 0,
    longTermGains: 0,
    taxLiability: 0
  });

  useEffect(() => {
    fetchTaxReports();
    calculateTaxSummary();
  }, [selectedYear]);

  const fetchTaxReports = async () => {
    try {
      const response = await fetch(`/api/tax/reports?year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTaxReports(data);
    } catch (error) {
      console.error('Error fetching tax reports:', error);
    }
  };

  const calculateTaxSummary = async () => {
    try {
      const response = await fetch(`/api/tax/calculate?year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTaxSummary(data);
    } catch (error) {
      console.error('Error calculating tax summary:', error);
    }
  };

  const generateTaxReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/tax/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ year: selectedYear })
      });
      
      if (response.ok) {
        await fetchTaxReports();
        await calculateTaxSummary();
      }
    } catch (error) {
      console.error('Error generating tax report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/tax/download/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${selectedYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getTaxRate = (isShortTerm: boolean) => {
    // Indian tax rates for crypto
    if (user?.taxSettings?.country === 'IN') {
      return isShortTerm ? 30 : 20; // 30% for short-term, 20% for long-term
    }
    return isShortTerm ? 25 : 15; // Default rates
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Calculator className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold">Crypto Tax Assistant</h1>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Total Gains</h3>
            <TrendingDown className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            ₹{taxSummary.totalGains.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Total Losses</h3>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            ₹{taxSummary.totalLosses.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Net Gains</h3>
            <Calculator className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            ₹{taxSummary.netGains.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Tax Liability</h3>
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ₹{taxSummary.taxLiability.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tax Report Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Generate Tax Report</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Tax Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}-{year + 1}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Report Includes:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Capital gains/losses calculation</li>
                <li>• FIFO method for cost basis</li>
                <li>• Short-term vs long-term classification</li>
                <li>• Tax-loss harvesting opportunities</li>
                <li>• IT Return ready format</li>
              </ul>
            </div>

            <button
              onClick={generateTaxReport}
              disabled={isGenerating}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
                isGenerating ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Tax Breakdown</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Short-term Gains</span>
              <span className="text-green-400">₹{taxSummary.shortTermGains.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tax Rate (Short-term)</span>
              <span className="text-yellow-400">{getTaxRate(true)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Long-term Gains</span>
              <span className="text-green-400">₹{taxSummary.longTermGains.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tax Rate (Long-term)</span>
              <span className="text-yellow-400">{getTaxRate(false)}%</span>
            </div>
            <hr className="border-gray-600" />
            <div className="flex justify-between items-center font-bold">
              <span>Total Tax Liability</span>
              <span className="text-red-400">₹{taxSummary.taxLiability.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400">Tax Optimization Tip</span>
            </div>
            <p className="text-sm text-gray-300">
              Consider harvesting losses before year-end to offset gains and reduce tax liability.
            </p>
          </div>
        </div>
      </div>

      {/* Previous Reports */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Previous Reports</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-4 text-gray-400">Year</th>
                <th className="pb-4 text-gray-400">Net Gains</th>
                <th className="pb-4 text-gray-400">Tax Liability</th>
                <th className="pb-4 text-gray-400">Generated</th>
                <th className="pb-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxReports.map((report) => (
                <tr key={report.id} className="border-t border-gray-700">
                  <td className="py-4">{report.year}</td>
                  <td className="py-4">
                    <span className={report.netGains >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ₹{Math.abs(report.netGains).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4">₹{(report.netGains * 0.3).toLocaleString()}</td>
                  <td className="py-4">{new Date(report.generatedAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <button
                      onClick={() => downloadReport(report.id)}
                      className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
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

export default TaxAssistant;