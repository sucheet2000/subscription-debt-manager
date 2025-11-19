/**
 * Debouncing Utility
 * Provides functions to limit how often expensive operations run
 * Greatly improves performance for search, filter, and sort operations
 */

import { useState, useEffect } from 'react';

/**
 * Basic debounce function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   performExpensiveSearch(query);
 * }, 500);
 *
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * React Hook for debouncing values
 * Automatically debounces state updates
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {any} Debounced value
 *
 * @example
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearchTerm = useDebounce(searchInput, 500);
 *
 * useEffect(() => {
 *   // This runs only after user stops typing for 500ms
 *   performSearch(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle function - limits function calls to once per interval
 * Similar to debounce but calls on a regular interval instead
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds (default: 300)
 * @returns {Function} Throttled function
 *
 * @example
 * const throttledResize = throttle(() => {
 *   recalculateLayout();
 * }, 100);
 *
 * window.addEventListener('resize', throttledResize);
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;

  return function throttled(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * React Hook for throttling values
 * Less aggressive than debounce - calls on regular intervals
 * @param {any} value - Value to throttle
 * @param {number} limit - Limit in milliseconds (default: 300)
 * @returns {any} Throttled value
 */
export const useThrottle = (value, limit = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledValue(value);
    }, limit);

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
};

/**
 * Memoization helper - caches function results
 * Useful for expensive calculations
 * @param {Function} func - Function to memoize
 * @returns {Function} Memoized function
 *
 * @example
 * const memoizedCalc = memoize((n) => expensiveCalculation(n));
 * memoizedCalc(5); // Calculates
 * memoizedCalc(5); // Returns cached result
 */
export const memoize = (func) => {
  const cache = new Map();

  return function memoized(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

export default {
  debounce,
  useDebounce,
  throttle,
  useThrottle,
  memoize,
};
