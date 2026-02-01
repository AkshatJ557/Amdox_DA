import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LSTMPage = () => {
  const [coin, setCoin] = useState('BTC');
  const [periods, setPeriods] = useState(30);
  const [forecast, setForecast] = useState([]);
  const [historical, setHistorical] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [coin, periods]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [forecastRes, historicalRes] = await Promise.all([
        axios.get(`${API}/forecast/lstm/${coin}?periods=${periods}`),
        axios.get(`${API}/data/historical/${coin}?days=90`)
      ]);
      
      if (forecastRes.data.success) {
        setForecast(forecastRes.data.data);
      }
      if (historicalRes.data.success) {
        setHistorical(historicalRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching LSTM forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const plotData = [
    {
      x: historical.slice(-60).map(d => d.date),
      y: historical.slice(-60).map(d => d.close),
      type: 'scatter',
      mode: 'lines',
      name: 'Historical',
      line: { color: '#3B82F6', width: 2 },
    },
    {
      x: forecast.map(d => d.date),
      y: forecast.map(d => d.predicted_price),
      type: 'scatter',
      mode: 'lines',
      name: 'LSTM Forecast',
      line: { color: '#EF4444', width: 2, dash: 'dot' },
    },
    {
      x: forecast.map(d => d.date),
      y: forecast.map(d => d.upper_bound),
      type: 'scatter',
      mode: 'lines',
      name: 'Upper Bound',
      line: { color: '#EF4444', width: 0 },
      showlegend: false,
    },
    {
      x: forecast.map(d => d.date),
      y: forecast.map(d => d.lower_bound),
      type: 'scatter',
      mode: 'lines',
      name: 'Confidence Interval',
      line: { color: '#EF4444', width: 0 },
      fill: 'tonexty',
      fillcolor: 'rgba(239, 68, 68, 0.2)',
    },
  ];

  const layout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    title: { text: `LSTM Forecast for ${coin}`, font: { size: 20 } },
    xaxis: { showgrid: false },
    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', title: 'Price (USD)' },
    margin: { t: 60, b: 40, l: 80, r: 40 },
    hovermode: 'x unified',
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="lstm-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          LSTM Forecast
        </h1>
        <p className="text-muted-foreground">Deep learning neural network forecasting with Long Short-Term Memory</p>
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
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Forecast Period (Days)</label>
            <select
              value={periods}
              onChange={(e) => setPeriods(Number(e.target.value))}
              className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-10 px-4 transition-all"
              data-testid="period-selector"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
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
            className="glassmorphism rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4">Model Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">LSTM Layers</p>
                <p className="text-lg font-medium">2 Layers</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sequence Length</p>
                <p className="text-lg font-medium">60 Days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Epochs</p>
                <p className="text-lg font-medium">5</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forecast Points</p>
                <p className="text-lg font-medium">{forecast.length} days</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LSTMPage;
