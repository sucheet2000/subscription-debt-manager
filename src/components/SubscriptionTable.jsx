import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, AlertCircle, ArrowUpDown } from 'lucide-react';

/**
 * SubscriptionTable Component
 * Displays active subscriptions in a responsive table format
 * with sorting, editing, and deletion capabilities
 */
function SubscriptionTable({
  subscriptions,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  onToggleCancellation,
  darkMode,
}) {
  const { t } = useTranslation();

  if (subscriptions.length === 0) {
    return (
      <div className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-accent-300/20'
          : 'bg-white border border-gray-200 shadow-md'
      }`}>
        <div className={`px-8 py-6 border-b ${
          darkMode ? 'border-accent-300/10' : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold tracking-tight ${
            darkMode ? 'bg-gradient-to-r from-accent-300 to-accent-200 bg-clip-text text-transparent' : 'text-gray-900'
          }`}>
            {t('table.title')}
          </h2>
          <p className={`text-sm mt-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('table.noActive')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-accent-300/20'
        : 'bg-white border border-gray-200 shadow-md'
    }`}>
      <div className={`px-8 py-6 border-b ${
        darkMode ? 'border-accent-300/10' : 'border-gray-200'
      }`}>
        <h2 className={`text-2xl font-bold tracking-tight ${
          darkMode ? 'bg-gradient-to-r from-accent-300 to-accent-200 bg-clip-text text-transparent' : 'text-gray-900'
        }`}>
          {t('table.title')}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${
            darkMode
              ? 'bg-gray-700/40 border-b border-accent-300/10'
              : 'bg-gray-50 border-b border-gray-200'
          }`}>
            <tr>
              <th
                onClick={() => onSort('name')}
                className={`px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-opacity-50 transition-colors ${
                  darkMode
                    ? 'text-accent-300 hover:bg-gray-600'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {t('table.name')}
                  {sortConfig.key === 'name' && (
                    <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? 'transform rotate-180' : ''} />
                  )}
                </div>
              </th>
              <th
                onClick={() => onSort('cost')}
                className={`px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-opacity-50 transition-colors ${
                  darkMode
                    ? 'text-accent-300 hover:bg-gray-600'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {t('table.cost')}
                  {sortConfig.key === 'cost' && (
                    <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? 'transform rotate-180' : ''} />
                  )}
                </div>
              </th>
              <th className={`hidden sm:table-cell px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide ${
                darkMode ? 'text-accent-300' : 'text-gray-900'
              }`}>
                {t('table.billingCycle')}
              </th>
              <th
                onClick={() => onSort('nextRenewalDate')}
                className={`hidden md:table-cell px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-opacity-50 transition-colors ${
                  darkMode
                    ? 'text-accent-300 hover:bg-gray-600'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {t('table.nextRenewal')}
                  {sortConfig.key === 'nextRenewalDate' && (
                    <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? 'transform rotate-180' : ''} />
                  )}
                </div>
              </th>
              <th className={`hidden md:table-cell px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide ${
                darkMode ? 'text-accent-300' : 'text-gray-900'
              }`}>
                {t('table.category')}
              </th>
              <th className={`px-8 py-4 text-right text-xs font-semibold uppercase tracking-wide ${
                darkMode ? 'text-accent-300' : 'text-gray-900'
              }`}>
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub, index) => (
              <tr
                key={sub.id}
                className={`border-b transition-colors ${
                  darkMode
                    ? `border-accent-300/10 ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-700/20'} hover:bg-gray-700/40 hover:border-accent-300/20`
                    : `border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`
                }`}
              >
                <td className={`px-8 py-4 text-sm font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {sub.name}
                </td>
                <td className={`px-8 py-4 text-sm font-medium ${
                  darkMode ? 'text-accent-300' : 'text-accent-600'
                }`}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: sub.currency || 'USD',
                    minimumFractionDigits: 2,
                  }).format(sub.cost)}
                </td>
                <td className={`hidden sm:table-cell px-8 py-4 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {sub.billingCycle}
                </td>
                <td className={`hidden md:table-cell px-8 py-4 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {new Date(sub.nextRenewalDate).toLocaleDateString()}
                </td>
                <td className={`hidden md:table-cell px-8 py-4 text-sm`}>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    darkMode
                      ? 'bg-accent-300/15 text-accent-300'
                      : 'bg-accent-100 text-accent-700'
                  }`}>
                    {sub.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(sub)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        darkMode
                          ? 'text-accent-300 hover:bg-accent-300/20 hover:shadow-accent-sm'
                          : 'text-accent-600 hover:bg-accent-100'
                      }`}
                      title="Edit subscription"
                    >
                      <Edit2 size={16} className="inline mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => onToggleCancellation(sub)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        darkMode
                          ? 'text-orange-400 hover:bg-orange-500/20'
                          : 'text-orange-600 hover:bg-orange-50'
                      }`}
                      title="Mark for cancellation"
                    >
                      <AlertCircle size={16} className="inline mr-1" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button
                      onClick={() => onDelete(sub.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        darkMode
                          ? 'text-red-400 hover:bg-red-500/20'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title="Delete subscription"
                    >
                      <Trash2 size={16} className="inline mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SubscriptionTable;
