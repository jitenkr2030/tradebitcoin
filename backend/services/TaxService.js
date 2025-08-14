const PDFDocument = require('pdfkit');
const db = require('../config/database');
const logger = require('../utils/logger');

class TaxService {
  constructor() {
    this.taxRates = {
      IN: {
        shortTerm: 0.30, // 30% for short-term gains in India
        longTerm: 0.20,  // 20% for long-term gains in India
        tds: 0.01        // 1% TDS on transactions above ₹10,000
      },
      US: {
        shortTerm: 0.25, // Varies by income bracket
        longTerm: 0.15   // Long-term capital gains
      }
    };
  }

  async calculateTax(userId, year) {
    try {
      const user = await db('users').where({ id: userId }).first();
      const country = user?.tax_settings?.country || 'IN';
      const rates = this.taxRates[country];

      // Get all trades for the tax year
      const trades = await db('trades')
        .where({ user_id: userId })
        .whereBetween('created_at', [
          new Date(`${year}-01-01`),
          new Date(`${year}-12-31`)
        ])
        .orderBy('created_at', 'asc');

      if (trades.length === 0) {
        return {
          totalGains: 0,
          totalLosses: 0,
          netGains: 0,
          shortTermGains: 0,
          longTermGains: 0,
          taxLiability: 0,
          transactions: []
        };
      }

      // Calculate gains/losses using FIFO method
      const taxTransactions = this.calculateGainsLosses(trades);
      
      let shortTermGains = 0;
      let longTermGains = 0;
      let totalGains = 0;
      let totalLosses = 0;

      taxTransactions.forEach(transaction => {
        if (transaction.gainLoss > 0) {
          totalGains += transaction.gainLoss;
          if (transaction.holdingPeriod < 365) {
            shortTermGains += transaction.gainLoss;
          } else {
            longTermGains += transaction.gainLoss;
          }
        } else {
          totalLosses += Math.abs(transaction.gainLoss);
        }
      });

      const netGains = totalGains - totalLosses;
      
      // Calculate tax liability
      let taxLiability = 0;
      if (netGains > 0) {
        taxLiability = (shortTermGains * rates.shortTerm) + (longTermGains * rates.longTerm);
      }

      return {
        totalGains,
        totalLosses,
        netGains,
        shortTermGains,
        longTermGains,
        taxLiability,
        transactions: taxTransactions,
        country,
        year
      };
    } catch (error) {
      logger.error('Calculate tax error:', error);
      throw error;
    }
  }

  async generateTaxReport(userId, year) {
    try {
      const taxData = await this.calculateTax(userId, year);
      
      // Save report to database
      const [report] = await db('tax_reports').insert({
        user_id: userId,
        tax_year: year.toString(),
        total_gains: taxData.totalGains,
        total_losses: taxData.totalLosses,
        net_gains: taxData.netGains,
        short_term_gains: taxData.shortTermGains,
        long_term_gains: taxData.longTermGains,
        tax_liability: taxData.taxLiability,
        transactions: JSON.stringify(taxData.transactions),
        status: 'COMPLETED'
      }).returning('*');

      return {
        ...report,
        ...taxData
      };
    } catch (error) {
      logger.error('Generate tax report error:', error);
      throw error;
    }
  }

  async generatePDF(report) {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Generate PDF content
        doc.fontSize(20).text('TradeBitco.in - Crypto Tax Report', 50, 50);
        doc.fontSize(14).text(`Tax Year: ${report.tax_year}`, 50, 80);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 100);

        doc.text('Summary:', 50, 140);
        doc.text(`Total Gains: ₹${parseFloat(report.total_gains).toLocaleString()}`, 70, 160);
        doc.text(`Total Losses: ₹${parseFloat(report.total_losses).toLocaleString()}`, 70, 180);
        doc.text(`Net Gains: ₹${parseFloat(report.net_gains).toLocaleString()}`, 70, 200);
        doc.text(`Short-term Gains: ₹${parseFloat(report.short_term_gains).toLocaleString()}`, 70, 220);
        doc.text(`Long-term Gains: ₹${parseFloat(report.long_term_gains).toLocaleString()}`, 70, 240);
        doc.text(`Tax Liability: ₹${parseFloat(report.tax_liability).toLocaleString()}`, 70, 260);

