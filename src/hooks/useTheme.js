import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme on first load
  useEffect(() => {
    const initializeTheme = () => {
      // Check localStorage first
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme) {
        // Use saved theme preference
        const darkMode = savedTheme === 'dark';
        setIsDarkMode(darkMode);
        applyTheme(darkMode);
      } else {
        // Fall back to system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
        applyTheme(systemPrefersDark);
        // Save the system preference
        localStorage.setItem('theme', systemPrefersDark ? 'dark' : 'light');
      }
      
      setIsInitialized(true);
    };

    initializeTheme();
  }, []);

  // Apply theme to HTML element
  const applyTheme = (darkMode) => {
    const htmlElement = document.documentElement;
    
    if (darkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    applyTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Optional: Show toast notification
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('theme-changed', { 
        detail: { theme: newTheme ? 'dark' : 'light' } 
      }));
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if no manual theme preference is saved
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setIsDarkMode(e.matches);
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    isDarkMode,
    toggleTheme,
    isInitialized
  };
}; 