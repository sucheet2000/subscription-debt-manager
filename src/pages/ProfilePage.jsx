import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { updatePassword, updateEmail } from 'firebase/auth';
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export default function ProfilePage({ onBack, darkMode }) {
  const { t } = useTranslation();
  const { user: authUser, logout } = useUser();

  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail) {
      showMessage(t('profile.emailRequired', 'Please enter a new email'), 'error');
      return;
    }

    setLoading(true);
    try {
      await updateEmail(authUser, newEmail);
      setNewEmail('');
      showMessage(t('profile.emailUpdated', 'Email updated successfully'), 'success');
    } catch (error) {
      const errorMessages = {
        'auth/invalid-email': t('validation.invalidEmail', 'Invalid email address'),
        'auth/email-already-in-use': t('validation.emailInUse', 'Email is already in use'),
        'auth/requires-recent-login': t('profile.requiresRecentLogin', 'Please log out and log in again to change email'),
      };
      showMessage(
        errorMessages[error.code] || error.message,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showMessage(t('profile.passwordRequired', 'Please fill in all password fields'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(t('profile.passwordsMismatch', 'Passwords do not match'), 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage(t('profile.passwordTooShort', 'Password must be at least 6 characters'), 'error');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(authUser, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showMessage(t('profile.passwordUpdated', 'Password updated successfully'), 'success');
    } catch (error) {
      const errorMessages = {
        'auth/weak-password': t('validation.weakPassword', 'Password is too weak'),
        'auth/requires-recent-login': t('profile.requiresRecentLogin', 'Please log out and log in again to change password'),
      };
      showMessage(
        errorMessages[error.code] || error.message,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t('profile.confirmLogout', 'Are you sure you want to log out?'))) {
      try {
        await logout();
      } catch (error) {
        showMessage(t('profile.logoutError', 'Failed to log out'), 'error');
      }
    }
  };

  const containerBg = darkMode
    ? 'bg-gray-800/50 border-accent-300/20'
    : 'bg-white/80 border-gray-200';
  const inputBg = darkMode
    ? 'bg-gray-700 border-accent-300/30 text-white'
    : 'bg-gray-50 border-gray-300 text-gray-900';
  const tabActiveColor = darkMode
    ? 'border-accent-300 text-accent-300'
    : 'border-accent-500 text-accent-500';

  return (
    <div className={`rounded-xl border transition-all duration-300 ${containerBg}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className={`text-xl sm:text-2xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('profile.title', 'Account Settings')}
              </h1>
              <p className={`text-xs sm:text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {authUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors w-full sm:w-auto ${
              darkMode
                ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">{t('profile.logout', 'Logout')}</span>
            <span className="sm:hidden">{t('profile.logout', 'Logout')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex-1 px-2 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-base border-b-2 transition-colors ${
            activeTab === 'account'
              ? `border-b-2 ${tabActiveColor}`
              : `border-b-2 border-transparent ${
                darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <User size={18} />
            <span className="hidden sm:inline">{t('profile.accountSettings', 'Account Settings')}</span>
            <span className="sm:hidden">{t('profile.account', 'Account')}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 px-2 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-base border-b-2 transition-colors ${
            activeTab === 'security'
              ? `border-b-2 ${tabActiveColor}`
              : `border-b-2 border-transparent ${
                darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Lock size={18} />
            <span className="hidden sm:inline">{t('profile.securitySettings', 'Security')}</span>
            <span className="sm:hidden">{t('profile.security', 'Security')}</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              messageType === 'success'
                ? darkMode
                  ? 'bg-green-900/30 border border-green-400/50 text-green-300'
                  : 'bg-green-50 border border-green-200 text-green-700'
                : messageType === 'error'
                ? darkMode
                  ? 'bg-red-900/30 border border-red-400/50 text-red-300'
                  : 'bg-red-50 border border-red-200 text-red-700'
                : darkMode
                ? 'bg-blue-900/30 border border-blue-400/50 text-blue-300'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}
          >
            {messageType === 'success' ? (
              <Check size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Account Settings Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('profile.emailManagement', 'Email Management')}
              </h2>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('profile.currentEmail', 'Current Email')}
                  </label>
                  <div className={`px-4 py-2.5 rounded-lg border ${inputBg} cursor-not-allowed opacity-60`}>
                    {authUser?.email}
                  </div>
                </div>
                <div>
                  <label htmlFor="profile-new-email" className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('profile.newEmail', 'New Email')}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} size={20} />
                    <input
                      id="profile-new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t('profile.enterNewEmail', 'Enter your new email')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all ${inputBg} placeholder-gray-500 focus:outline-none focus:ring-2 ${
                        darkMode ? 'focus:ring-accent-300/50' : 'focus:ring-accent-500'
                      }`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !newEmail}
                  className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all ${
                    loading || !newEmail
                      ? darkMode
                        ? 'bg-accent-300/50 text-gray-950 cursor-not-allowed'
                        : 'bg-accent-500/50 text-white cursor-not-allowed'
                      : darkMode
                      ? 'bg-accent-300 text-gray-950 hover:bg-accent-200'
                      : 'bg-accent-500 text-white hover:bg-accent-600'
                  }`}
                >
                  {loading ? t('profile.updating', 'Updating...') : t('profile.updateEmail', 'Update Email')}
                </button>
              </form>
            </div>
          </div>
        )}


        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('profile.changePassword', 'Change Password')}
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="profile-new-password" className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('profile.newPassword', 'New Password')}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} size={20} />
                    <input
                      id="profile-new-password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('profile.enterNewPassword', 'Enter new password')}
                      className={`w-full pl-10 pr-12 py-2.5 rounded-lg border transition-all ${inputBg} placeholder-gray-500 focus:outline-none focus:ring-2 ${
                        darkMode ? 'focus:ring-accent-300/50' : 'focus:ring-accent-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      aria-label={showPasswords.new ? 'Hide new password' : 'Show new password'}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                        darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-confirm-password" className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('profile.confirmPassword', 'Confirm Password')}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} size={20} />
                    <input
                      id="profile-confirm-password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('profile.confirmNewPassword', 'Confirm new password')}
                      className={`w-full pl-10 pr-12 py-2.5 rounded-lg border transition-all ${inputBg} placeholder-gray-500 focus:outline-none focus:ring-2 ${
                        darkMode ? 'focus:ring-accent-300/50' : 'focus:ring-accent-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      aria-label={showPasswords.confirm ? 'Hide confirm password' : 'Show confirm password'}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                        darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all ${
                    loading || !newPassword || !confirmPassword
                      ? darkMode
                        ? 'bg-accent-300/50 text-gray-950 cursor-not-allowed'
                        : 'bg-accent-500/50 text-white cursor-not-allowed'
                      : darkMode
                      ? 'bg-accent-300 text-gray-950 hover:bg-accent-200'
                      : 'bg-accent-500 text-white hover:bg-accent-600'
                  }`}
                >
                  {loading ? t('profile.updating', 'Updating...') : t('profile.updatePassword', 'Update Password')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
