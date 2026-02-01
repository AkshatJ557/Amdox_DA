import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { Smile, Frown, Meh } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SentimentPage = () => {
  const [coin, setCoin] = useState('BTC');
  const [sentiment, setSentiment] = useState({ average_sentiment: 0, data: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [coin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/sentiment/${coin}`);
      if (response.data.success) {
        setSentiment({
          average_sentiment: response.data.average_sentiment,
          data: response.data.data
        });
      }
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const gaugeData = [{
    type: 'indicator',
    mode: 'gauge+number',
    value: sentiment.average_sentiment * 100,
    title: { text: 'Average Sentiment', font: { size: 18, color: '#FAFAFA' } },
    gauge: {
      axis: { range: [-100, 100], tickwidth: 1, tickcolor: '#FAFAFA' },
      bar: { color: sentiment.average_sentiment > 0 ? '#10B981' : '#EF4444' },
      bgcolor: '#18181B',
      borderwidth: 2,
      bordercolor: '#27272A',
      steps: [
        { range: [-100, -33], color: 'rgba(239, 68, 68, 0.2)' },
        { range: [-33, 33], color: 'rgba(251, 191, 36, 0.2)' },
        { range: [33, 100], color: 'rgba(16, 185, 129, 0.2)' }
      ],
    }
  }];

  const gaugeLayout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#FAFAFA', family: 'Manrope, sans-serif' },
    margin: { t: 40, b: 20, l: 40, r: 40 },
  };

  const getSentimentIcon = (score) => {
    if (score > 0.2) return <Smile className="w-6 h-6 text-primary" />;
    if (score < -0.2) return <Frown className="w-6 h-6 text-destructive" />;
    return <Meh className="w-6 h-6 text-[#FFC107]" />;
  };

  const getSentimentLabel = (score) => {
    if (score > 0.2) return 'Positive';
    if (score < -0.2) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8" data-testid="sentiment-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Sentiment Analysis
        </h1>
        <p className="text-muted-foreground">Market sentiment from news and social media</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glassmorphism rounded-xl p-6"
            >
              <Plot
                data={gaugeData}
                layout={gaugeLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '300px' }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glassmorphism rounded-xl p-6 flex flex-col justify-center"
            >
              <h3 className="text-xl font-bold mb-4">Overall Sentiment</h3>
              <div className="flex items-center gap-4 mb-4">
                {getSentimentIcon(sentiment.average_sentiment)}
                <div>
                  <p className="text-3xl font-bold">
                    {getSentimentLabel(sentiment.average_sentiment)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Score: {(sentiment.average_sentiment * 100).toFixed(1)}/100
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground">
                Based on {sentiment.data.length} recent news articles and social media posts
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glassmorphism rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4">Recent Sentiment Sources</h3>
            <div className="space-y-3">
              {sentiment.data.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getSentimentIcon(item.sentiment_score)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      <span className={`text-xs font-medium ${
                        item.sentiment_score > 0 ? 'text-primary' : 'text-destructive'
                      }`}>
                        Score: {(item.sentiment_score * 100).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SentimentPage;
