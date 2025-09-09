import React, { useState, useEffect } from 'react';
import { CreditCard, Building, Plus, CheckCircle, Clock, AlertTriangle, QrCode } from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  accountType: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  isPrimary: boolean;
}

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  bankName: string;
  createdAt: string;
}

function BankingIntegration() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [qrCode, setQrCode] = useState('');

  const [newAccount, setNewAccount] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    accountType: 'SAVINGS'
  });

  useEffect(() => {
    fetchBankAccounts();
    fetchTransactions();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/v1/banking/accounts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setBankAccounts(data.data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/v1/banking/transactions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setTransactions(data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/banking/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(newAccount)
      });

      if (response.ok) {
        setShowAddAccount(false);
        setNewAccount({
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          bankName: '',
          accountType: 'SAVINGS'
        });
        await fetchBankAccounts();
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/banking/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          bankAccountId: selectedAccount
        })
      });

      const data = await response.json();
      if (response.ok) {
        setQrCode(data.data.qrCode);
      }
    } catch (error) {
      console.error('Error initiating deposit:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'FAILED': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Building className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">Banking Integration</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddAccount(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bank Account</span>
            </button>
            <button
              onClick={() => setShowDeposit(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Deposit Funds
            </button>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((account) => (
            <div key={account.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">{account.bankName}</span>
                </div>
                {getStatusIcon(account.verificationStatus)}
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">
                  Account: {account.accountNumber}
                </div>
                <div className="text-sm text-gray-400">
                  Holder: {account.accountHolderName}
                </div>
                <div className="text-sm text-gray-400">
                  Type: {account.accountType}
                </div>
              </div>
              {account.isPrimary && (
                <div className="mt-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    Primary
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-4 text-gray-400">Type</th>
                <th className="pb-4 text-gray-400">Amount</th>
                <th className="pb-4 text-gray-400">Bank</th>
                <th className="pb-4 text-gray-400">Status</th>
                <th className="pb-4 text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-t border-gray-700">
                  <td className={`py-4 ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type}
                  </td>
                  <td className="py-4">₹{tx.amount.toLocaleString()}</td>
                  <td className="py-4">{tx.bankName}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bank Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Add Bank Account</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Account Number</label>
                <input
                  type="text"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">IFSC Code</label>
                <input
                  type="text"
                  value={newAccount.ifscCode}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={newAccount.accountHolderName}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Bank Name</label>
                <select
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Bank</option>
                  <option value="SBI">State Bank of India</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="AXIS">Axis Bank</option>
                  <option value="KOTAK">Kotak Mahindra Bank</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Deposit Funds</h3>
            {!qrCode ? (
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="100"
                    max="1000000"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Bank Account</label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.filter(acc => acc.verificationStatus === 'VERIFIED').map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowDeposit(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    Generate QR
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                  <QrCode className="w-32 h-32 text-black" />
                </div>
                <h4 className="font-bold mb-2">Scan to Pay ₹{depositAmount}</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Scan this QR code with any UPI app to complete your deposit
                </p>
                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400">UPI ID:</p>
                  <p className="font-mono text-sm">tradebitco.{Date.now()}@payu</p>
                </div>
                <button
                  onClick={() => {
                    setShowDeposit(false);
                    setQrCode('');
                    setDepositAmount('');
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BankingIntegration;