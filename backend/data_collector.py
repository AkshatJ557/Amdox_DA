import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
import requests
import time
from database import get_connection
import logging

logger = logging.getLogger(__name__)

# Sample/Mock data for immediate demo
MOCK_DATA = {
    'BTC': {
        'price': 45000.00,
        'volume_24h': 28000000000,
        'market_cap': 880000000000,
        'change_24h': 2.5
    },
    'ETH': {
        'price': 2800.00,
        'volume_24h': 15000000000,
        'market_cap': 340000000000,
        'change_24h': -1.2
    }
}

def generate_mock_historical_data(coin, days=365):
    """Generate mock historical data for demo"""
    np.random.seed(42 if coin == 'BTC' else 43)
    dates = pd.date_range(end=datetime.now(timezone.utc), periods=days, freq='D')
    
    base_price = 45000 if coin == 'BTC' else 2800
    prices = []
    current_price = base_price * 0.7  # Start from 70% of current price
    
    for i in range(days):
        # Random walk with upward trend
        change = np.random.normal(0.001, 0.03)
        current_price *= (1 + change)
        prices.append(current_price)
    
    df = pd.DataFrame({
        'date': dates,
        'open': prices,
        'high': [p * (1 + abs(np.random.normal(0, 0.02))) for p in prices],
        'low': [p * (1 - abs(np.random.normal(0, 0.02))) for p in prices],
        'close': prices,
        'volume': [np.random.uniform(1e9, 5e9) for _ in prices]
    })
    
    return df

def collect_mock_data(use_mock=True):
    """Collect mock data for BTC and ETH"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        for coin in ['BTC', 'ETH']:
            # Insert real-time mock data
            mock = MOCK_DATA[coin]
            cursor.execute('''
                INSERT OR REPLACE INTO real_time_data 
                (coin, price, volume_24h, market_cap, change_24h, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                coin,
                mock['price'] * (1 + np.random.normal(0, 0.005)),  # Small random variation
                mock['volume_24h'],
                mock['market_cap'],
                mock['change_24h'],
                datetime.now(timezone.utc)
            ))
            
            # Insert historical mock data
            hist_df = generate_mock_historical_data(coin, 365)
            for _, row in hist_df.iterrows():
                cursor.execute('''
                    INSERT OR REPLACE INTO historical_data
                    (coin, date, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    coin,
                    row['date'].date(),
                    row['open'],
                    row['high'],
                    row['low'],
                    row['close'],
                    row['volume']
                ))
        
        conn.commit()
        logger.info(f"Mock data collected successfully for BTC and ETH")
        return True
    except Exception as e:
        logger.error(f"Error collecting mock data: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def collect_real_data():
    """Collect real data from Yahoo Finance and CoinCap API"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Fetch from Yahoo Finance
        for coin, ticker in [('BTC', 'BTC-USD'), ('ETH', 'ETH-USD')]:
            try:
                ticker_obj = yf.Ticker(ticker)
                info = ticker_obj.info
                hist = ticker_obj.history(period='1y')
                
                # Insert real-time data
                cursor.execute('''
                    INSERT OR REPLACE INTO real_time_data 
                    (coin, price, volume_24h, market_cap, change_24h, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    coin,
                    info.get('currentPrice', info.get('regularMarketPrice', 0)),
                    info.get('volume24Hr', info.get('volume', 0)),
                    info.get('marketCap', 0),
                    info.get('regularMarketChangePercent', 0),
                    datetime.now(timezone.utc)
                ))
                
                # Insert historical data
                for date, row in hist.iterrows():
                    cursor.execute('''
                        INSERT OR REPLACE INTO historical_data
                        (coin, date, open, high, low, close, volume)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        coin,
                        date.date(),
                        row['Open'],
                        row['High'],
                        row['Low'],
                        row['Close'],
                        row['Volume']
                    ))
                    
                logger.info(f"Real data collected for {coin}")
            except Exception as e:
                logger.error(f"Error fetching real data for {coin}: {e}")
        
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error collecting real data: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_latest_prices():
    """Get latest prices for all coins"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT coin, price, volume_24h, market_cap, change_24h, timestamp
        FROM real_time_data
        WHERE (coin, timestamp) IN (
            SELECT coin, MAX(timestamp)
            FROM real_time_data
            GROUP BY coin
        )
    ''')
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]

def get_historical_data(coin, days=365):
    """Get historical data for a coin"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM historical_data
        WHERE coin = ?
        ORDER BY date DESC
        LIMIT ?
    ''', (coin, days))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results][::-1]  # Reverse to chronological order
