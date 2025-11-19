import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const errorMessages = {
        'auth/popup-closed-by-user': 'Sign-in cancelled',
        'auth/account-exists-with-different-credential': 'Email: An account already exists with this email',
        'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-2 ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}>
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold transition-all ${
            darkMode
              ? 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-300'
              : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 shadow-sm'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

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
