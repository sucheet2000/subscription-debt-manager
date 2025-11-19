/**
 * Security Utilities for Input Validation and Sanitization
 * Protects against: XSS, injection attacks, invalid data
 */

import DOMPurify from 'dompurify';

// ===== INPUT SANITIZATION =====

/**
 * Sanitize string input to prevent XSS attacks
 * Uses DOMPurify for comprehensive HTML/JavaScript filtering
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';

  // Use DOMPurify to remove any potentially dangerous HTML/JavaScript
  // This protects against multiple XSS attack vectors
  const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

  return sanitized.trim();
};

/**
 * Validate and sanitize email address
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email too long (max 254 characters)' };
  }

  return { valid: true, sanitized: email.toLowerCase().trim() };
};

/**
 * Validate subscription name
 */
export const validateSubscriptionName = (name) => {
  const sanitized = sanitizeString(name).trim();

  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (sanitized.length > 200) {
    return { valid: false, error: 'Name too long (max 200 characters)' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate and sanitize cost
 */
export const validateCost = (cost) => {
  const numCost = parseFloat(cost);

  if (isNaN(numCost)) {
    return { valid: false, error: 'Cost must be a number' };
  }

  if (numCost <= 0) {
    return { valid: false, error: 'Cost must be greater than 0' };
  }

  if (numCost > 999999) {
    return { valid: false, error: 'Cost too high (max 999999)' };
  }

  // Round to 2 decimal places
  return { valid: true, sanitized: Math.round(numCost * 100) / 100 };
};

/**
 * Validate currency code
 */
export const validateCurrency = (currency) => {
  const validCurrencies = [
    // Popular
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF',
    // Asia
    'CNY', 'HKD', 'INR', 'IDR', 'KRW', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'TWD', 'VND',
    'BDT', 'PKR', 'LKR', 'MMK', 'KHR', 'LAK',
    // Europe
    'BGN', 'CZK', 'DKK', 'HRK', 'HUF', 'ISK', 'NOK', 'PLN', 'RON', 'RUB', 'SEK', 'TRY', 'UAH',
    // Americas
    'ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU',
    // Middle East
    'AED', 'BHD', 'EGP', 'ILS', 'JOD', 'KWD', 'LBP', 'OMR', 'QAR', 'SAR',
    // Africa
    'GHS', 'ETB', 'KES', 'MAD', 'NGN', 'RWF', 'TZS', 'UGX', 'ZAR', 'ZMW', 'BIF'
  ];
  const sanitized = sanitizeString(currency).toUpperCase().trim();

  if (!validCurrencies.includes(sanitized)) {
    return {
      valid: false,
      error: `Invalid currency. Supported: ${validCurrencies.join(', ')}`
    };
  }

  return { valid: true, sanitized };
};

/**
 * Validate billing cycle
 */
export const validateBillingCycle = (cycle) => {
  const valid = ['Monthly', 'Quarterly', 'Annually'];

  if (!valid.includes(cycle)) {
    return { valid: false, error: 'Billing cycle must be Monthly, Quarterly, or Annually' };
  }

  return { valid: true, sanitized: cycle };
};

/**
 * Validate date is in future
 */
export const validateFutureDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return { valid: false, error: 'Date must be in the future' };
    }

    // Check if date is more than 100 years in future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 100);

    if (date > maxDate) {
      return { valid: false, error: 'Date too far in future (max 100 years)' };
    }

    return { valid: true, sanitized: dateString };
  } catch (error) {
    return { valid: false, error: 'Invalid date format' };
  }
};

/**
 * Validate category
 */
export const validateCategory = (category) => {
  const sanitized = sanitizeString(category).trim();

  if (sanitized.length > 100) {
    return { valid: false, error: 'Category too long (max 100 characters)' };
  }

  return { valid: true, sanitized };
};

// ===== PASSWORD VALIDATION =====

/**
 * Validate password strength
 * Rules: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('At least 1 uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('At least 1 lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('At least 1 number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least 1 special character');
  }

  if (errors.length === 0) {
    return { strength: 'strong', valid: true };
  }

  return {
    strength: errors.length <= 2 ? 'medium' : 'weak',
    valid: false,
    errors
  };
};

/**
 * Check if passwords match
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true };
};

// ===== COMPREHENSIVE SUBSCRIPTION VALIDATION =====

/**
 * Validate entire subscription object
 */
export const validateSubscription = (data) => {
  const errors = {};

  // Validate name
  const nameValidation = validateSubscriptionName(data.name);
  if (!nameValidation.valid) errors.name = nameValidation.error;

  // Validate cost
  const costValidation = validateCost(data.cost);
  if (!costValidation.valid) errors.cost = costValidation.error;

  // Validate currency
  const currencyValidation = validateCurrency(data.currency);
  if (!currencyValidation.valid) errors.currency = currencyValidation.error;

  // Validate billing cycle
  const cycleValidation = validateBillingCycle(data.billingCycle);
  if (!cycleValidation.valid) errors.billingCycle = cycleValidation.error;

  // Validate renewal date
  const dateValidation = validateFutureDate(data.nextRenewalDate);
  if (!dateValidation.valid) errors.nextRenewalDate = dateValidation.error;

  // Validate category (optional)
  if (data.category) {
    const categoryValidation = validateCategory(data.category);
    if (!categoryValidation.valid) errors.category = categoryValidation.error;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    sanitized: {
      name: nameValidation.sanitized,
      cost: costValidation.sanitized,
      currency: currencyValidation.sanitized,
      billingCycle: cycleValidation.sanitized,
      nextRenewalDate: dateValidation.sanitized,
      category: data.category ? validateCategory(data.category).sanitized : '',
      status: data.status || 'Active',
      isAwaitingCancellation: Boolean(data.isAwaitingCancellation)
    }
  };
};

// ===== RATE LIMITING =====

/**
 * Simple rate limiting for login attempts
 * Prevents brute force attacks
 */
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 5 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  isLimited(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(time => now - time < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return true;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return false;
  }

  reset(key) {
    this.attempts.delete(key);
  }

  getRemainingTime(key) {
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;

    const oldestAttempt = userAttempts[0];
    const remaining = this.windowMs - (Date.now() - oldestAttempt);

    return Math.max(0, remaining);
  }
}

export const loginLimiter = new RateLimiter(5, 5 * 60 * 1000); // 5 attempts per 5 minutes

// ===== DATA SANITIZATION HELPERS =====

/**
 * Sanitize subscription data before displaying
 */
export const sanitizeSubscriptionForDisplay = (subscription) => {
  return {
    ...subscription,
    name: sanitizeString(subscription.name),
    category: sanitizeString(subscription.category || ''),
  };
};

/**
 * Remove sensitive data before logging
 */
export const removeSecretData = (obj) => {
  const sanitized = { ...obj };
  delete sanitized.password;
  delete sanitized.accessToken;
  delete sanitized.refreshToken;
  delete sanitized.creditCard;
  return sanitized;
};

export default {
  sanitizeString,
  validateEmail,
  validateSubscriptionName,
  validateCost,
  validateCurrency,
  validateBillingCycle,
  validateFutureDate,
  validateCategory,
  validatePasswordStrength,
  validatePasswordMatch,
  validateSubscription,
  loginLimiter,
  sanitizeSubscriptionForDisplay,
  removeSecretData,
};
