from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from data_collector import collect_mock_data, collect_real_data
from sentiment_analysis import generate_mock_sentiment
from ml_models import arima_forecast, prophet_forecast, lstm_forecast
from database import get_connection
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def scheduled_data_collection():
    """Scheduled job to collect data"""
    logger.info("Running scheduled data collection...")
    try:
        # Start with mock data, can switch to real data later
        collect_mock_data()
    except Exception as e:
        logger.error(f"Scheduled data collection failed: {e}")

def scheduled_sentiment_update():
    """Scheduled job to update sentiment"""
    logger.info("Running scheduled sentiment update...")
    try:
        for coin in ['BTC', 'ETH']:
            generate_mock_sentiment(coin)
    except Exception as e:
        logger.error(f"Scheduled sentiment update failed: {e}")

def scheduled_forecast_update():
    """Scheduled job to update forecasts"""
    logger.info("Running scheduled forecast update...")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        for coin in ['BTC', 'ETH']:
            # Generate forecasts (using mock for now)
            arima_data = arima_forecast(coin, 30)
            prophet_data = prophet_forecast(coin, 30)
            
            # Store forecasts
            for model_name, data in [('ARIMA', arima_data), ('Prophet', prophet_data)]:
                for forecast in data:
                    cursor.execute('''
                        INSERT INTO forecasts
                        (model, coin, forecast_date, predicted_price, lower_bound, upper_bound, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        model_name,
                        coin,
                        forecast['date'],
                        forecast['predicted_price'],
                        forecast['lower_bound'],
                        forecast['upper_bound'],
                        datetime.now(timezone.utc)
                    ))
        
        conn.commit()
        conn.close()
        logger.info("Forecasts updated successfully")
    except Exception as e:
        logger.error(f"Scheduled forecast update failed: {e}")

def start_scheduler():
    """Start the background scheduler"""
    # Data collection every 5 minutes
    scheduler.add_job(
        scheduled_data_collection,
        trigger=IntervalTrigger(minutes=5),
        id='data_collection',
        name='Collect crypto data',
        replace_existing=True
    )
    
    # Sentiment update every 30 minutes
    scheduler.add_job(
        scheduled_sentiment_update,
        trigger=IntervalTrigger(minutes=30),
        id='sentiment_update',
        name='Update sentiment data',
        replace_existing=True
    )
    
    # Forecast update daily at 2 AM
    scheduler.add_job(
        scheduled_forecast_update,
        trigger=CronTrigger(hour=2, minute=0),
        id='forecast_update',
        name='Update forecasts',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started successfully")

def stop_scheduler():
    """Stop the background scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")
