import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, X } from 'lucide-react';

/**
 * FilterPanel Component
 * Handles search, filtering, sorting, and export functionality
 * Fully extracted from App.jsx for reusability
 */
function FilterPanel({
  subscriptions,
  searchTerm,
  filterStatus,
  filterCategory,
  filterMinCost,
  filterMaxCost,
  filterStartDate,
  filterEndDate,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onMinCostChange,
  onMaxCostChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onExportCSV,
  onExportPDF,
  darkMode,
}) {
  const { t } = useTranslation();

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterMinCost || filterMaxCost || filterStartDate || filterEndDate;

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-xl p-6 mb-8 transition-all duration-300 ${
      darkMode
        ? 'bg-gray-800/50 backdrop-blur-sm border border-accent-300/20'
        : 'bg-white/80 backdrop-blur-sm border border-gray-200'
    }`}>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Search size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search subscriptions by name"
            className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${
              darkMode
                ? 'bg-gray-700 border-accent-300/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-300/50'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500'
            }`}
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by subscription status"
          className={`px-4 py-2 rounded-lg border transition-all ${
            darkMode
              ? 'bg-gray-700 border-accent-300/30 text-white focus:outline-none focus:ring-2 focus:ring-accent-300/50'
              : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500'
          }`}
        >
          <option value="all">{t('filters.all')} {t('filters.status')}</option>
          <option value="Active">{t('filters.active')}</option>
          <option value="Paused">{t('filters.paused')}</option>
          <option value="Cancelled">{t('filters.cancelled')}</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter by subscription category"
          className={`px-4 py-2 rounded-lg border transition-all ${
            darkMode
              ? 'bg-gray-700 border-accent-300/30 text-white focus:outline-none focus:ring-2 focus:ring-accent-300/50'
              : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500'
          }`}
        >
          <option value="all">{t('filters.all')} {t('filters.category')}</option>
          {[...new Set(subscriptions.map(s => s.category || 'Uncategorized'))].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Min Cost Filter */}
        <input
          type="number"
          placeholder={t('filters.minCost')}
          value={filterMinCost}
          onChange={(e) => onMinCostChange(e.target.value)}
          aria-label="Filter by minimum subscription cost"
          className={`px-4 py-2 rounded-lg border transition-all ${
            darkMode
              ? 'bg-gray-700 border-accent-300/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-300/50'
              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500'
          }`}
        />

        {/* Max Cost Filter */}
        <input
          type="number"
          placeholder={t('filters.maxCost')}
          value={filterMaxCost}
          onChange={(e) => onMaxCostChange(e.target.value)}
          aria-label="Filter by maximum subscription cost"
          className={`px-4 py-2 rounded-lg border transition-all ${
            darkMode
              ? 'bg-gray-700 border-accent-300/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-300/50'
              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500'
          }`}
        />

        {/* Start Date Filter */}
        <input
          type="date"
          value={filterStartDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          aria-label="Filter by start renewal date"
          className={`px-4 py-2 rounded-lg border transition-all ${
            darkMode
              ? 'bg-gray-700 border-accent-300/30 text-white focus:outline-none focus:ring-2 focus:ring-accent-300/50'
              : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500'
          }`}
        />

        {/* End Date Filter */}
        <input
          type="date"
          value={filterEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          aria-label="Filter by end renewal date"
          className={`px-4 py-2 rounded-lg border transition-all ${
            darkMode
              ? 'bg-gray-700 border-accent-300/30 text-white focus:outline-none focus:ring-2 focus:ring-accent-300/50'
              : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500'
          }`}
        />
      </div>

      {/* Export and Clear Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={onExportCSV}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            darkMode
              ? 'bg-accent-300/20 text-accent-300 hover:bg-accent-300/30'
              : 'bg-accent-100 text-accent-700 hover:bg-accent-200'
          }`}
        >
          <Download size={18} />
          Export CSV
        </button>
        <button
          onClick={onExportPDF}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            darkMode
              ? 'bg-accent-300/20 text-accent-300 hover:bg-accent-300/30'
              : 'bg-accent-100 text-accent-700 hover:bg-accent-200'
          }`}
        >
          <Download size={18} />
          Export Report
        </button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterPanel;
