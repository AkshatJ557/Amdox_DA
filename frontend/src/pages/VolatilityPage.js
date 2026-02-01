import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VolatilityPage = () => {
  const [coin, setCoin] = useState('BTC');
  const [volatility, setVolatility] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [coin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/volatility/${coin}`);
      if (response.data.success) {
        setVolatility(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching volatility data:', error);
    } finally {
      setLoading(false);
    }
  };

  const plotData = [{
    x: volatility.map(d => d.date),
    y: volatility.map(d => d.volatility),
    type: 'scatter',
    mode: 'lines',
    fill: 'tozeroy',
    line: { color: '#EF4444', width: 2 },
    fillcolor: 'rgba(239, 68, 68, 0.2)',
  }];

  const layout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    title: { text: `${coin} Volatility (30-day Rolling)`, font: { size: 20 } },
    xaxis: { showgrid: false },
    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', title: 'Annualized Volatility' },
    margin: { t: 60, b: 40, l: 80, r: 40 },
  };

  const avgVolatility = volatility.length > 0
    ? (volatility.reduce((sum, d) => sum + d.volatility, 0) / volatility.length)
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="volatility-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Volatility Analysis
        </h1>
        <p className="text-muted-foreground">Risk metrics and price volatility indicators</p>
      </motion.div>

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
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glassmorphism rounded-xl p-6"
          >
            <Plot
              data={plotData}
              layout={layout}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%', height: '400px' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="glassmorphism rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-muted-foreground">Average Volatility</p>
              </div>
              <p className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {(avgVolatility * 100).toFixed(2)}%
              </p>
            </div>
            <div className="glassmorphism rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
              <p className={`text-2xl font-bold ${
                avgVolatility > 0.8 ? 'text-destructive' : avgVolatility > 0.5 ? 'text-[#FFC107]' : 'text-primary'
              }`}>
                {avgVolatility > 0.8 ? 'High' : avgVolatility > 0.5 ? 'Medium' : 'Low'}
              </p>
            </div>
            <div className="glassmorphism rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Data Points</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {volatility.length}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VolatilityPage;
