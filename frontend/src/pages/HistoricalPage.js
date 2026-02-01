import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoricalPage = () => {
  const [coin, setCoin] = useState('BTC');
  const [days, setDays] = useState(90);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoricalData();
  }, [coin, days]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/data/historical/${coin}?days=${days}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const candlestickData = [{
    x: data.map(d => d.date),
    open: data.map(d => d.open),
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    close: data.map(d => d.close),
    type: 'candlestick',
    increasing: { line: { color: '#10B981' } },
    decreasing: { line: { color: '#EF4444' } },
  }];

  const volumeData = [{
    x: data.map(d => d.date),
    y: data.map(d => d.volume),
    type: 'bar',
    marker: { color: '#8B5CF6', opacity: 0.5 },
    yaxis: 'y2',
  }];

  const layout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    title: { text: `${coin} Price History`, font: { size: 20 } },
    xaxis: { showgrid: false, rangeslider: { visible: false } },
    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', title: 'Price (USD)' },
    yaxis2: { showgrid: false, overlaying: 'y', side: 'right', title: 'Volume' },
    margin: { t: 60, b: 40, l: 80, r: 80 },
    hovermode: 'x unified',
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="historical-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Historical Trends
        </h1>
        <p className="text-muted-foreground">Historical price data and technical analysis</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glassmorphism rounded-xl p-6 mb-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Select Coin</label>
            <select
              value={coin}
              onChange={(e) => setCoin(e.target.value)}
              className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
              data-testid="coin-selector"
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Time Period</label>
            <div className="flex gap-2">
              {[30, 90, 180, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    days === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  data-testid={`days-btn-${d}`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Candlestick Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glassmorphism rounded-xl p-6"
          >
            <Plot
              data={[...candlestickData, ...volumeData]}
              layout={layout}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%', height: '500px' }}
            />
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'High', value: Math.max(...data.map(d => d.high)).toFixed(2) },
              { label: 'Low', value: Math.min(...data.map(d => d.low)).toFixed(2) },
              { label: 'Avg Volume', value: (data.reduce((a, b) => a + b.volume, 0) / data.length / 1e9).toFixed(2) + 'B' },
              { label: 'Data Points', value: data.length },
            ].map((stat, idx) => (
              <div key={idx} className="glassmorphism rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HistoricalPage;
