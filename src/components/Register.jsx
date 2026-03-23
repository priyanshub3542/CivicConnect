import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Register = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const result = await register(formData.email, formData.password);
      
      if (result.success) {
        onClose();
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, text: '' };
    
    let strength = 0;
    let feedback = [];

    if (password.length >= 6) strength += 1;
    else feedback.push('at least 6 characters');

    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push('lowercase letter');

    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push('uppercase letter');

    if (/\d/.test(password)) strength += 1;
    else feedback.push('number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;

    const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return {
      strength,
      text: strengthTexts[Math.min(strength, 4)],
      color: strengthColors[Math.min(strength, 4)],
      feedback: feedback.length > 0 ? `Need: ${feedback.join(', ')}` : 'Strong password!'
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/civic-icon.png" 
              alt="Civic Connect" 
              className="w-12 h-12 mr-3"
            />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Join Civic Connect
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account to start reporting civic issues
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.email 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.password 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
              placeholder="Create a strong password"
              disabled={isLoading}
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {passwordStrength.text}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {passwordStrength.feedback}
                </p>
              </div>
            )}
            
            {errors.password && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.confirmPassword 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                  : formData.confirmPassword && formData.password === formData.confirmPassword
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-green-600 dark:text-green-400 text-sm mt-1 flex items-center">
                <span className="mr-1">✓</span> Passwords match
              </p>
            )}
            {errors.confirmPassword && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 