from textblob import TextBlob
import random
from datetime import datetime, timezone, timedelta
from database import get_connection
import logging

logger = logging.getLogger(__name__)

# Mock news headlines for demo
MOCK_NEWS = {
    'BTC': [
        'Bitcoin reaches new milestone as institutional adoption grows',
        'Major retailer announces Bitcoin payment integration',
        'Analysts predict Bitcoin surge following halving event',
        'Central bank explores Bitcoin as reserve asset',
        'Bitcoin network security reaches all-time high'
    ],
    'ETH': [
        'Ethereum upgrade successfully deployed improving scalability',
        'DeFi protocols on Ethereum see record growth',
        'Major enterprise adopts Ethereum for supply chain',
        'Ethereum staking reaches new participation record',
        'Layer 2 solutions drive Ethereum transaction volume'
    ]
}

def analyze_sentiment(text):
    """Analyze sentiment of text using TextBlob"""
    try:
        blob = TextBlob(text)
        sentiment_score = blob.sentiment.polarity  # -1 to 1
        confidence = abs(sentiment_score)
        return sentiment_score, confidence
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return 0.0, 0.0

def generate_mock_sentiment(coin):
    """Generate mock sentiment data"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        news_items = MOCK_NEWS.get(coin, [])
        
        for news in news_items:
            sentiment_score, confidence = analyze_sentiment(news)
            
            cursor.execute('''
                INSERT INTO sentiment_scores
                (coin, source, sentiment_score, confidence, content, extracted_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                coin,
                'News',
                sentiment_score,
                confidence,
                news,
                datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48))
            ))
        
        conn.commit()
        logger.info(f"Mock sentiment data generated for {coin}")
        return True
    except Exception as e:
        logger.error(f"Error generating mock sentiment: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_sentiment_scores(coin, hours=48):
    """Get sentiment scores for a coin"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    cursor.execute('''
        SELECT * FROM sentiment_scores
        WHERE coin = ? AND extracted_at > ?
        ORDER BY extracted_at DESC
    ''', (coin, cutoff_time))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]

def get_average_sentiment(coin):
    """Get average sentiment for a coin"""
    scores = get_sentiment_scores(coin)
    if not scores:
        return 0.0
    
    avg_sentiment = sum(s['sentiment_score'] for s in scores) / len(scores)
    return avg_sentiment
