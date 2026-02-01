import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, TrendingUp, LineChart, Activity, Brain, 
  BarChart3, Gauge, MessageSquare, GitCompare, 
  Wallet, Menu, X, Bitcoin 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Real-Time', path: '/real-time', icon: TrendingUp },
  { name: 'Historical', path: '/historical', icon: LineChart },
  { name: 'ARIMA Forecast', path: '/arima', icon: Activity },
  { name: 'Prophet Forecast', path: '/prophet', icon: Brain },
  { name: 'LSTM Forecast', path: '/lstm', icon: BarChart3 },
  { name: 'Volatility', path: '/volatility', icon: Gauge },
  { name: 'Sentiment', path: '/sentiment', icon: MessageSquare },
  { name: 'Comparisons', path: '/comparisons', icon: GitCompare },
  { name: 'Portfolio', path: '/portfolio', icon: Wallet },
];

export const Sidebar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: collapsed ? 64 : 256 }}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-col fixed left-0 top-0 h-full border-r border-white/10 bg-zinc-950/90 backdrop-blur-md z-50"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Bitcoin className="w-8 h-8 text-primary" data-testid="crypto-logo" />
              <span className="font-bold text-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>CryptoForecast</span>
            </motion.div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            data-testid="sidebar-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-link-${item.name.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground neon-glow'
                    : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground text-center"
            >
              v1.0 • Built with ML
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 border-r border-white/10 bg-zinc-950 z-50 md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bitcoin className="w-8 h-8 text-primary" />
                  <span className="font-bold text-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>CryptoForecast</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Bitcoin className="w-6 h-6 text-primary" />
            <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>CryptoForecast</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 grid-bg">
          {children}
        </main>
      </div>
    </div>
  );
};
