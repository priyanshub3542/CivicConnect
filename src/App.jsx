import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// React Icons
import { MdDashboard } from 'react-icons/md';
import { HiMenu, HiX, HiSun, HiMoon, HiUser } from 'react-icons/hi';
import { FaUser, FaHome } from 'react-icons/fa';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './hooks/useTheme';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import UserInfoPage from './components/UserInfoPage';
import ReportIssuePage from './components/ReportIssuePage';
import CustomCursor from './components/CustomCursor';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Live Location Map Component
const LiveLocationMap = ({ isDarkMode }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLoading(false);
      return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Location not available';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  if (isLoading) {
    return (
      <div className={`rounded-xl h-96 flex items-center justify-center transition-all duration-500 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Loading your location...
          </p>
        </div>
      </div>
    );
  }

  if (locationError || !userLocation) {
    return (
      <div className={`rounded-xl h-96 flex items-center justify-center transition-all duration-500 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">📍</div>
          <h3 className={`text-2xl font-semibold mb-2 transition-colors ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Location not available
          </h3>
          <p className={`transition-colors ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {locationError || 'Please enable location access to view the map'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="live-location-map" className="rounded-xl overflow-hidden h-96 w-full">
      <MapContainer
        center={userLocation}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={userLocation}>
          <Popup>
            <div className="text-center">
              <strong>Your Location</strong>
              <br />
              <span className="text-sm text-gray-600">
                Lat: {userLocation[0].toFixed(4)}, Lng: {userLocation[1].toFixed(4)}
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-xl transition-colors duration-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Main Landing Page Component
const LandingPage = ({ isDarkMode, toggleTheme }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: false,
      offset: 100,
      delay: 0,
      disable: false,
      mirror: true,
      anchorPlacement: 'top-bottom',
      startEvent: 'DOMContentLoaded',
      animatedClassName: 'aos-animate',
      debounceDelay: 50,
      throttleDelay: 99,
    });

    AOS.refresh();
  }, [isDarkMode]);

  // Handle navigation
  const handleReportIssue = () => {
    if (isAuthenticated) {
      window.location.href = '/report-issue';
    } else {
      setAuthModalMode('login');
      setAuthModalOpen(true);
    }
  };

  const handleViewMap = () => {
    // Scroll to the live map section
    const mapSection = document.getElementById('live-map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };



  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`min-h-screen transition-colors duration-300 ease-in-out ${
      isDarkMode ? 'dark-mode' : ''
      }`}
    >
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`sticky top-0 z-50 content-layer transition-colors duration-300 ease-in-out backdrop-blur-sm shadow-lg ${
          isDarkMode ? 'bg-gray-800/90 shadow-gray-900/50' : 'bg-white/90 shadow-gray-200/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/civic-icon.png" 
                alt="Civic Connect Logo" 
                className="w-8 h-8"
              />
              <div className="civic-logo-container">
                <div className="civic-logo-text text-xl md:text-2xl font-bold text-black-600 cursor-glow text-glow">
                  <span className="text-blue-600">Civic</span> Connect
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {!isAuthenticated ? (
                <>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogin} 
                    className={`transition-all duration-300 ease-in-out cursor-glow font-medium px-3 py-2 rounded-md ${
                      isDarkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700/30' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                  >
                    Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRegister}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl cursor-glow"
                  >
                    Sign Up
                  </motion.button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/dashboard">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl cursor-glow"
                    >
                      Dashboard
                    </motion.button>
                  </Link>
                  <Link to="/user-info">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl cursor-glow"
                    >
                      User Info
                    </motion.button>
                  </Link>
                </div>
              )}
              
              {/* Desktop Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl ${
                  isDarkMode 
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                    : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
              </motion.button>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Mobile Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-300 ease-in-out ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
              </motion.button>

              {/* Mobile Menu Icons for Authenticated Users */}
              {isAuthenticated && (
                <>
                  <Link to="/dashboard">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-2 rounded-full transition-all duration-300 ease-in-out ${
                        isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      }`}
                      title="Dashboard"
                    >
                      <MdDashboard className="w-5 h-5" />
                    </motion.button>
                  </Link>
                  
                  <Link to="/user-info">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-2 rounded-full transition-all duration-300 ease-in-out ${
                        isDarkMode 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                      title="User Info"
                    >
                      <HiUser className="w-5 h-5" />
                    </motion.button>
                  </Link>
                </>
              )}

              {/* Mobile Hamburger Menu */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-full transition-all duration-300 ease-in-out ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {mobileMenuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`md:hidden border-t transition-colors duration-300 ease-in-out ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className="py-4 space-y-2">
                  {!isAuthenticated ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleLogin();
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ease-in-out ${
                          isDarkMode 
                            ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700/30' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                        }`}
                      >
                        Login
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleRegister();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg"
                      >
                        Sign Up
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg text-center"
                        >
                          Dashboard
                        </motion.div>
                      </Link>
                      
                      <Link to="/user-info" onClick={() => setMobileMenuOpen(false)}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-lg text-center"
                        >
                          User Info
                        </motion.div>
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 perspective-dots transition-colors duration-300 ease-in-out ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dotted-bg-3d' 
          : 'bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 dotted-bg-3d'
      }`}>
        <div className="content-layer">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center mb-6 hero-glow"
          >
            <motion.img 
              whileHover={{ scale: 1.1, rotate: 5 }}
              src="/civic-icon.png" 
              alt="Civic Connect Logo" 
              className="w-16 h-16 mr-4 cursor-glow drop-shadow-xl"
            />
            <div className="civic-logo-container">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className={`civic-logo-text text-4xl sm:text-5xl lg:text-6xl font-bold transition-colors text-glow cursor-glow drop-shadow-2xl ${
                isDarkMode ? 'text-black-900' : 'text-black-900'
                }`}
              >
                <motion.span 
                  className={`transition-colors pulse-glow ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}
                  animate={{ 
                    textShadow: [
                      '0 0 20px rgba(59, 130, 246, 0.5)',
                      '0 0 30px rgba(59, 130, 246, 0.8)',
                      '0 0 20px rgba(59, 130, 246, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Civic
                </motion.span> Connect
              </motion.h1>
            </div>
          </motion.div>
          <p 
            className={`text-xl sm:text-2xl mb-8 max-w-3xl mx-auto transition-colors ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
            data-aos="fade-up-glow"
            data-aos-delay="300"
            data-aos-duration="800"
          >
            Empowering citizens to build cleaner, smarter cities.
          </p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReportIssue}
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white cursor-glow"
            >
              Report an Issue
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewMap}
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white cursor-glow"
            >
              View Map
            </motion.button>
          </motion.div>
        </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 grid-3d-bg transition-all duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-16"
            data-aos="fade-up-glow"
            data-aos-duration="800"
          >
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 transition-colors text-glow ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              How Civic Connect Works
            </h2>
            <p className={`text-xl max-w-2xl mx-auto transition-colors ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              A comprehensive platform designed to streamline civic issue reporting and resolution
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 shadow-md hover:shadow-2xl cursor-glow border border-blue-200/50 hover:border-blue-300/80"
            >
              <motion.div 
                className="text-4xl mb-4"
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                📍
              </motion.div>
              <h3 className={`text-xl font-semibold mb-2 transition-colors text-glow ${
                isDarkMode ? 'text-grey-900' : 'text-black-900'
              }`}>
                Location-based Reporting
              </h3>
              <p className={`transition-colors ${
                isDarkMode ? 'text-gray-900' : 'text-gray-900'
              }`}>
                Report issues with precise GPS coordinates and interactive mapping
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 shadow-md hover:shadow-2xl cursor-glow border border-green-200/50 hover:border-green-300/80"
            >
              <motion.div 
                className="text-4xl mb-4"
                whileHover={{ scale: 1.2, rotate: -5 }}
                transition={{ duration: 0.3 }}
              >
                🧾
              </motion.div>
              <h3 className={`text-xl font-semibold mb-2 transition-colors text-glow ${
                isDarkMode ? 'text-black-900' : 'text-gray-900'
              }`}>
                Real-time Dashboard
              </h3>
              <p className={`transition-colors ${
                isDarkMode ? 'text-grey-900' : 'text-gray-900'
              }`}>
                Public dashboard showing all reported issues and their current status
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-300 shadow-md hover:shadow-2xl cursor-glow border border-purple-200/50 hover:border-purple-300/80"
            >
              <motion.div 
                className="text-4xl mb-4"
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                ✅
              </motion.div>
              <h3 className={`text-xl font-semibold mb-2 transition-colors text-glow ${
                isDarkMode ? 'text-black-900' : 'text-gray-900'
              }`}>
                Admin Tracking System
              </h3>
              <p className={`transition-colors ${
                isDarkMode ? 'text-gray-900' : 'text-gray-600'
              }`}>
                Municipal bodies can verify, track, and update issue resolution status
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 transition-all duration-300 shadow-md hover:shadow-2xl cursor-glow border border-orange-200/50 hover:border-orange-300/80"
            >
              <motion.div 
                className="text-4xl mb-4"
                whileHover={{ scale: 1.2, rotate: -10 }}
                transition={{ duration: 0.3 }}
              >
                🗳️
              </motion.div>
              <h3 className={`text-xl font-semibold mb-2 transition-colors text-glow ${
                isDarkMode ? 'text-black-900' : 'text-gray-900'
              }`}>
                Community Upvotes
              </h3>
              <p className={`transition-colors ${
                isDarkMode ? 'text-gray-900' : 'text-gray-600'
              }`}>
                Citizens can upvote issues to help prioritize urgent problems
              </p>
            </motion.div>
          </div>
        </div>
        </div>
      </section>

      {/* Screenshot Mockup Section */}
      <section 
        id="live-map-section"
        className={`py-20 perspective-dots transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800' 
          : 'bg-gradient-to-r from-blue-50 to-green-50'
        }`}
      >
        <div className="content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            className={`text-3xl sm:text-4xl font-bold mb-8 transition-colors text-glow ${
              isDarkMode ? 'text-gray-900' : 'text-gray-900'
            }`}
            data-aos="fade-up-glow"
            data-aos-duration="800"
          >
            Your Location Live Map
          </h2>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`rounded-2xl p-8 max-w-4xl mx-auto transition-all duration-500 shadow-2xl hover:shadow-3xl ${
              isDarkMode ? 'bg-gray-800 shadow-gray-900/50' : 'bg-white shadow-gray-300/50'
            }`}
          >
            <LiveLocationMap isDarkMode={isDarkMode} />
          </motion.div>
        </div>
        </div>
      </section>

      {/* About Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`py-20 content-layer transition-all duration-500 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-3xl sm:text-4xl font-bold mb-8 transition-colors text-glow ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Our Mission
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-xl leading-relaxed mb-8 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Civic Connect bridges the gap between citizens and civic bodies by simplifying how local issues are reported and resolved. 
              We believe in the power of community-driven solutions and transparent governance to create better cities for everyone.
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`text-center p-6 rounded-xl cursor-glow transition-all duration-300 shadow-lg hover:shadow-2xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 hover:border-gray-500' 
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <motion.div 
                  className="text-4xl mb-4"
                  whileHover={{ scale: 1.3, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  🏙️
                </motion.div>
                <h3 className={`text-xl font-semibold mb-2 transition-colors text-glow ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Better Cities</h3>
                <p className={`transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Creating cleaner, safer, and more livable urban environments</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className={`text-center p-6 rounded-xl cursor-glow transition-all duration-300 shadow-lg hover:shadow-2xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 hover:border-gray-500' 
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <motion.div 
                  className="text-4xl mb-4"
                  whileHover={{ scale: 1.3, rotate: -10 }}
                  transition={{ duration: 0.3 }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                >
                  🤝
                </motion.div>
                <h3 className={`text-xl font-semibold mb-2 transition-colors text-glow ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Community Engagement</h3>
                <p className={`transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Empowering citizens to actively participate in city improvement</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className={`text-center p-6 rounded-xl cursor-glow transition-all duration-300 shadow-lg hover:shadow-2xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 hover:border-gray-500' 
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <motion.div 
                  className="text-4xl mb-4"
                  whileHover={{ scale: 1.3, rotate: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  📊
                </motion.div>
                <h3 className={`text-xl font-semibold mb-2 transition-colors text-glow ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Transparency</h3>
                <p className={`transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Providing clear visibility into issue resolution processes</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className={`py-12 content-layer text-white transition-colors duration-300 ease-in-out shadow-2xl ${
          isDarkMode ? 'bg-gray-900 shadow-black/50' : 'bg-gray-900 shadow-gray-900/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="col-span-1 md:col-span-2"
            >
              <motion.div 
                className="flex items-center mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <motion.img 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  src="/civic-icon.png" 
                  alt="Civic Connect Logo" 
                  className="w-8 h-8 mr-3 drop-shadow-lg"
                />
                <div className="text-2xl font-bold text-blue-400 text-glow drop-shadow-lg">Civic Connect</div>
              </motion.div>
              <p className="text-gray-400 mb-4">
                Empowering citizens to build cleaner, smarter cities through technology and community collaboration.
              </p>
              <div className="flex space-x-4">
                <motion.button 
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-gray-800"
                >
                  <span className="sr-only">Facebook</span>
                  📘
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-gray-800"
                >
                  <span className="sr-only">Twitter</span>
                  🐦
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-gray-800"
                >
                  <span className="sr-only">Instagram</span>
                  📷
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-glow drop-shadow-lg">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <motion.button 
                    whileHover={{ scale: 1.05, x: 5 }}
                    onClick={handleReportIssue} 
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:drop-shadow-lg"
                  >
                    Report Issue
                  </motion.button>
                </li>
                <li>
                  <motion.button 
                    whileHover={{ scale: 1.05, x: 5 }}
                    onClick={handleViewMap} 
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:drop-shadow-lg"
                  >
                    View Map
                  </motion.button>
                </li>
                <li>
                  <motion.button 
                    whileHover={{ scale: 1.05, x: 5 }}
                    onClick={handleLogin} 
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:drop-shadow-lg"
                  >
                    Login
                  </motion.button>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-glow drop-shadow-lg">Contact</h3>
              <p className="text-gray-400 mb-2">
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  href="mailto:contact@civicconnect.com" 
                  className="hover:text-white transition-all duration-300 hover:drop-shadow-lg"
                >
                  contact@civicconnect.com
                </motion.a>
              </p>
              <p className="text-gray-400">
                Building better communities together
              </p>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="border-t border-gray-800 mt-8 pt-8 text-center"
          >
            <p className="text-gray-400 drop-shadow-lg">
              © 2024 Civic Connect. All rights reserved.
            </p>
          </motion.div>
        </div>
      </motion.footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </motion.div>
  );
};

// Main App Component
function App() {
  const { isDarkMode, toggleTheme, isInitialized } = useTheme();

  // Show loading screen while theme is being initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App transition-colors duration-300 ease-in-out">
          {/* Custom Cursor Effect */}
          <CustomCursor />
          
          <Routes>
            <Route 
              path="/" 
              element={
                <LandingPage 
                  isDarkMode={isDarkMode} 
                  toggleTheme={toggleTheme} 
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-info" 
              element={
                <ProtectedRoute>
                  <UserInfoPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/report-issue" 
              element={
                <ProtectedRoute>
                  <ReportIssuePage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
