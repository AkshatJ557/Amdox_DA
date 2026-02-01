import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from statsmodels.tsa.arima.model import ARIMA
from prophet import Prophet
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow import keras
from database import get_connection
import logging
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

def prepare_data(coin, days=365):
    """Prepare data for ML models"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT date, close FROM historical_data
        WHERE coin = ?
        ORDER BY date ASC
        LIMIT ?
    ''', (coin, days))
    
    results = cursor.fetchall()
    conn.close()
    
    if not results:
        return None
    
    df = pd.DataFrame([dict(row) for row in results])
    df['date'] = pd.to_datetime(df['date'])
    return df

def arima_forecast(coin, periods=30):
    """Generate ARIMA forecast"""
    try:
        df = prepare_data(coin)
        if df is None or len(df) < 50:
            return generate_mock_forecast(coin, periods, 'ARIMA')
        
        # Fit ARIMA model
        model = ARIMA(df['close'], order=(5, 1, 0))
        fitted_model = model.fit()
        
        # Forecast
        forecast = fitted_model.forecast(steps=periods)
        conf_int = fitted_model.get_forecast(steps=periods).conf_int()
        
        # Prepare results
        last_date = df['date'].max()
        forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq='D')
        
        results = []
        for i, date in enumerate(forecast_dates):
            results.append({
                'date': date.date().isoformat(),
                'predicted_price': float(forecast.iloc[i]),
                'lower_bound': float(conf_int.iloc[i, 0]),
                'upper_bound': float(conf_int.iloc[i, 1])
            })
        
        logger.info(f"ARIMA forecast generated for {coin}")
        return results
    except Exception as e:
        logger.error(f"ARIMA forecast error for {coin}: {e}")
        return generate_mock_forecast(coin, periods, 'ARIMA')

def prophet_forecast(coin, periods=30):
    """Generate Prophet forecast"""
    try:
        df = prepare_data(coin)
        if df is None or len(df) < 50:
            return generate_mock_forecast(coin, periods, 'Prophet')
        
        # Prepare data for Prophet
        prophet_df = df.rename(columns={'date': 'ds', 'close': 'y'})
        
        # Fit Prophet model
        model = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=True)
        model.fit(prophet_df)
        
        # Make future dataframe
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        # Get only future predictions
        forecast = forecast.tail(periods)
        
        results = []
        for _, row in forecast.iterrows():
            results.append({
                'date': row['ds'].date().isoformat(),
                'predicted_price': float(row['yhat']),
                'lower_bound': float(row['yhat_lower']),
                'upper_bound': float(row['yhat_upper'])
            })
        
        logger.info(f"Prophet forecast generated for {coin}")
        return results
    except Exception as e:
        logger.error(f"Prophet forecast error for {coin}: {e}")
        return generate_mock_forecast(coin, periods, 'Prophet')

def lstm_forecast(coin, periods=30):
    """Generate LSTM forecast"""
    try:
        df = prepare_data(coin)
        if df is None or len(df) < 100:
            return generate_mock_forecast(coin, periods, 'LSTM')
        
        # Prepare data
        data = df['close'].values.reshape(-1, 1)
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(data)
        
        # Create sequences
        sequence_length = 60
        X, y = [], []
        for i in range(sequence_length, len(scaled_data)):
            X.append(scaled_data[i-sequence_length:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = X.reshape(X.shape[0], X.shape[1], 1)
        
        # Build simple LSTM model
        model = keras.Sequential([
            keras.layers.LSTM(50, return_sequences=True, input_shape=(sequence_length, 1)),
            keras.layers.Dropout(0.2),
            keras.layers.LSTM(50, return_sequences=False),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X, y, epochs=5, batch_size=32, verbose=0)
        
        # Generate predictions
        predictions = []
        current_sequence = scaled_data[-sequence_length:]
        
        for _ in range(periods):
            current_sequence_reshaped = current_sequence.reshape(1, sequence_length, 1)
            prediction = model.predict(current_sequence_reshaped, verbose=0)
            predictions.append(prediction[0, 0])
            current_sequence = np.append(current_sequence[1:], prediction)
        
        # Inverse transform predictions
        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
        
        # Calculate confidence intervals (mock)
        last_date = df['date'].max()
        forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq='D')
        
        results = []
        for i, date in enumerate(forecast_dates):
            pred_price = float(predictions[i, 0])
            results.append({
                'date': date.date().isoformat(),
                'predicted_price': pred_price,
                'lower_bound': pred_price * 0.95,
                'upper_bound': pred_price * 1.05
            })
        
        logger.info(f"LSTM forecast generated for {coin}")
        return results
    except Exception as e:
        logger.error(f"LSTM forecast error for {coin}: {e}")
        return generate_mock_forecast(coin, periods, 'LSTM')

def generate_mock_forecast(coin, periods, model_name):
    """Generate mock forecast data"""
    base_price = 45000 if coin == 'BTC' else 2800
    last_date = datetime.now(timezone.utc).date()
    
    results = []
    for i in range(periods):
        date = last_date + timedelta(days=i+1)
        # Simple trend with noise
        predicted_price = base_price * (1 + 0.002 * i) * (1 + np.random.normal(0, 0.01))
        results.append({
            'date': date.isoformat(),
            'predicted_price': predicted_price,
            'lower_bound': predicted_price * 0.95,
            'upper_bound': predicted_price * 1.05
        })
    
    return results

def calculate_volatility(coin, window=30):
    """Calculate rolling volatility"""
    df = prepare_data(coin)
    if df is None:
        return []
    
    df['returns'] = df['close'].pct_change()
    df['volatility'] = df['returns'].rolling(window=window).std() * np.sqrt(365)
    
    results = []
    for _, row in df.dropna().iterrows():
        results.append({
            'date': row['date'].date().isoformat(),
            'volatility': float(row['volatility'])
        })
    
    return results
