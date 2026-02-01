import requests
import sys
import json
from datetime import datetime

class CryptoAPITester:
    def __init__(self, base_url="https://cryptodash-37.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if 'success' in response_data:
                        print(f"   Success: {response_data['success']}")
                    if 'data' in response_data and isinstance(response_data['data'], list):
                        print(f"   Data count: {len(response_data['data'])}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'endpoint': endpoint,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'error': response.text[:200]
                })

            return success, response.json() if success else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'endpoint': endpoint,
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("Health Check", "GET", "", 200)

    def test_latest_data(self):
        """Test latest price data endpoint"""
        return self.run_test("Latest Data", "GET", "data/latest", 200)

    def test_historical_data(self):
        """Test historical data endpoints"""
        success_btc, _ = self.run_test("Historical BTC", "GET", "data/historical/BTC", 200, params={'days': 30})
        success_eth, _ = self.run_test("Historical ETH", "GET", "data/historical/ETH", 200, params={'days': 90})
        return success_btc and success_eth

    def test_arima_forecasts(self):
        """Test ARIMA forecast endpoints"""
        success_btc, _ = self.run_test("ARIMA BTC", "GET", "forecast/arima/BTC", 200, params={'periods': 30})
        success_eth, _ = self.run_test("ARIMA ETH", "GET", "forecast/arima/ETH", 200, params={'periods': 15})
        return success_btc and success_eth

    def test_prophet_forecasts(self):
        """Test Prophet forecast endpoints"""
        success_btc, _ = self.run_test("Prophet BTC", "GET", "forecast/prophet/BTC", 200, params={'periods': 30})
        success_eth, _ = self.run_test("Prophet ETH", "GET", "forecast/prophet/ETH", 200, params={'periods': 15})
        return success_btc and success_eth

    def test_lstm_forecasts(self):
        """Test LSTM forecast endpoints"""
        success_btc, _ = self.run_test("LSTM BTC", "GET", "forecast/lstm/BTC", 200, params={'periods': 30})
        success_eth, _ = self.run_test("LSTM ETH", "GET", "forecast/lstm/ETH", 200, params={'periods': 15})
        return success_btc and success_eth

    def test_volatility(self):
        """Test volatility endpoints"""
        success_btc, _ = self.run_test("Volatility BTC", "GET", "volatility/BTC", 200, params={'window': 30})
        success_eth, _ = self.run_test("Volatility ETH", "GET", "volatility/ETH", 200, params={'window': 14})
        return success_btc and success_eth

    def test_sentiment(self):
        """Test sentiment endpoints"""
        success_btc, _ = self.run_test("Sentiment BTC", "GET", "sentiment/BTC", 200)
        success_eth, _ = self.run_test("Sentiment ETH", "GET", "sentiment/ETH", 200)
        return success_btc and success_eth

    def test_portfolio_transactions(self):
        """Test portfolio endpoints"""
        # Get existing transactions
        success_get, _ = self.run_test("Get Portfolio", "GET", "portfolio/transactions", 200)
        
        # Add a test transaction
        test_transaction = {
            "coin": "BTC",
            "transaction_type": "BUY",
            "quantity": 0.1,
            "price": 45000.00,
            "transaction_date": datetime.now().isoformat(),
            "notes": "Test transaction"
        }
        success_post, _ = self.run_test("Add Transaction", "POST", "portfolio/transaction", 200, data=test_transaction)
        
        return success_get and success_post

    def test_alerts(self):
        """Test alert endpoints"""
        # Get existing alerts
        success_get, _ = self.run_test("Get Alerts", "GET", "alerts", 200)
        
        # Create a test alert
        test_alert = {
            "coin": "BTC",
            "alert_type": "price_above",
            "threshold": 50000.00
        }
        success_post, _ = self.run_test("Create Alert", "POST", "alerts", 200, data=test_alert)
        
        return success_get and success_post

    def test_invalid_endpoints(self):
        """Test error handling for invalid requests"""
        # Invalid coin
        success1, _ = self.run_test("Invalid Coin", "GET", "data/historical/INVALID", 400)
        
        # Invalid forecast coin
        success2, _ = self.run_test("Invalid Forecast Coin", "GET", "forecast/arima/INVALID", 400)
        
        return success1 and success2

def main():
    print("🚀 Starting CryptoForecast API Tests")
    print("=" * 50)
    
    tester = CryptoAPITester()
    
    # Run all tests
    test_results = []
    
    print("\n📊 Basic API Tests")
    test_results.append(("Health Check", tester.test_health_check()))
    test_results.append(("Latest Data", tester.test_latest_data()))
    
    print("\n📈 Data Endpoints")
    test_results.append(("Historical Data", tester.test_historical_data()))
    
    print("\n🔮 ML Forecast Endpoints")
    test_results.append(("ARIMA Forecasts", tester.test_arima_forecasts()))
    test_results.append(("Prophet Forecasts", tester.test_prophet_forecasts()))
    test_results.append(("LSTM Forecasts", tester.test_lstm_forecasts()))
    
    print("\n📊 Analytics Endpoints")
    test_results.append(("Volatility", tester.test_volatility()))
    test_results.append(("Sentiment", tester.test_sentiment()))
    
    print("\n💼 User Features")
    test_results.append(("Portfolio", tester.test_portfolio_transactions()))
    test_results.append(("Alerts", tester.test_alerts()))
    
    print("\n❌ Error Handling")
    test_results.append(("Invalid Requests", tester.test_invalid_endpoints()))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    
    for test_name, success in test_results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n📊 Overall Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests Details:")
        for failed in tester.failed_tests:
            print(f"   • {failed['name']}: {failed.get('error', 'Status code mismatch')}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())