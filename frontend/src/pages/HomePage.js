import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Zap } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glassmorphism rounded-xl p-6 hover:border-white/20 transition-all duration-300"
    data-testid={`stat-card-${title.toLowerCase().replace(' ', '-')}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <h3 className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {value}
        </h3>
        {change !== null && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            trend === 'up' ? 'text-[#10B981]' : trend === 'down' ? 'text-[#EF4444]' : 'text-[#3B82F6]'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{change}%</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${
        trend === 'up' ? 'bg-[#10B981]/10' : trend === 'down' ? 'bg-[#EF4444]/10' : 'bg-[#3B82F6]/10'
      }`}>
        <Icon className={`w-6 h-6 ${
          trend === 'up' ? 'text-[#10B981]' : trend === 'down' ? 'text-[#EF4444]' : 'text-[#3B82F6]'
        }`} />
      </div>
    </div>
  </motion.div>
);

const HomePage = () => {
  const [latestData, setLatestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchLatestData();
    const interval = setInterval(fetchLatestData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLatestData = async () => {
    try {
      const response = await axios.get(`${API}/data/latest`);
      if (response.data.success) {
        setLatestData(response.data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching latest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const btcData = latestData.find(d => d.coin === 'BTC');
  const ethData = latestData.find(d => d.coin === 'ETH');

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="home-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          CryptoForecast Analytics
        </h1>
        <p className="text-muted-foreground text-base">
          Real-time cryptocurrency analytics with machine learning forecasts
        </p>
        {lastUpdate && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Bitcoin Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="text-[#F7931A]">Bitcoin (BTC)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Current Price"
                value={`$${btcData?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
                change={btcData?.change_24h?.toFixed(2)}
                icon={DollarSign}
                trend={btcData?.change_24h > 0 ? 'up' : 'down'}
              />
              <StatCard
                title="24h Volume"
                value={`$${((btcData?.volume_24h || 0) / 1e9).toFixed(2)}B`}
                change={null}
                icon={BarChart3}
                trend="neutral"
              />
              <StatCard
                title="Market Cap"
                value={`$${((btcData?.market_cap || 0) / 1e9).toFixed(0)}B`}
                change={null}
                icon={Activity}
                trend="neutral"
              />
              <StatCard
                title="24h Change"
                value={`${btcData?.change_24h > 0 ? '+' : ''}${btcData?.change_24h?.toFixed(2) || '0.00'}%`}
                change={null}
                icon={TrendingUp}
                trend={btcData?.change_24h > 0 ? 'up' : 'down'}
              />
            </div>
          </motion.div>

          {/* Ethereum Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="text-[#627EEA]">Ethereum (ETH)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Current Price"
                value={`$${ethData?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
                change={ethData?.change_24h?.toFixed(2)}
                icon={DollarSign}
                trend={ethData?.change_24h > 0 ? 'up' : 'down'}
              />
              <StatCard
                title="24h Volume"
                value={`$${((ethData?.volume_24h || 0) / 1e9).toFixed(2)}B`}
                change={null}
                icon={BarChart3}
                trend="neutral"
              />
              <StatCard
                title="Market Cap"
                value={`$${((ethData?.market_cap || 0) / 1e9).toFixed(0)}B`}
                change={null}
                icon={Activity}
                trend="neutral"
              />
              <StatCard
                title="24h Change"
                value={`${ethData?.change_24h > 0 ? '+' : ''}${ethData?.change_24h?.toFixed(2) || '0.00'}%`}
                change={null}
                icon={TrendingUp}
                trend={ethData?.change_24h > 0 ? 'up' : 'down'}
              />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 glassmorphism rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: 'Real-Time', path: '/real-time' },
                { name: 'Historical', path: '/historical' },
                { name: 'Forecasts', path: '/arima' },
                { name: 'Sentiment', path: '/sentiment' },
                { name: 'Portfolio', path: '/portfolio' },
              ].map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-all active:scale-95 text-center"
                  data-testid={`quick-link-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default HomePage;
