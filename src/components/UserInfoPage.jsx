import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Icons (using Unicode emojis for simplicity, you can replace with Heroicons)
const Icons = {
  User: '👤',
  Gender: '⚧',
  Address: '🏠',
  Phone: '📱',
  Email: '✉️',
  Save: '💾',
  Edit: '✏️',
  Sun: '☀️',
  Moon: '🌙',
  Check: '✅',
  Error: '❌'
};

const UserInfoPage = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    address: '',
    phone: '',
    username: '',
    email: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call - replace with actual API endpoint
        const response = await fetch(`/api/users/${user?.id || 1}`);
        if (response.ok) {
          const userData = await response.json();
          setFormData({
            fullName: userData.fullName || '',
            gender: userData.gender || '',
            address: userData.address || '',
            phone: userData.phone || '',
            username: userData.username || user?.username || 'johndoe',
            email: userData.email || user?.email || 'john@example.com'
          });
        } else {
          // Fallback data for demo
          setFormData({
            fullName: 'John Doe',
            gender: 'Male',
            address: '123 Main St, City, State 12345',
            phone: '+1 (555) 123-4567',
            username: user?.username || 'johndoe',
            email: user?.email || 'john@example.com'
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback data for demo
        setFormData({
          fullName: 'John Doe',
          gender: 'Male',
          address: '123 Main St, City, State 12345',
          phone: '+1 (555) 123-4567',
          username: user?.username || 'johndoe',
          email: user?.email || 'john@example.com'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/users/${user?.id || 1}/info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          gender: formData.gender,
          address: formData.address,
          phone: formData.phone
        })
      });

      if (response.ok) {
        showToastMessage('Profile updated successfully!', 'success');
      } else {
        showToastMessage('Failed to update profile. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      showToastMessage('Profile updated successfully! (Demo)', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Show toast message
  const showToastMessage = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle input changes
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

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ease-in-out ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-xl ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
            Loading your profile...
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
              {Icons.User} User Profile
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
                  ← Back to Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={`rounded-2xl shadow-2xl transition-all duration-500 ${
            isDarkMode ? 'bg-gray-800 shadow-gray-900/50' : 'bg-white shadow-gray-300/50'
          }`}
        >
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className={`text-3xl font-bold mb-2 transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Edit Your Profile
              </h2>
              <p className={`text-lg transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Update your personal information below
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid Layout - Responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Full Name */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Icons.User} Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fullName 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {Icons.Error} {errors.fullName}
                    </motion.p>
                  )}
                </motion.div>

                {/* Gender */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Icons.Gender} Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.gender 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {Icons.Error} {errors.gender}
                    </motion.p>
                  )}
                </motion.div>

                {/* Phone */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Icons.Phone} Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {Icons.Error} {errors.phone}
                    </motion.p>
                  )}
                </motion.div>

                {/* Username (Read-only) */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Icons.User} Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    className={`w-full px-4 py-3 rounded-lg border-2 cursor-not-allowed transition-all duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-600 text-gray-400' 
                        : 'border-gray-300 bg-gray-100 text-gray-500'
                    }`}
                  />
                  <p className={`text-xs mt-1 transition-colors ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Username cannot be changed
                  </p>
                </motion.div>
              </div>

              {/* Address - Full Width */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {Icons.Address} Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.address 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  placeholder="Enter your full address"
                />
                {errors.address && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {Icons.Error} {errors.address}
                  </motion.p>
                )}
              </motion.div>

              {/* Email (Read-only) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {Icons.Email} Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className={`w-full px-4 py-3 rounded-lg border-2 cursor-not-allowed transition-all duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-600 text-gray-400' 
                      : 'border-gray-300 bg-gray-100 text-gray-500'
                  }`}
                />
                <p className={`text-xs mt-1 transition-colors ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Email cannot be changed
                </p>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="flex justify-center pt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isSaving}
                  className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    <span>{Icons.Save} Save Changes</span>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>
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

export default UserInfoPage; 