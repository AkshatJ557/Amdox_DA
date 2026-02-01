from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from contextlib import asynccontextmanager
import uvicorn

# Import our modules
from database import init_database, get_connection
from data_collector import collect_mock_data, get_latest_prices, get_historical_data
from ml_models import arima_forecast, prophet_forecast, lstm_forecast, calculate_volatility
from sentiment_analysis import generate_mock_sentiment, get_sentiment_scores, get_average_sentiment
from scheduler import start_scheduler, stop_scheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    init_database()
    
    logger.info("Collecting initial data...")
    collect_mock_data()
    
    logger.info("Generating sentiment data...")
    for coin in ['BTC', 'ETH']:
        generate_mock_sentiment(coin)
    
    logger.info("Starting background scheduler...")
    start_scheduler()
    
    logger.info("Application startup complete!")
    yield
    
    # Shutdown
    logger.info("Stopping scheduler...")
    stop_scheduler()
    logger.info("Application shutdown complete!")

# Create the main app
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "CryptoForecast API is running", "status": "healthy"}

# Real-time data endpoints
@api_router.get("/data/latest")
async def get_latest_data():
    """Get latest prices for all coins"""
    try:
        data = get_latest_prices()
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Error fetching latest data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/data/historical/{coin}")
async def get_coin_historical_data(coin: str, days: int = 365):
    """Get historical data for a specific coin"""
    try:
        coin = coin.upper()
        if coin not in ['BTC', 'ETH']:
            raise HTTPException(status_code=400, detail="Coin must be BTC or ETH")
        
        data = get_historical_data(coin, days)
        return {"success": True, "coin": coin, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching historical data for {coin}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Forecast endpoints
@api_router.get("/forecast/arima/{coin}")
async def get_arima_forecast(coin: str, periods: int = 30):
    """Get ARIMA forecast for a coin"""
    try:
        coin = coin.upper()
        if coin not in ['BTC', 'ETH']:
            raise HTTPException(status_code=400, detail="Coin must be BTC or ETH")
        
        forecast = arima_forecast(coin, periods)
        return {"success": True, "model": "ARIMA", "coin": coin, "data": forecast}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating ARIMA forecast for {coin}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forecast/prophet/{coin}")
async def get_prophet_forecast(coin: str, periods: int = 30):
    """Get Prophet forecast for a coin"""
    try:
        coin = coin.upper()
        if coin not in ['BTC', 'ETH']:
            raise HTTPException(status_code=400, detail="Coin must be BTC or ETH")
        
        forecast = prophet_forecast(coin, periods)
        return {"success": True, "model": "Prophet", "coin": coin, "data": forecast}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating Prophet forecast for {coin}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forecast/lstm/{coin}")
async def get_lstm_forecast(coin: str, periods: int = 30):
    """Get LSTM forecast for a coin"""
    try:
        coin = coin.upper()
        if coin not in ['BTC', 'ETH']:
            raise HTTPException(status_code=400, detail="Coin must be BTC or ETH")
        
        forecast = lstm_forecast(coin, periods)
        return {"success": True, "model": "LSTM", "coin": coin, "data": forecast}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating LSTM forecast for {coin}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Volatility endpoint
@api_router.get("/volatility/{coin}")
async def get_volatility(coin: str, window: int = 30):
    """Get volatility data for a coin"""
    try:
        coin = coin.upper()
        if coin not in ['BTC', 'ETH']:
            raise HTTPException(status_code=400, detail="Coin must be BTC or ETH")
        
        volatility = calculate_volatility(coin, window)
        return {"success": True, "coin": coin, "data": volatility}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating volatility for {coin}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Sentiment endpoints
@api_router.get("/sentiment/{coin}")
async def get_sentiment(coin: str):
    """Get sentiment scores for a coin"""
    try:
        coin = coin.upper()
        if coin not in ['BTC', 'ETH']:
            raise HTTPException(status_code=400, detail="Coin must be BTC or ETH")
        
        sentiment_data = get_sentiment_scores(coin)
        avg_sentiment = get_average_sentiment(coin)
        
        return {
            "success": True,
            "coin": coin,
            "average_sentiment": avg_sentiment,
            "data": sentiment_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sentiment for {coin}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Portfolio endpoints
@api_router.get("/portfolio/transactions")
async def get_portfolio_transactions():
    """Get all portfolio transactions"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM portfolio_transactions ORDER BY transaction_date DESC')
        results = cursor.fetchall()
        conn.close()
        
        return {"success": True, "data": [dict(row) for row in results]}
    except Exception as e:
        logger.error(f"Error fetching portfolio transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/portfolio/transaction")
async def add_portfolio_transaction(transaction: dict):
    """Add a portfolio transaction"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO portfolio_transactions
            (coin, transaction_type, quantity, price, transaction_date, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            transaction.get('coin', '').upper(),
            transaction.get('transaction_type', 'BUY').upper(),
            transaction.get('quantity', 0),
            transaction.get('price', 0),
            transaction.get('transaction_date'),
            transaction.get('notes', '')
        ))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Transaction added successfully"}
    except Exception as e:
        logger.error(f"Error adding portfolio transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Alert endpoints
@api_router.get("/alerts")
async def get_alerts():
    """Get all alerts"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM alerts ORDER BY created_at DESC')
        results = cursor.fetchall()
        conn.close()
        
        return {"success": True, "data": [dict(row) for row in results]}
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/alerts")
async def create_alert(alert: dict):
    """Create a new alert"""
    try:
        from datetime import datetime, timezone
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts
            (coin, alert_type, threshold, created_at)
            VALUES (?, ?, ?, ?)
        ''', (
            alert.get('coin', '').upper(),
            alert.get('alert_type', 'price_above'),
            alert.get('threshold', 0),
            datetime.now(timezone.utc)
        ))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Alert created successfully"}
    except Exception as e:
        logger.error(f"Error creating alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
