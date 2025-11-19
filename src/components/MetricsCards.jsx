import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * MetricsCards Component
 * Displays four key metrics cards: Monthly Cost, Future Debt, Active Subscriptions, Budget Status
 */
function MetricsCards({
  totalMonthlyCost,
  futureDebt,
  totalActive,
  pendingCancellations,
  budgetLimit,
  budgetSpent,
  isBudgetExceeded,
  isApproachingBudget,
  metricsCurrency,
  budgetCurrency,
  darkMode,
  onBudgetClick,
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {/* Monthly Cost Card */}
      <div className={`rounded-xl p-7 transition-all duration-300 ${
        darkMode
          ? 'bg-gray-800/50 backdrop-blur-sm border border-accent-300/20 hover:border-accent-300/40 hover:bg-gray-800/70 hover:shadow-accent-md'
          : 'bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-accent-300/50 hover:shadow-lg'
      }`}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {t('metrics.monthlyCost')}
        </p>
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 break-words ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: metricsCurrency,
            minimumFractionDigits: 2,
          }).format(totalMonthlyCost)}
        </p>
        <p className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          {t('metrics.monthlyCostSubtitle')}
        </p>
      </div>

      {/* Future Debt Card */}
      <div className={`rounded-xl p-7 transition-all duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-orange-900/20 to-red-900/10 border border-orange-400/20 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/10'
          : 'bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 hover:shadow-lg'
      }`}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
          darkMode ? 'text-orange-400' : 'text-orange-700'
        }`}>
          {t('metrics.futureDebt')}
        </p>
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 break-words ${
          darkMode ? 'text-orange-300' : 'text-orange-600'
        }`}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: metricsCurrency,
            minimumFractionDigits: 2,
          }).format(futureDebt)}
        </p>
        <p className={`text-xs font-medium ${darkMode ? 'text-orange-400/70' : 'text-orange-700'}`}>
          {t('metrics.futureDebtSubtitle')}
        </p>
      </div>

      {/* Active Subscriptions Card */}
      <div className={`rounded-xl p-7 transition-all duration-300 ${
        darkMode
          ? 'bg-gray-800/50 backdrop-blur-sm border border-accent-300/20 hover:border-accent-300/40 hover:bg-gray-800/70 hover:shadow-accent-md'
          : 'bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-accent-300/50 hover:shadow-lg'
      }`}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {t('metrics.activeSubscriptions')}
        </p>
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 break-words ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {totalActive}
        </p>
        <p className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          {pendingCancellations.length > 0 &&
            `${pendingCancellations.length} ${t('metrics.pendingCancellation')}`}
          {pendingCancellations.length === 0 && t('metrics.noPendingCancellations')}
        </p>
      </div>

      {/* Budget Status Card */}
      <div className={`rounded-xl p-7 transition-all duration-300 cursor-pointer ${
        isBudgetExceeded
          ? darkMode
            ? 'bg-gradient-to-br from-red-900/30 to-red-800/10 border-2 border-red-400/50 hover:border-red-400/70'
            : 'bg-gradient-to-br from-red-50 to-red-50/50 border-2 border-red-300'
          : isApproachingBudget
            ? darkMode
              ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/10 border border-yellow-400/40 hover:border-yellow-400/60'
              : 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-300'
            : darkMode
              ? 'bg-gray-800/50 backdrop-blur-sm border border-accent-300/20 hover:border-accent-300/40 hover:bg-gray-800/70'
              : 'bg-white/80 backdrop-blur-sm border border-gray-200'
      }`} onClick={onBudgetClick}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
          isBudgetExceeded ? (darkMode ? 'text-red-400' : 'text-red-700') :
          isApproachingBudget ? (darkMode ? 'text-yellow-400' : 'text-yellow-700') :
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {t('metrics.budgetStatus')}
        </p>
        {budgetLimit ? (
          <>
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 ${
              isBudgetExceeded ? (darkMode ? 'text-red-300' : 'text-red-600') :
              isApproachingBudget ? (darkMode ? 'text-yellow-300' : 'text-yellow-600') :
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {budgetSpent.toFixed(0)}%
            </p>
            <div className={`w-full h-2 rounded-full mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div className={`h-full rounded-full transition-all ${
                isBudgetExceeded ? 'bg-red-500' :
                isApproachingBudget ? 'bg-yellow-500' :
                'bg-green-500'
              }`} style={{ width: `${Math.min(budgetSpent, 100)}%` }}></div>
            </div>
            <p className={`text-xs font-medium ${
              isBudgetExceeded ? (darkMode ? 'text-red-400/70' : 'text-red-700') :
              isApproachingBudget ? (darkMode ? 'text-yellow-400/70' : 'text-yellow-700') :
              darkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              {isBudgetExceeded ? t('metrics.budgetExceeded') : isApproachingBudget ? t('metrics.approachingBudget') : t('metrics.withinBudget')}
            </p>
          </>
        ) : (
          <div className={`text-sm text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="font-semibold mb-2">{t('metrics.clickToSetBudget')}</p>
            <p className="text-xs">{t('metrics.noBudgetConfigured')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsCards;
