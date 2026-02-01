import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TechnicalAnalysisPage = () => {
  const [coin, setCoin] = useState('BTC');
  const [data, setData] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [coin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/data/historical/${coin}?days=180`);
      if (response.data.success) {
        const histData = response.data.data;
        setData(histData);
        calculateIndicators(histData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIndicators = (histData) => {
    if (histData.length === 0) return;

    // Calculate RSI
    const rsi = calculateRSI(histData.map(d => d.close), 14);

    // Calculate MACD
    const macd = calculateMACD(histData.map(d => d.close));

    // Calculate Moving Averages
    const sma20 = calculateSMA(histData.map(d => d.close), 20);
    const sma50 = calculateSMA(histData.map(d => d.close), 50);
    const ema12 = calculateEMA(histData.map(d => d.close), 12);

    // Calculate Bollinger Bands
    const bb = calculateBollingerBands(histData.map(d => d.close), 20, 2);

    setIndicators({ rsi, macd, sma20, sma50, ema12, bb });
  };

  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    const ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  };

  const calculateRSI = (data, period) => {
    const rsi = [];
    let gains = [];
    let losses = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);

      if (i < period) {
        rsi.push(null);
      } else {
        const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
        const rs = avgGain / (avgLoss || 1);
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    return rsi;
  };

  const calculateMACD = (data) => {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    const macdLine = ema12.map((val, i) => val - ema26[i]);
    const signalLine = calculateEMA(macdLine, 9);
    const histogram = macdLine.map((val, i) => val - signalLine[i]);
    return { macdLine, signalLine, histogram };
  };

  const calculateBollingerBands = (data, period, stdDev) => {
    const sma = calculateSMA(data, period);
    const upper = [];
    const lower = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        lower.push(null);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        upper.push(mean + stdDev * std);
        lower.push(mean - stdDev * std);
      }
    }
    return { sma, upper, lower };
  };

  const priceChartData = [
    {
      x: data.map(d => d.date),
      y: data.map(d => d.close),
      type: 'scatter',
      mode: 'lines',
      name: 'Price',
      line: { color: '#3B82F6', width: 2 }
    },
    indicators && {
      x: data.map(d => d.date),
      y: indicators.sma20,
      type: 'scatter',
      mode: 'lines',
      name: 'SMA 20',
      line: { color: '#10B981', width: 1.5, dash: 'dot' }
    },
    indicators && {
      x: data.map(d => d.date),
      y: indicators.sma50,
      type: 'scatter',
      mode: 'lines',
      name: 'SMA 50',
      line: { color: '#F59E0B', width: 1.5, dash: 'dot' }
    }
  ].filter(Boolean);

  const bollingerData = indicators ? [
    {
      x: data.map(d => d.date),
      y: data.map(d => d.close),
      type: 'scatter',
      mode: 'lines',
      name: 'Price',
      line: { color: '#3B82F6', width: 2 }
    },
    {
      x: data.map(d => d.date),
      y: indicators.bb.upper,
      type: 'scatter',
      mode: 'lines',
      name: 'Upper Band',
      line: { color: '#EF4444', width: 1 },
      showlegend: false
    },
    {
      x: data.map(d => d.date),
      y: indicators.bb.lower,
      type: 'scatter',
      mode: 'lines',
      name: 'Lower Band',
      line: { color: '#EF4444', width: 1 },
      fill: 'tonexty',
      fillcolor: 'rgba(239, 68, 68, 0.1)'
    },
    {
      x: data.map(d => d.date),
      y: indicators.bb.sma,
      type: 'scatter',
      mode: 'lines',
      name: 'SMA 20',
      line: { color: '#10B981', width: 1.5 }
    }
  ] : [];

  const rsiData = indicators ? [{
    x: data.map(d => d.date),
    y: indicators.rsi,
    type: 'scatter',
    mode: 'lines',
    name: 'RSI',
    line: { color: '#8B5CF6', width: 2 }
  }] : [];

  const macdData = indicators ? [
    {
      x: data.map(d => d.date),
      y: indicators.macd.macdLine,
      type: 'scatter',
      mode: 'lines',
      name: 'MACD',
      line: { color: '#3B82F6', width: 2 }
    },
    {
      x: data.map(d => d.date),
      y: indicators.macd.signalLine,
      type: 'scatter',
      mode: 'lines',
      name: 'Signal',
      line: { color: '#EF4444', width: 2 }
    },
    {
      x: data.map(d => d.date),
      y: indicators.macd.histogram,
      type: 'bar',
      name: 'Histogram',
      marker: { 
        color: indicators.macd.histogram.map(h => h >= 0 ? '#10B981' : '#EF4444'),
        opacity: 0.5
      }
    }
  ] : [];

  const volumeData = [{
    x: data.map(d => d.date),
    y: data.map(d => d.volume),
    type: 'bar',
    name: 'Volume',
    marker: { color: '#8B5CF6', opacity: 0.6 }
  }];

  const chartLayout = (title) => ({
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    title: { text: title, font: { size: 18 } },
    xaxis: { showgrid: false },
    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)' },
    margin: { t: 50, b: 40, l: 60, r: 40 },
    hovermode: 'x unified',
    legend: { orientation: 'h', y: -0.2 }
  });

  const rsiLayout = {
    ...chartLayout('RSI (14)'),
    shapes: [
      { type: 'line', x0: data[0]?.date, x1: data[data.length-1]?.date, y0: 70, y1: 70, line: { color: '#EF4444', width: 1, dash: 'dash' } },
      { type: 'line', x0: data[0]?.date, x1: data[data.length-1]?.date, y0: 30, y1: 30, line: { color: '#10B981', width: 1, dash: 'dash' } }
    ],
    yaxis: { ...chartLayout().yaxis, range: [0, 100] }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="technical-analysis-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Technical Analysis
        </h1>
        <p className="text-muted-foreground">Advanced technical indicators and trading signals</p>
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
          {/* Price with Moving Averages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glassmorphism rounded-xl p-6"
          >
            <Plot
              data={priceChartData}
              layout={chartLayout(`${coin} Price with Moving Averages`)}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%', height: '400px' }}
            />
          </motion.div>

          {/* Bollinger Bands */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glassmorphism rounded-xl p-6"
          >
            <Plot
              data={bollingerData}
              layout={chartLayout('Bollinger Bands (20, 2)')}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%', height: '400px' }}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RSI */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism rounded-xl p-6"
            >
              <Plot
                data={rsiData}
                layout={rsiLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '300px' }}
              />
            </motion.div>

            {/* Volume */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism rounded-xl p-6"
            >
              <Plot
                data={volumeData}
                layout={chartLayout('Trading Volume')}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '300px' }}
              />
            </motion.div>
          </div>

          {/* MACD */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glassmorphism rounded-xl p-6"
          >
            <Plot
              data={macdData}
              layout={chartLayout('MACD (12, 26, 9)')}
              config={{ responsive: true, displayModeBar: true }}
              style={{ width: '100%', height: '350px' }}
            />
          </motion.div>

          {/* Trading Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {indicators && [
              {
                label: 'RSI Signal',
                value: indicators.rsi[indicators.rsi.length - 1],
                icon: Activity,
                status: indicators.rsi[indicators.rsi.length - 1] > 70 ? 'Overbought' : 
                        indicators.rsi[indicators.rsi.length - 1] < 30 ? 'Oversold' : 'Neutral',
                color: indicators.rsi[indicators.rsi.length - 1] > 70 ? 'text-destructive' : 
                       indicators.rsi[indicators.rsi.length - 1] < 30 ? 'text-primary' : 'text-[#FFC107]'
              },
              {
                label: 'MACD Signal',
                value: indicators.macd.histogram[indicators.macd.histogram.length - 1],
                icon: TrendingUp,
                status: indicators.macd.histogram[indicators.macd.histogram.length - 1] > 0 ? 'Bullish' : 'Bearish',
                color: indicators.macd.histogram[indicators.macd.histogram.length - 1] > 0 ? 'text-primary' : 'text-destructive'
              },
              {
                label: 'Trend',
                value: data[data.length - 1].close,
                icon: BarChart2,
                status: data[data.length - 1].close > indicators.sma50[indicators.sma50.length - 1] ? 'Uptrend' : 'Downtrend',
                color: data[data.length - 1].close > indicators.sma50[indicators.sma50.length - 1] ? 'text-primary' : 'text-destructive'
              }
            ].map((signal, idx) => {
              const Icon = signal.icon;
              return (
                <div key={idx} className="glassmorphism rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">{signal.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${signal.color}`}>
                    {signal.status}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Value: {typeof signal.value === 'number' ? signal.value.toFixed(2) : 'N/A'}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TechnicalAnalysisPage;