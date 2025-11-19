import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { validateEmail, validatePasswordStrength, validatePasswordMatch, loginLimiter } from '../utils/securityUtils';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode] = useState(true); // Default to dark mode
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Check rate limiting for this email
      if (loginLimiter.isLimited(normalizedEmail)) {
        const remainingTime = Math.ceil(loginLimiter.getRemainingTime(normalizedEmail) / 1000);
        setError(`Too many attempts. Please try again in ${remainingTime} seconds`);
        setLoading(false);
        return;
      }

      // Validate email format
      const emailValidation = validateEmail(normalizedEmail);
      if (!emailValidation.valid) {
        setError(emailValidation.error);
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        // Register - validate password strength
        const passwordStrength = validatePasswordStrength(password);
        if (!passwordStrength.valid) {
          setError(`Password requirements:\n• ${passwordStrength.errors.join('\n• ')}`);
          setLoading(false);
          return;
        }

        // Validate passwords match
        const passwordMatch = validatePasswordMatch(password, confirmPassword);
        if (!passwordMatch.valid) {
          setError(passwordMatch.error);
          setLoading(false);
          return;
        }

        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      }
    } catch (err) {
      const errorMessages = {
        'auth/email-already-in-use': 'Email: Already registered',
        'auth/invalid-email': 'Email: Invalid format',
        'auth/weak-password': 'Password: Too weak (minimum 6 characters)',
        'auth/user-not-found': 'Email: User not found',
        'auth/wrong-password': 'Password: Incorrect',
        'auth/too-many-requests': 'Login: Too many attempts. Please try again later.',
      };
      setError(errorMessages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors ${
      darkMode ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className={`w-full max-w-md rounded-2xl p-8 shadow-2xl transition-all ${
        darkMode
          ? 'bg-gray-900 border border-accent-300/20'
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold tracking-tight mb-2 ${
            darkMode
              ? 'bg-gradient-to-r from-accent-300 to-accent-200 bg-clip-text text-transparent'
              : 'text-gray-900'
          }`}>
            Subscription Manager
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track and manage your recurring subscriptions
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              isLogin
                ? darkMode
                  ? 'bg-accent-300 text-gray-950 shadow-lg shadow-accent-300/40'
                  : 'bg-accent-500 text-white'
                : darkMode
                  ? 'bg-gray-800 text-gray-400 hover:text-gray-300'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              !isLogin
                ? darkMode
                  ? 'bg-accent-300 text-gray-950 shadow-lg shadow-accent-300/40'
                  : 'bg-accent-500 text-white'
                : darkMode
                  ? 'bg-gray-800 text-gray-400 hover:text-gray-300'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg text-sm font-medium ${
            darkMode
              ? 'bg-red-900/30 border border-red-400/50 text-red-300'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="auth-email" className={`block text-sm font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} size={20} />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all ${
                  darkMode
                    ? 'bg-gray-800 border-accent-300/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-300/50'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500'
                }`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="auth-password" className={`block text-sm font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} size={20} />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-10 pr-12 py-2.5 rounded-lg border transition-all ${
                  darkMode
                    ? 'bg-gray-800 border-accent-300/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-300/50'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {!isLogin && (
            <div>
              <label htmlFor="auth-confirm-password" className={`block text-sm font-semibold mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} size={20} />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all ${
                    darkMode
                      ? 'bg-gray-800 border-accent-300/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-300/50'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500'
                  }`}
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all mt-6 flex items-center justify-center gap-2 ${
              loading
                ? darkMode
                  ? 'bg-accent-300/50 text-gray-950 cursor-not-allowed'
                  : 'bg-accent-500/50 text-white cursor-not-allowed'
                : darkMode
                  ? 'bg-accent-300 text-gray-950 hover:bg-accent-200 hover:shadow-lg hover:shadow-accent-300/40'
                  : 'bg-accent-500 text-white hover:bg-accent-600 shadow-md hover:shadow-lg'
            }`}
          >
            {loading && <Loader size={20} className="animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Credentials */}
        {isLogin && (
          <div className={`mt-6 p-4 rounded-lg text-xs ${
            darkMode
              ? 'bg-gray-800/50 border border-gray-700'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              <span className="font-semibold">Demo Credentials:</span><br />
              Email: demo@example.com<br />
              Password: demo123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
