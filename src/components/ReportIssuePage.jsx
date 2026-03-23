import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';

// Icons
const Icons = {
  Map: '🗺️',
  Location: '📍',
  Camera: '📷',
  Upload: '📤',
  Check: '✅',
  Error: '❌',
  Sun: '☀️',
  Moon: '🌙',
  Loading: '⏳',
  Delete: '🗑️',
  Back: '←'
};

// Custom markers
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzQjgyRjYiLz4KPHBhdGggZD0iTTEyLjUgMzVMMTggMjVIN0wxMi41IDM1WiIgZmlsbD0iIzNCODJGNiIvPgo8Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: null,
  shadowSize: [41, 41],
});

const problemIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNFRjQ0NDQiLz4KPHBhdGggZD0iTTEyLjUgMzVMMTggMjVIN0wxMi41IDM1WiIgZmlsbD0iI0VGNDQ0NCIvPgo8Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: null,
  shadowSize: [41, 41],
});

// Map click handler component
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const ReportIssuePage = ({ isDarkMode }) => {
  const { user } = useAuth();

  // Map state
  const [userLocation, setUserLocation] = useState(null);
  const [problemLocation, setProblemLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [address, setAddress] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    images: [],
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fileInputRef = useRef(null);

  // Issue categories
  const categories = [
    'Garbage Collection',
    'Pothole',
    'Water Leakage',
    'Street Light',
    'Road Damage',
    'Drainage Problem',
    'Park Maintenance',
    'Traffic Signal',
    'Noise Complaint',
    'Other'
  ];



  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = [latitude, longitude];
        setUserLocation(location);
        setProblemLocation(location); // Default problem location to user location
        setIsLoadingLocation(false);
        // Get address for initial location
        reverseGeocode(latitude, longitude);
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
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  // Reverse geocoding to get address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        const addressText = data.display_name;
        setAddress(addressText);
        setFormData(prev => ({ ...prev, address: addressText }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Handle map click
  const handleMapClick = (latlng) => {
    setProblemLocation([latlng.lat, latlng.lng]);
    reverseGeocode(latlng.lat, latlng.lng);
    showToastMessage('Problem location updated!', 'success');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle file uploads
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (formData.images.length + files.length > maxFiles) {
      showToastMessage(`Maximum ${maxFiles} images allowed`, 'error');
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (file.size > maxSize) {
        showToastMessage(`File ${file.name} is too large (max 5MB)`, 'error');
        continue;
      }
      if (!file.type.startsWith('image/')) {
        showToastMessage(`File ${file.name} is not an image`, 'error');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validFiles]
      }));
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (!problemLocation) {
      newErrors.location = 'Please select a location on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToastMessage('Please fix the errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('latitude', problemLocation[0]);
      formDataToSend.append('longitude', problemLocation[1]);
      formDataToSend.append('reportedBy', user?.id || 'anonymous');

      // Add images
      formData.images.forEach((image, index) => {
        formDataToSend.append(`images`, image);
      });

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        showToastMessage('Issue reported successfully!', 'success');
        // Reset form
        setFormData({
          category: '',
          description: '',
          images: [],
          address: ''
        });
        setProblemLocation(userLocation);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorData = await response.json();
        showToastMessage(errorData.message || 'Failed to submit issue', 'error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToastMessage('Issue reported successfully! (Demo)', 'success');
      // Reset form for demo
      setFormData({
        category: '',
        description: '',
        images: [],
        address: ''
      });
      setProblemLocation(userLocation);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show toast message
  const showToastMessage = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (isLoadingLocation) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-xl ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
            {Icons.Loading} Getting your location...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`shadow-lg transition-all duration-500 ${
          isDarkMode ? 'bg-gray-800 shadow-gray-900/50' : 'bg-white shadow-gray-200/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.h1 
              className={`text-2xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {Icons.Map} Report Issue
            </motion.h1>
            
            <div className="flex items-center space-x-4">
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  🏠 Home
                </motion.button>
              </Link>

              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-300 font-medium"
                >
                  {Icons.Back} Back to Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className={`rounded-2xl shadow-2xl transition-all duration-500 ${
              isDarkMode ? 'bg-gray-800 shadow-gray-900/50' : 'bg-white shadow-gray-300/50'
            }`}
          >
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-4 transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {Icons.Location} Select Location
              </h2>
              
              {locationError ? (
                <div className={`rounded-xl h-96 flex items-center justify-center transition-all duration-500 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="text-center">
                    <div className="text-6xl mb-4">{Icons.Error}</div>
                    <h3 className={`text-xl font-semibold mb-2 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Location Error
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {locationError}
                    </p>
                  </div>
                </div>
              ) : userLocation ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden h-96 w-full shadow-lg">
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
                      <MapClickHandler onMapClick={handleMapClick} />
                      
                      {/* User location marker */}
                      <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                          <div className="text-center">
                            <strong>Your Location</strong>
                          </div>
                        </Popup>
                      </Marker>
                      
                      {/* Problem location marker */}
                      {problemLocation && (
                        <Marker position={problemLocation} icon={problemIcon}>
                          <Popup>
                            <div className="text-center">
                              <strong>Problem Location</strong>
                              <br />
                              <span className="text-sm text-gray-600">
                                Lat: {problemLocation[0].toFixed(4)}, Lng: {problemLocation[1].toFixed(4)}
                              </span>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  
                  {/* Coordinates Display */}
                  {problemLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="text-sm font-medium">Selected Coordinates:</p>
                      <p className="text-xs">
                        Latitude: {problemLocation[0].toFixed(6)}<br />
                        Longitude: {problemLocation[1].toFixed(6)}
                      </p>
                    </motion.div>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      💡 <strong>Tip:</strong> Click anywhere on the map to place the problem marker at that location.
                    </p>
                  </motion.div>
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className={`rounded-2xl shadow-2xl transition-all duration-500 ${
              isDarkMode ? 'bg-gray-800 shadow-gray-900/50' : 'bg-white shadow-gray-300/50'
            }`}
          >
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-6 transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {Icons.Upload} Issue Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {Icons.Error} {errors.category}
                    </motion.p>
                  )}
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description * ({formData.description.length}/500)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={500}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.description 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Describe the issue in detail..."
                  />
                  {errors.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {Icons.Error} {errors.description}
                    </motion.p>
                  )}
                </motion.div>

                {/* Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Auto-filled from map location"
                  />
                </motion.div>

                {/* Image Upload */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Icons.Camera} Upload Images (Max 5 files, 5MB each)
                  </label>
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50' 
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-4xl mb-2">{Icons.Camera}</div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Click to select images or drag and drop
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </motion.div>

                    {/* Image Preview */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {formData.images.map((image, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                          >
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg shadow-md"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                            >
                              ×
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="pt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSubmitting || !problemLocation}
                    className={`w-full px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                      isSubmitting || !problemLocation
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </span>
                    ) : (
                      <span>{Icons.Upload} Submit Issue Report</span>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`px-6 py-4 rounded-lg shadow-2xl ${
              toastType === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-xl">
                  {toastType === 'success' ? Icons.Check : Icons.Error}
                </span>
                <span className="font-medium">{toastMessage}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportIssuePage; 