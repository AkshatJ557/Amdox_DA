import sqlite3
from datetime import datetime, timezone
import json
import os
from pathlib import Path

DB_DIR = Path(__file__).parent / 'data'
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / 'crypto_data.db'

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with schema"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Real-time data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS real_time_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coin VARCHAR(10),
            price REAL,
            volume_24h REAL,
            market_cap REAL,
            change_24h REAL,
            timestamp DATETIME,
            UNIQUE(coin, timestamp)
        )
    ''')
    
    # Historical data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS historical_data (
            coin VARCHAR(10),
            date DATE,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume REAL,
            PRIMARY KEY (coin, date)
        )
    ''')
    
    # Forecasts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS forecasts (
            model VARCHAR(20),
            coin VARCHAR(10),
            forecast_date DATE,
            predicted_price REAL,
            lower_bound REAL,
            upper_bound REAL,
            created_at DATETIME
        )
    ''')
    
    # Alerts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coin VARCHAR(10),
            alert_type VARCHAR(20),
            threshold REAL,
            triggered BOOLEAN DEFAULT 0,
            triggered_at DATETIME,
            created_at DATETIME
        )
    ''')
    
    # Portfolio transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS portfolio_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coin VARCHAR(10),
            transaction_type VARCHAR(10),
            quantity REAL,
            price REAL,
            transaction_date DATETIME,
            notes TEXT
        )
    ''')
    
    # Sentiment scores table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sentiment_scores (
            coin VARCHAR(10),
            source VARCHAR(20),
            sentiment_score REAL,
            confidence REAL,
            content TEXT,
            extracted_at DATETIME
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_real_time_coin ON real_time_data(coin)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_real_time_timestamp ON real_time_data(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_historical_coin ON historical_data(coin)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_forecasts_coin ON forecasts(coin)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_alerts_coin ON alerts(coin)')
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_database()
