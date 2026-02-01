import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { Activity, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RealTimePage = () => {
  const [latestData, setLatestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);

  useEffect(() => {
    fetchData();
    let interval;
    if (autoUpdate) {
      interval = setInterval(fetchData, 5000); // Update every 5 seconds
    }
    return () => clearInterval(interval);
  }, [autoUpdate]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/data/latest`);
      if (response.data.success) {
        setLatestData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const btcData = latestData.find(d => d.coin === 'BTC');
  const ethData = latestData.find(d => d.coin === 'ETH');

  const plotData = [
    {
      x: ['BTC', 'ETH'],
      y: [btcData?.price || 0, ethData?.price || 0],
      type: 'bar',
      marker: {
        color: ['#F7931A', '#627EEA']
      },
      text: [
        `$${btcData?.price?.toLocaleString()}`,
        `$${ethData?.price?.toLocaleString()}`
      ],
      textposition: 'outside',
    }
  ];

  const layout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    title: { text: 'Current Prices', font: { size: 20 } },
    xaxis: { showgrid: false },
    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)' },
    margin: { t: 60, b: 40, l: 80, r: 40 },
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="real-time-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Real-Time Data
          </h1>
          <p className="text-muted-foreground">Live cryptocurrency price monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              autoUpdate
                ? 'bg-primary text-primary-foreground neon-glow'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            data-testid="auto-update-toggle"
          >
            <Activity className="w-4 h-4" />
            <span>{autoUpdate ? 'Live' : 'Paused'}</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all active:scale-95"
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Price Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glassmorphism rounded-xl p-6"
          >
            <Plot
              data={plotData}
              layout={layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '400px' }}
            />
          </motion.div>

          {/* Data Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glassmorphism rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="price-table">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium">Coin</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">Price</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">24h Change</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">Volume</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {latestData.map((coin, idx) => (
                    <tr key={coin.coin} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium" style={{ color: coin.coin === 'BTC' ? '#F7931A' : '#627EEA' }}>
                        {coin.coin}
                      </td>
                      <td className="px-6 py-4 text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        ${coin.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        coin.change_24h > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                      }`}>
                        {coin.change_24h > 0 ? '+' : ''}{coin.change_24h?.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        ${(coin.volume_24h / 1e9).toFixed(2)}B
                      </td>
                      <td className="px-6 py-4 text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        ${(coin.market_cap / 1e9).toFixed(0)}B
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RealTimePage;
