import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { GitCompare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ComparisonsPage = () => {
  const [coin, setCoin] = useState('BTC');
  const [forecasts, setForecasts] = useState({ arima: [], prophet: [], lstm: [] });
  const [historical, setHistorical] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [coin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [arimaRes, prophetRes, lstmRes, historicalRes] = await Promise.all([
        axios.get(`${API}/forecast/arima/${coin}?periods=30`),
        axios.get(`${API}/forecast/prophet/${coin}?periods=30`),
        axios.get(`${API}/forecast/lstm/${coin}?periods=30`),
        axios.get(`${API}/data/historical/${coin}?days=60`)
      ]);
      
      setForecasts({
        arima: arimaRes.data.success ? arimaRes.data.data : [],
        prophet: prophetRes.data.success ? prophetRes.data.data : [],
        lstm: lstmRes.data.success ? lstmRes.data.data : []
      });
      
      if (historicalRes.data.success) {
        setHistorical(historicalRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const plotData = [
    {
      x: historical.slice(-30).map(d => d.date),
      y: historical.slice(-30).map(d => d.close),
      type: 'scatter',
      mode: 'lines',
      name: 'Historical',
      line: { color: '#3B82F6', width: 3 },
    },
    {
      x: forecasts.arima.map(d => d.date),
      y: forecasts.arima.map(d => d.predicted_price),
      type: 'scatter',
      mode: 'lines',
      name: 'ARIMA',
      line: { color: '#10B981', width: 2, dash: 'dot' },
    },
    {
      x: forecasts.prophet.map(d => d.date),
      y: forecasts.prophet.map(d => d.predicted_price),
      type: 'scatter',
      mode: 'lines',
      name: 'Prophet',
      line: { color: '#8B5CF6', width: 2, dash: 'dot' },
    },
    {
      x: forecasts.lstm.map(d => d.date),
      y: forecasts.lstm.map(d => d.predicted_price),
      type: 'scatter',
      mode: 'lines',
      name: 'LSTM',
      line: { color: '#EF4444', width: 2, dash: 'dot' },
    },
  ];

  const layout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    title: { text: `Model Comparison for ${coin}`, font: { size: 20 } },
    xaxis: { showgrid: false },
    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', title: 'Price (USD)' },
    margin: { t: 60, b: 40, l: 80, r: 40 },
    hovermode: 'x unified',
    legend: { orientation: 'h', y: -0.2 }
  };

  const calculateAvgPrediction = (forecasts) => {
    if (forecasts.length === 0) return 0;
    return forecasts.reduce((sum, f) => sum + f.predicted_price, 0) / forecasts.length;
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="comparisons-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Model Comparisons
        </h1>
        <p className="text-muted-foreground">Compare forecasts from different ML models side-by-side</p>
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
              style={{ width: '100%', height: '500px' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              { name: 'ARIMA', data: forecasts.arima, color: '#10B981' },
              { name: 'Prophet', data: forecasts.prophet, color: '#8B5CF6' },
              { name: 'LSTM', data: forecasts.lstm, color: '#EF4444' },
            ].map((model) => (
              <div key={model.name} className="glassmorphism rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model.color }}></div>
                  <h3 className="text-lg font-bold">{model.name}</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">30-Day Avg</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ${calculateAvgPrediction(model.data).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Points</p>
                    <p className="text-lg font-medium">{model.data.length}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glassmorphism rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4">Model Characteristics</h3>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="comparison-table">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Model</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Strengths</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-[#10B981]">ARIMA</td>
                    <td className="px-4 py-3 text-sm">Statistical</td>
                    <td className="px-4 py-3 text-sm">Fast, interpretable</td>
                    <td className="px-4 py-3 text-sm">Short-term trends</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-[#8B5CF6]">Prophet</td>
                    <td className="px-4 py-3 text-sm">Statistical + ML</td>
                    <td className="px-4 py-3 text-sm">Seasonality detection</td>
                    <td className="px-4 py-3 text-sm">Seasonal patterns</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-[#EF4444]">LSTM</td>
                    <td className="px-4 py-3 text-sm">Deep Learning</td>
                    <td className="px-4 py-3 text-sm">Complex patterns</td>
                    <td className="px-4 py-3 text-sm">Long-term forecasts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ComparisonsPage;
