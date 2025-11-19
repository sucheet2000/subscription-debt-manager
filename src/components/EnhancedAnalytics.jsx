import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import BillingCyclePieChart from './BillingCyclePieChart';

export default function EnhancedAnalytics({
  subscriptions,
  monthlyTrendData,
  darkMode,
  analyticsCurrency,
  setAnalyticsCurrency,
}) {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState('trend');
  const [sortColumn, setSortColumn] = useState('totalMonthly');
  const [sortDirection, setSortDirection] = useState('desc');

  if (!subscriptions || subscriptions.length === 0) {
    return null;
  }

  // Currency formatting helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: analyticsCurrency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Category color mapping
  const getCategoryColor = (category) => {
    const colors = {
      'Entertainment': '#8b5cf6',
      'Productivity': '#06b6d4',
      'Social Media': '#ec4899',
      'Utilities': '#10b981',
      'Other': '#6366f1',
      'default': '#0066ff',
    };
    return colors[category] || colors['default'];
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Calculate spending trend metrics
  const calculateTrend = () => {
    if (monthlyTrendData.length < 2) return null;

    const lastMonth = monthlyTrendData[monthlyTrendData.length - 1]?.cost || 0;
    const prevMonth = monthlyTrendData[monthlyTrendData.length - 2]?.cost || 0;
    const change = lastMonth - prevMonth;
    const percentChange = prevMonth !== 0 ? ((change / prevMonth) * 100).toFixed(1) : 0;

    return {
      change: change.toFixed(2),
      percentChange,
      isIncreasing: change > 0,
    };
  };

  // Calculate average monthly spending
  const calculateAverageSpending = () => {
    if (monthlyTrendData.length === 0) return 0;
    const total = monthlyTrendData.reduce((sum, month) => sum + month.cost, 0);
    return (total / monthlyTrendData.length).toFixed(2);
  };

  // Calculate forecast for next 3 months
  const calculateForecast = () => {
    if (monthlyTrendData.length < 3) {
      return monthlyTrendData.map(item => ({
        ...item,
        actualSpending: item.cost,
        forecastSpending: null,
      }));
    }

    const recent = monthlyTrendData.slice(-3);
    const avgChange = recent.reduce((sum, d, i, arr) => {
      if (i === 0) return sum;
      return sum + (d.cost - arr[i - 1].cost);
    }, 0) / (recent.length - 1);

    const lastCost = monthlyTrendData[monthlyTrendData.length - 1].cost;

    // Convert actual data to new format
    const actualData = monthlyTrendData.map(item => ({
      month: item.month,
      actualSpending: item.cost,
      forecastSpending: null,
    }));

    // Generate forecast data
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + i);
      const monthKey = nextDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });

      forecast.push({
        month: monthKey,
        actualSpending: null,
        forecastSpending: parseFloat((lastCost + avgChange * i).toFixed(2)),
      });
    }

    return [...actualData, ...forecast];
  };

  // Calculate category spending trend
  const calculateCategoryTrend = () => {
    const categories = {};

    subscriptions.forEach((sub) => {
      const cat = sub.category || 'Uncategorized';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      // Calculate monthly equivalent
      const monthlyRate =
        sub.billingCycle === 'Monthly' ? sub.cost :
        sub.billingCycle === 'Quarterly' ? sub.cost / 3 :
        sub.billingCycle === 'Annually' ? sub.cost / 12 : 0;
      categories[cat].push(monthlyRate);
    });

    return Object.entries(categories).map(([cat, costs]) => ({
      category: cat,
      totalMonthly: costs.reduce((a, b) => a + b, 0).toFixed(2),
      avgCost: (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2),
      count: costs.length,
    })).sort((a, b) => b.totalMonthly - a.totalMonthly);
  };

  // Calculate savings potential
  const calculateSavingsPotential = () => {
    const pausedSubs = subscriptions.filter(s => s.status === 'Paused');
    const highCostSubs = subscriptions.filter((s) => {
      const monthlyRate =
        s.billingCycle === 'Monthly' ? s.cost :
        s.billingCycle === 'Quarterly' ? s.cost / 3 :
        s.billingCycle === 'Annually' ? s.cost / 12 : 0;

      const avgCost = subscriptions.reduce((sum, sub) => sum + (
        sub.billingCycle === 'Monthly' ? sub.cost :
        sub.billingCycle === 'Quarterly' ? sub.cost / 3 :
        sub.billingCycle === 'Annually' ? sub.cost / 12 : 0
      ), 0) / subscriptions.length;

      return monthlyRate > avgCost * 1.5;
    });

    const potentialSavings = pausedSubs.reduce((sum, s) => {
      const monthlyRate =
        s.billingCycle === 'Monthly' ? s.cost :
        s.billingCycle === 'Quarterly' ? s.cost / 3 :
        s.billingCycle === 'Annually' ? s.cost / 12 : 0;
      return sum + monthlyRate;
    }, 0);

    return {
      pausedCount: pausedSubs.length,
      highCostCount: highCostSubs.length,
      monthlySavings: potentialSavings.toFixed(2),
    };
  };

  // Calculate billing cycle breakdown
  const calculateBillingCycleData = () => {
    const cycles = { 'Monthly': 0, 'Quarterly': 0, 'Annually': 0 };
    const counts = { 'Monthly': 0, 'Quarterly': 0, 'Annually': 0 };

    subscriptions.forEach((sub) => {
      const cycle = sub.billingCycle || 'Monthly';
      const monthlyRate =
        cycle === 'Monthly' ? sub.cost :
        cycle === 'Quarterly' ? sub.cost / 3 :
        cycle === 'Annually' ? sub.cost / 12 : 0;

      cycles[cycle] = (cycles[cycle] || 0) + monthlyRate;
      counts[cycle] = (counts[cycle] || 0) + 1;
    });

    return Object.entries(cycles).map(([cycle, value]) => ({
      name: cycle,
      value: parseFloat(value.toFixed(2)),
      count: counts[cycle],
    })).filter(item => item.value > 0);
  };

  const trend = useMemo(() => calculateTrend(), [monthlyTrendData]);
  const avgSpending = useMemo(() => calculateAverageSpending(), [monthlyTrendData]);
  const forecastData = useMemo(() => calculateForecast(), [monthlyTrendData]);
  const categoryTrend = useMemo(() => calculateCategoryTrend(), [subscriptions]);

  // Sorted category trend
  const sortedCategoryTrend = useMemo(() => {
    const sorted = [...categoryTrend];
    sorted.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Convert to numbers for numeric columns
      if (sortColumn !== 'category') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [categoryTrend, sortColumn, sortDirection]);
  const savingsPotential = useMemo(() => calculateSavingsPotential(), [subscriptions]);
  const billingCycleData = useMemo(() => calculateBillingCycleData(), [subscriptions]);

  return (
    <div className="space-y-6">
      {/* Currency Selector */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-3">
          <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Analytics Currency:
          </label>
          <select
            value={analyticsCurrency}
            onChange={(e) => setAnalyticsCurrency(e.target.value)}
            className={`px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-accent-300/50'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-accent-300/50'
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
              <option>AFN</option>
              <option>BDT</option>
              <option>BND</option>
              <option>CNY</option>
              <option>HKD</option>
              <option>IDR</option>
              <option>INR</option>
              <option>KHR</option>
              <option>KRW</option>
              <option>KZT</option>
              <option>LAK</option>
              <option>LKR</option>
              <option>MMK</option>
              <option>MNT</option>
              <option>MOP</option>
              <option>MYR</option>
              <option>NPR</option>
              <option>NZD</option>
              <option>PHP</option>
              <option>PKR</option>
              <option>SGD</option>
              <option>THB</option>
              <option>TWD</option>
              <option>UZS</option>
              <option>VND</option>
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
            <optgroup label="Middle East & Africa">
              <option>AED</option>
              <option>BHD</option>
              <option>DZD</option>
              <option>EGP</option>
              <option>GHS</option>
              <option>ILS</option>
              <option>IQD</option>
              <option>JOD</option>
              <option>KES</option>
              <option>KWD</option>
              <option>LBP</option>
              <option>MAD</option>
              <option>NGN</option>
              <option>OMR</option>
              <option>QAR</option>
              <option>SAR</option>
              <option>SYP</option>
              <option>TND</option>
              <option>UGX</option>
              <option>YER</option>
              <option>ZAR</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Spending */}
        <div className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800/40 border border-accent-300/20' : 'bg-white/50 border border-gray-200'}`}>
          <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('analytics.avgSpending', 'Average Monthly')}
          </p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(avgSpending)}
          </p>
        </div>

        {/* Spending Trend */}
        {trend && (
          <div className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800/40 border border-accent-300/20' : 'bg-white/50 border border-gray-200'}`}>
            <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('analytics.spendingTrend', 'Month-over-Month')}
            </p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${trend.isIncreasing ? 'text-red-400' : 'text-green-400'}`}>
                {trend.isIncreasing ? '+' : ''}{formatCurrency(trend.change)}
              </p>
              {trend.isIncreasing ? (
                <TrendingUp size={20} className="text-red-400" />
              ) : (
                <TrendingDown size={20} className="text-green-400" />
              )}
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {trend.percentChange}% change
            </p>
          </div>
        )}

        {/* Savings Potential */}
        <div className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800/40 border border-accent-300/20' : 'bg-white/50 border border-gray-200'}`}>
          <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('analytics.savingsPotential', 'Monthly Savings')}
          </p>
          <p className={`text-2xl font-bold text-accent-300`}>
            {formatCurrency(savingsPotential.monthlySavings)}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {savingsPotential.pausedCount} paused + {savingsPotential.highCostCount} expensive
          </p>
        </div>

        {/* Forecast Alert */}
        <div className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800/40 border border-accent-300/20' : 'bg-white/50 border border-gray-200'}`}>
          <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('analytics.projected3Month', '3-Month Projection')}
          </p>
          {forecastData.length > 0 && (
            <>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {forecastData[forecastData.length - 1].forecastSpending
                  ? formatCurrency(forecastData[forecastData.length - 1].forecastSpending)
                  : formatCurrency(forecastData[forecastData.length - 1].actualSpending || 0)}
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Average: {formatCurrency(avgSpending)}/month
              </p>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Forecast Chart */}
        <div className={`rounded-xl p-8 fade-in-up card-elevated transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/40 border border-accent-300/30 shadow-xl shadow-accent-500/10' : 'bg-gradient-to-br from-white/70 to-white/50 border border-gray-300 shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.spendingForecast', '12-Month Forecast with Projection')}
          </h3>
          <div className="text-sm mb-4 p-3 rounded-lg" style={{backgroundColor: darkMode ? 'rgba(0, 102, 255, 0.1)' : 'rgba(0, 102, 255, 0.05)', borderLeft: '3px solid #0066ff'}}>
            <p className={`${darkMode ? 'text-blue-300' : 'text-blue-600'} font-medium`}>Green line: Actual spending • Orange dashed line: Projected forecast</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#fff',
                  border: `2px solid #0066ff`,
                  borderRadius: '12px',
                  boxShadow: darkMode ? '0 0 30px rgba(0, 102, 255, 0.4)' : '0 0 20px rgba(0, 102, 255, 0.3)',
                  padding: '12px 16px'
                }}
                labelStyle={{ color: darkMode ? '#f3f4f6' : '#111827', fontWeight: 'bold' }}
                formatter={(value) => formatCurrency(parseFloat(value))}
              />
              <Legend wrapperStyle={{ paddingTop: '16px' }} />
              <Line
                type="monotone"
                dataKey="actualSpending"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                name="Actual Spending"
              />
              <Line
                type="monotone"
                dataKey="forecastSpending"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                name="Forecast"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Billing Cycle Breakdown Chart */}
        {billingCycleData.length > 0 && (
          <div className={`rounded-xl p-8 fade-in-up card-elevated transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/40 border border-accent-300/30 shadow-xl shadow-accent-500/10' : 'bg-gradient-to-br from-white/70 to-white/50 border border-gray-300 shadow-lg'}`}>
            <BillingCyclePieChart
              data={billingCycleData}
              darkMode={darkMode}
              title={t('analytics.billingCycle', 'Billing Cycle Breakdown')}
            />
          </div>
        )}
      </div>

      {/* Category Details Table */}
      <div className={`rounded-xl p-8 fade-in-up card-elevated transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/40 border border-accent-300/30 shadow-xl shadow-accent-500/10' : 'bg-gradient-to-br from-white/70 to-white/50 border border-gray-300 shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('analytics.categoryDetails', 'Category Breakdown')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <th className={`text-left py-4 px-4 font-bold cursor-pointer hover:opacity-70 transition-opacity ${darkMode ? 'text-accent-400' : 'text-accent-600'}`} onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">
                    {t('filters.category')}
                    {sortColumn === 'category' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th className={`text-right py-4 px-4 font-bold cursor-pointer hover:opacity-70 transition-opacity ${darkMode ? 'text-accent-400' : 'text-accent-600'}`} onClick={() => handleSort('totalMonthly')}>
                  <div className="flex items-center justify-end gap-2">
                    Monthly Total
                    {sortColumn === 'totalMonthly' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th className={`text-right py-4 px-4 font-bold cursor-pointer hover:opacity-70 transition-opacity ${darkMode ? 'text-accent-400' : 'text-accent-600'}`} onClick={() => handleSort('avgCost')}>
                  <div className="flex items-center justify-end gap-2">
                    Avg/Item
                    {sortColumn === 'avgCost' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th className={`text-right py-4 px-4 font-bold cursor-pointer hover:opacity-70 transition-opacity ${darkMode ? 'text-accent-400' : 'text-accent-600'}`} onClick={() => handleSort('count')}>
                  <div className="flex items-center justify-end gap-2">
                    {t('table.count', 'Count')}
                    {sortColumn === 'count' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCategoryTrend.map((cat) => {
                const totalMonthlyNum = parseFloat(cat.totalMonthly) || 0;
                const avgCostNum = parseFloat(cat.avgCost) || 0;
                const maxTotal = Math.max(...sortedCategoryTrend.map(c => parseFloat(c.totalMonthly) || 0));
                const percentage = maxTotal > 0 ? (totalMonthlyNum / maxTotal) * 100 : 0;
                const categoryColor = getCategoryColor(cat.category);

                return (
                  <tr
                    key={cat.category}
                    className={`border-b transition-all duration-200 ${
                      darkMode
                        ? 'border-gray-700 hover:bg-gray-700/40'
                        : 'border-gray-200 hover:bg-gray-100/60'
                    }`}
                  >
                    <td className={`py-4 px-4 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }}></div>
                        {cat.category}
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-right`}>
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex-shrink-0 text-right">
                          <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(totalMonthlyNum)}
                          </p>
                          <div className={`w-32 h-2 rounded-full mt-2 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%`, backgroundColor: categoryColor, opacity: 0.8 }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-right`}>
                      <span className={`font-semibold text-sm px-3 py-1 rounded-lg ${
                        darkMode
                          ? 'bg-gray-700/50 text-gray-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {formatCurrency(avgCostNum)}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right`}>
                      <span className={`font-bold text-sm px-3 py-2 rounded-lg inline-flex items-center justify-center w-10 h-10 ${
                        darkMode
                          ? 'bg-accent-500/20 text-accent-300'
                          : 'bg-accent-100 text-accent-700'
                      }`}>
                        {cat.count}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Savings Opportunities Alert */}
      {(savingsPotential.pausedCount > 0 || savingsPotential.highCostCount > 0) && (
        <div className={`rounded-lg p-6 border-l-4 ${
          darkMode
            ? 'bg-blue-900/20 border-blue-400'
            : 'bg-blue-50 border-blue-400'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className={darkMode ? 'text-blue-400' : 'text-blue-600'}
            />
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                {t('analytics.savingsOpportunity', 'Savings Opportunities Identified')}
              </h4>
              <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                You could save <span className="font-bold">{formatCurrency(savingsPotential.monthlySavings)}/month</span> by:
              </p>
              <ul className={`mt-2 text-sm space-y-1 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                {savingsPotential.pausedCount > 0 && (
                  <li>• Cancelling {savingsPotential.pausedCount} paused subscription(s)</li>
                )}
                {savingsPotential.highCostCount > 0 && (
                  <li>• Reviewing {savingsPotential.highCostCount} high-cost subscription(s)</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