        // Add transactions table
        if (report.transactions) {
          const transactions = JSON.parse(report.transactions);
          doc.text('Transactions:', 50, 300);
          
          let y = 320;
          transactions.slice(0, 20).forEach((tx, index) => { // Limit to first 20 transactions
            doc.fontSize(10).text(
              `${tx.date} | ${tx.type} | ${tx.asset} | ${tx.amount} | ₹${tx.gainLoss.toFixed(2)}`,
              50, y
            );
            y += 15;
          });

          if (transactions.length > 20) {
            doc.text(`... and ${transactions.length - 20} more transactions`, 50, y);
          }
        }

        doc.end();
      });
    } catch (error) {
      logger.error('Generate PDF error:', error);
      throw error;
    }
  }

  async getTaxOptimizationSuggestions(userId, year) {
    try {
      const taxData = await this.calculateTax(userId, year);
      const suggestions = [];

      // Tax loss harvesting
      if (taxData.totalGains > taxData.totalLosses) {
        const portfolio = await db('portfolio')
          .where({ user_id: userId })
          .where('profit_loss', '<', 0);

        if (portfolio.length > 0) {
          const potentialLosses = portfolio.reduce((sum, asset) => 
            sum + Math.abs(parseFloat(asset.profit_loss)), 0
          );
          
          suggestions.push({
            type: 'TAX_LOSS_HARVESTING',
            title: 'Consider Tax Loss Harvesting',
            description: `You could potentially offset ₹${potentialLosses.toLocaleString()} in gains by selling underperforming assets`,
            impact: `Potential tax savings: ₹${(potentialLosses * 0.30).toLocaleString()}`,
            priority: 'HIGH'
          });
        }
      }

      // Long-term holding suggestion
      const recentTrades = await db('trades')
        .where({ user_id: userId })
        .where('created_at', '>', new Date(Date.now() - 300 * 24 * 60 * 60 * 1000)) // Last 300 days
        .where('type', 'BUY');

      if (recentTrades.length > 0) {
        suggestions.push({
          type: 'LONG_TERM_HOLDING',
          title: 'Hold for Long-term Benefits',
          description: `You have ${recentTrades.length} positions that could qualify for long-term capital gains (20% vs 30% tax) if held for over 1 year`,
          impact: 'Potential 10% tax rate reduction',
          priority: 'MEDIUM'
        });
      }

      // Timing suggestions
      if (new Date().getMonth() >= 9) { // October onwards
        suggestions.push({
          type: 'YEAR_END_PLANNING',
          title: 'Year-end Tax Planning',
          description: 'Consider realizing losses before year-end to offset gains',
          impact: 'Optimize current year tax liability',
          priority: 'HIGH'
        });
      }

      return suggestions;
    } catch (error) {
      logger.error('Get tax optimization suggestions error:', error);
      throw error;
    }
  }

  calculateGainsLosses(trades) {
    const holdings = new Map(); // symbol -> array of {amount, price, date}
    const taxTransactions = [];

    trades.forEach(trade => {
      const symbol = trade.symbol;
      const amount = parseFloat(trade.amount);
      const price = parseFloat(trade.price);
      const date = new Date(trade.created_at);

      if (trade.type === 'BUY') {
        // Add to holdings
        if (!holdings.has(symbol)) {
          holdings.set(symbol, []);
        }
        holdings.get(symbol).push({
          amount,
          price,
          date,
          tradeId: trade.id
        });
      } else if (trade.type === 'SELL') {
        // Calculate gains/losses using FIFO
        if (!holdings.has(symbol) || holdings.get(symbol).length === 0) {
          continue; // No holdings to sell
        }

        let remainingToSell = amount;
        const symbolHoldings = holdings.get(symbol);

        while (remainingToSell > 0 && symbolHoldings.length > 0) {
          const oldestHolding = symbolHoldings[0];
          const sellAmount = Math.min(remainingToSell, oldestHolding.amount);
          
          const gainLoss = (price - oldestHolding.price) * sellAmount;
          const holdingPeriod = Math.floor((date - oldestHolding.date) / (1000 * 60 * 60 * 24));

          taxTransactions.push({
            date: date.toISOString().split('T')[0],
            type: 'SELL',
            asset: symbol,
            amount: sellAmount,
            buyPrice: oldestHolding.price,
            sellPrice: price,
            gainLoss,
            holdingPeriod,
            isLongTerm: holdingPeriod >= 365
          });

          oldestHolding.amount -= sellAmount;
          remainingToSell -= sellAmount;

          if (oldestHolding.amount <= 0) {
            symbolHoldings.shift(); // Remove fully sold holding
          }
        }
      }
    });

    return taxTransactions;
  }
}

module.exports = TaxService;