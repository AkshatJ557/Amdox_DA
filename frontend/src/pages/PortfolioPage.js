import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { Wallet, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PortfolioPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [latestPrices, setLatestPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    coin: 'BTC',
    transaction_type: 'BUY',
    quantity: '',
    price: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, priceRes] = await Promise.all([
        axios.get(`${API}/portfolio/transactions`),
        axios.get(`${API}/data/latest`)
      ]);
      
      if (transRes.data.success) {
        setTransactions(transRes.data.data);
      }
      if (priceRes.data.success) {
        setLatestPrices(priceRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/portfolio/transaction`, formData);
      if (response.data.success) {
        toast.success('Transaction added successfully!');
        setShowAddForm(false);
        setFormData({
          coin: 'BTC',
          transaction_type: 'BUY',
          quantity: '',
          price: '',
          transaction_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to add transaction');
      console.error('Error adding transaction:', error);
    }
  };

  const calculatePortfolio = () => {
    const holdings = {};
    transactions.forEach(t => {
      if (!holdings[t.coin]) {
        holdings[t.coin] = { quantity: 0, totalCost: 0 };
      }
      if (t.transaction_type === 'BUY') {
        holdings[t.coin].quantity += t.quantity;
        holdings[t.coin].totalCost += t.quantity * t.price;
      } else {
        holdings[t.coin].quantity -= t.quantity;
        holdings[t.coin].totalCost -= t.quantity * t.price;
      }
    });

    return Object.entries(holdings)
      .filter(([_, data]) => data.quantity > 0)
      .map(([coin, data]) => {
        const currentPrice = latestPrices.find(p => p.coin === coin)?.price || 0;
        const currentValue = data.quantity * currentPrice;
        const profitLoss = currentValue - data.totalCost;
        const profitLossPercent = (profitLoss / data.totalCost) * 100;

        return {
          coin,
          quantity: data.quantity,
          avgBuyPrice: data.totalCost / data.quantity,
          currentPrice,
          currentValue,
          profitLoss,
          profitLossPercent
        };
      });
  };

  const portfolio = calculatePortfolio();
  const totalValue = portfolio.reduce((sum, h) => sum + h.currentValue, 0);
  const totalProfitLoss = portfolio.reduce((sum, h) => sum + h.profitLoss, 0);

  const pieData = [{
    values: portfolio.map(h => h.currentValue),
    labels: portfolio.map(h => h.coin),
    type: 'pie',
    marker: {
      colors: ['#F7931A', '#627EEA', '#10B981', '#8B5CF6']
    },
    textinfo: 'label+percent',
    textfont: { color: '#FAFAFA' },
  }];

  const pieLayout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    title: { text: 'Portfolio Allocation', font: { size: 20 } },
    margin: { t: 60, b: 20, l: 20, r: 20 },
    showlegend: false,
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="portfolio-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Portfolio Tracker
          </h1>
          <p className="text-muted-foreground">Track your cryptocurrency investments and performance</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-all active:scale-95"
          data-testid="add-transaction-btn"
        >
          <Plus className="w-5 h-5" />
          <span>Add Transaction</span>
        </button>
      </motion.div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-xl p-6 mb-6"
        >
          <h3 className="text-xl font-bold mb-4">Add Transaction</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Coin</label>
              <select
                value={formData.coin}
                onChange={(e) => setFormData({ ...formData, coin: e.target.value })}
                className="w-full bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
                required
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="w-full bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
                required
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Quantity</label>
              <input
                type="number"
                step="0.00000001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Date</label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Notes (Optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 font-medium transition-all"
              >
                Add Transaction
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg px-6 py-2 font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glassmorphism rounded-xl p-6"
            >
              <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="glassmorphism rounded-xl p-6"
            >
              <p className="text-sm text-muted-foreground mb-2">Total Profit/Loss</p>
              <p className={`text-3xl font-bold ${
                totalProfitLoss >= 0 ? 'text-primary' : 'text-destructive'
              }`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glassmorphism rounded-xl p-6"
            >
              <p className="text-sm text-muted-foreground mb-2">Total Assets</p>
              <p className="text-3xl font-bold">{portfolio.length}</p>
            </motion.div>
          </div>

          {portfolio.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="glassmorphism rounded-xl p-6"
              >
                <Plot
                  data={pieData}
                  layout={pieLayout}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: '400px' }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glassmorphism rounded-xl p-6"
              >
                <h3 className="text-xl font-bold mb-4">Holdings</h3>
                <div className="space-y-3">
                  {portfolio.map((holding) => (
                    <div key={holding.coin} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg" style={{ color: holding.coin === 'BTC' ? '#F7931A' : '#627EEA' }}>
                          {holding.coin}
                        </span>
                        <div className={`flex items-center gap-1 ${
                          holding.profitLoss >= 0 ? 'text-primary' : 'text-destructive'
                        }`}>
                          {holding.profitLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-medium">{holding.profitLossPercent.toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{holding.quantity.toFixed(8)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current Value</p>
                          <p className="font-medium">${holding.currentValue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
