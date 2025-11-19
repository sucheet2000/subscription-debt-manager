import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * SubscriptionForm Component
 * Handles adding and editing subscriptions
 */
export default function SubscriptionForm({
  formData,
  formErrors,
  editingId,
  darkMode,
  onSubmit,
  onClose,
  onChange,
  categories = [
    'Entertainment',
    'SaaS',
    'Health',
    'Productivity',
    'Cloud Storage',
    'Social Media',
    'Education',
    'Other',
  ],
}) {
  const { t } = useTranslation();

  const inputClasses = (hasError) => {
    const baseClasses =
      'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all';
    const darkClasses = `bg-gray-700 border-accent-300/30 text-white placeholder-gray-500 focus:ring-accent-300/50 focus:border-accent-300 ${
      hasError ? 'border-red-500' : ''
    }`;
    const lightClasses = `border-gray-300 focus:ring-accent-500 focus:border-accent-500 ${
      hasError ? 'border-red-500' : ''
    }`;

    return `${baseClasses} ${darkMode ? darkClasses : lightClasses}`;
  };

  const labelClasses = darkMode ? 'text-accent-300' : 'text-gray-900';
  const errorClasses = darkMode ? 'text-red-400' : 'text-red-500';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 border-b px-7 py-6 flex items-center justify-between ${
            darkMode ? 'bg-gray-800 border-accent-300/20' : 'bg-white border-gray-200'
          }`}
        >
          <h3
            className={`text-xl font-bold tracking-tight ${
              darkMode ? 'text-accent-300' : 'text-gray-900'
            }`}
          >
            {editingId ? 'Edit Subscription' : 'Add New Subscription'}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-accent-300'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label="Close form"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-7 space-y-5">
          {/* Name Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClasses}`}>
              Subscription Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="e.g., Netflix Premium"
              className={inputClasses(formErrors.name)}
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? 'name-error' : undefined}
            />
            {formErrors.name && (
              <p className={`text-sm mt-2 font-medium ${errorClasses}`} id="name-error">
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Cost Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClasses}`}>
              Cost *
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => onChange('cost', e.target.value)}
              placeholder="0.00"
              className={inputClasses(formErrors.cost)}
              aria-invalid={!!formErrors.cost}
              aria-describedby={formErrors.cost ? 'cost-error' : undefined}
            />
            {formErrors.cost && (
              <p className={`text-sm mt-2 font-medium ${errorClasses}`} id="cost-error">
                {formErrors.cost}
              </p>
            )}
          </div>

          {/* Currency Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClasses}`}>
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => onChange('currency', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                darkMode
                  ? 'bg-gray-700 border-accent-300/30 text-white focus:ring-accent-300/50 focus:border-accent-300'
                  : 'border-gray-300 focus:ring-accent-500 focus:border-accent-500'
              }`}
            >
              <optgroup label="Popular">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
                <option>AUD</option>
                <option>CAD</option>
                <option>CHF</option>
              </optgroup>

              <optgroup label="Asia Pacific">
                <option>CNY</option>
                <option>HKD</option>
                <option>INR</option>
                <option>IDR</option>
                <option>KRW</option>
                <option>MYR</option>
                <option>NZD</option>
                <option>PHP</option>
                <option>SGD</option>
                <option>THB</option>
                <option>TWD</option>
                <option>VND</option>
                <option>BDT</option>
                <option>PKR</option>
                <option>LKR</option>
                <option>MMK</option>
                <option>KHR</option>
                <option>LAK</option>
              </optgroup>

              <optgroup label="Europe">
                <option>BGN</option>
                <option>CZK</option>
                <option>DKK</option>
                <option>HRK</option>
                <option>HUF</option>
                <option>ISK</option>
                <option>NOK</option>
                <option>PLN</option>
                <option>RON</option>
                <option>RUB</option>
                <option>SEK</option>
                <option>TRY</option>
                <option>UAH</option>
              </optgroup>

              <optgroup label="Americas">
                <option>ARS</option>
                <option>BRL</option>
                <option>CLP</option>
                <option>COP</option>
                <option>MXN</option>
                <option>PEN</option>
                <option>UYU</option>
              </optgroup>

              <optgroup label="Middle East">
                <option>AED</option>
                <option>BHD</option>
                <option>EGP</option>
                <option>ILS</option>
                <option>JOD</option>
                <option>KWD</option>
                <option>LBP</option>
                <option>OMR</option>
                <option>QAR</option>
                <option>SAR</option>
              </optgroup>

              <optgroup label="Africa">
                <option>BIF</option>
                <option>ETB</option>
                <option>GHS</option>
                <option>KES</option>
                <option>MAD</option>
                <option>NGN</option>
                <option>RWF</option>
                <option>TZS</option>
                <option>UGX</option>
                <option>ZAR</option>
                <option>ZMW</option>
              </optgroup>
            </select>
          </div>

          {/* Billing Cycle Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClasses}`}>
              Billing Cycle *
            </label>
            <select
              required
              value={formData.billingCycle}
              onChange={(e) => onChange('billingCycle', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                darkMode
                  ? 'bg-gray-700 border-accent-300/30 text-white focus:ring-accent-300/50 focus:border-accent-300'
                  : 'border-gray-300 focus:ring-accent-500 focus:border-accent-500'
              }`}
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annually</option>
            </select>
          </div>

          {/* Renewal Date Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClasses}`}>
              Next Renewal Date *
            </label>
            <input
              type="date"
              required
              value={formData.nextRenewalDate}
              onChange={(e) => onChange('nextRenewalDate', e.target.value)}
              className={inputClasses(formErrors.nextRenewalDate)}
              aria-invalid={!!formErrors.nextRenewalDate}
              aria-describedby={
                formErrors.nextRenewalDate ? 'renewal-date-error' : undefined
              }
            />
            {formErrors.nextRenewalDate && (
              <p
                className={`text-sm mt-2 font-medium ${errorClasses}`}
                id="renewal-date-error"
              >
                {formErrors.nextRenewalDate}
              </p>
            )}
          </div>

          {/* Category Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClasses}`}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => onChange('category', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                darkMode
                  ? 'bg-gray-700 border-accent-300/30 text-white focus:ring-accent-300/50 focus:border-accent-300'
                  : 'border-gray-300 focus:ring-accent-500 focus:border-accent-500'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${labelClasses}`}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => onChange('status', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                darkMode
                  ? 'bg-gray-700 border-accent-300/30 text-white focus:ring-accent-300/50 focus:border-accent-300'
                  : 'border-gray-300 focus:ring-accent-500 focus:border-accent-500'
              }`}
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                darkMode
                  ? 'bg-gradient-to-r from-accent-300 to-accent-400 text-gray-950 hover:shadow-lg hover:shadow-accent-300/50'
                  : 'bg-accent-500 hover:bg-accent-600 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {editingId ? 'Update' : 'Add'} Subscription
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-accent-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
