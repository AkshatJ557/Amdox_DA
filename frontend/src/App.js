import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Sidebar } from "./components/Sidebar";

// Import all pages
import HomePage from "./pages/HomePage";
import RealTimePage from "./pages/RealTimePage";
import HistoricalPage from "./pages/HistoricalPage";
import TechnicalAnalysisPage from "./pages/TechnicalAnalysisPage";
import ARIMAPage from "./pages/ARIMAPage";
import ProphetPage from "./pages/ProphetPage";
import LSTMPage from "./pages/LSTMPage";
import VolatilityPage from "./pages/VolatilityPage";
import SentimentPage from "./pages/SentimentPage";
import ComparisonsPage from "./pages/ComparisonsPage";
import PortfolioPage from "./pages/PortfolioPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/real-time" element={<RealTimePage />} />
            <Route path="/historical" element={<HistoricalPage />} />
            <Route path="/technical" element={<TechnicalAnalysisPage />} />
            <Route path="/arima" element={<ARIMAPage />} />
            <Route path="/prophet" element={<ProphetPage />} />
            <Route path="/lstm" element={<LSTMPage />} />
            <Route path="/volatility" element={<VolatilityPage />} />
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/comparisons" element={<ComparisonsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
          </Routes>
        </Sidebar>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
