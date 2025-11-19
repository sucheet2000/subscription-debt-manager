import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from './context/UserContext';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  Check,
  AlertTriangle,
  Info,
  Moon,
  Sun,
  Download,
  Search,
  Filter,
  Clock,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  Globe,
  LogOut,
  Settings,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
// Lazy load heavy components for code splitting
const RecommendationsPanel = lazy(() => import('./components/RecommendationsPanel'));
const EnhancedAnalytics = lazy(() => import('./components/EnhancedAnalytics'));
import ProfilePage from './pages/ProfilePage';
import HooksTestComponent from './components/HooksTestComponent';
import SubscriptionTable from './components/SubscriptionTable';
import MetricsCards from './components/MetricsCards';
import FilterPanel from './components/FilterPanel';
import GooglePieChart3D from './components/GooglePieChart3D';
import Footer from './components/Footer';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useFilters } from './hooks/useFilters';
import { useAnalytics } from './hooks/useAnalytics';
import { validateSubscription, sanitizeSubscriptionForDisplay } from './utils/securityUtils';

// Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper Functions
const calculateStringSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = getEditDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
};

const getEditDistance = (s1, s2) => {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

const checkForDuplicates = (name, subscriptions, excludeId = null) => {
  return subscriptions
    .filter(sub => sub.id !== excludeId)
    .filter(sub => calculateStringSimilarity(sub.name, name) > 70)
    .map(sub => ({
      name: sub.name,
      similarity: calculateStringSimilarity(sub.name, name),
    }));
};

const calculateMonthlyRate = (cost, billingCycle) => {
  switch (billingCycle) {
    case 'Monthly':
      return cost;
    case 'Quarterly':
      return cost / 3;
    case 'Annually':
      return cost / 12;
    default:
      return cost;
  }
};

const calculateRenewalsInNext12Months = (
  nextRenewalDate,
  billingCycle
) => {
  const today = new Date();
  const renewalDate = new Date(nextRenewalDate);
  const next12Months = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

  let count = 0;
  let currentDate = new Date(renewalDate);
  const cycleInDays =
    billingCycle === 'Monthly'
      ? 30
      : billingCycle === 'Quarterly'
        ? 90
        : 365;

  while (currentDate <= next12Months) {
    if (currentDate >= today) {
      count++;
    }
    currentDate = new Date(currentDate.getTime() + cycleInDays * 24 * 60 * 60 * 1000);
  }

  return count;
};

const calculate12MonthDebt = (subscriptions, isAwaitingCancellation = null) => {
  return subscriptions
    .filter(
      (sub) =>
        isAwaitingCancellation === null ||
        sub.isAwaitingCancellation === isAwaitingCancellation
    )
    .reduce((total, sub) => {
      const renewals = calculateRenewalsInNext12Months(
        sub.nextRenewalDate,
        sub.billingCycle
      );
      return total + renewals * sub.cost;
    }, 0);
};

const calculateTotalMonthlyCost = (subscriptions) => {
  return subscriptions.reduce((total, sub) => {
    return total + calculateMonthlyRate(sub.cost, sub.billingCycle);
  }, 0);
};

// Export Functions
const exportToCSV = (subscriptions) => {
  const headers = ['Name', 'Cost', 'Currency', 'Billing Cycle', 'Next Renewal', 'Category', 'Status'];
  const rows = subscriptions.map(sub => [
    sub.name,
    sub.cost,
    sub.currency,
    sub.billingCycle,
    new Date(sub.nextRenewalDate).toLocaleDateString(),
    sub.category || 'Uncategorized',
    sub.status || 'Active',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const exportToPDF = (subscriptions) => {
  let content = 'SUBSCRIPTION DEBT MANAGER REPORT\n';
  content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
  content += `Total Monthly Cost: $${subscriptions.reduce((sum, sub) => sum + parseFloat(sub.cost || 0), 0).toFixed(2)}\n`;
  content += `Total Subscriptions: ${subscriptions.length}\n\n`;
  content += '---\n\n';

  subscriptions.forEach(sub => {
    content += `${sub.name}\n`;
    content += `Cost: $${sub.cost} ${sub.currency}\n`;
    content += `Billing: ${sub.billingCycle}\n`;
    content += `Next Renewal: ${new Date(sub.nextRenewalDate).toLocaleDateString()}\n`;
    content += `Category: ${sub.category || 'Uncategorized'}\n`;
    content += `Status: ${sub.status || 'Active'}\n`;
    content += '---\n\n';
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Get upcoming renewals (next 30 days)
const getUpcomingRenewals = (subscriptions) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return subscriptions.filter(sub => {
    const renewalDate = new Date(sub.nextRenewalDate);
    return renewalDate >= today && renewalDate <= thirtyDaysFromNow && !sub.isAwaitingCancellation;
  }).sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate));
};

// Analytics Helper Functions
const getCategoryBreakdown = (subscriptions) => {
  const categoryMap = {};

  subscriptions.forEach(sub => {
    const category = sub.category || 'Uncategorized';
    const monthlyCost = calculateMonthlyRate(sub.cost, sub.billingCycle);

    if (!categoryMap[category]) {
      categoryMap[category] = 0;
    }
    categoryMap[category] += monthlyCost;
  });

  return Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  })).sort((a, b) => b.value - a.value);
};

// Enhanced color palette for pie chart (theme-aware, consistent, professional)
const getPieChartColors = (darkMode) => {
  if (darkMode) {
    return [
      '#60A5FA', // Blue
      '#34D399', // Teal
      '#FBBF24', // Amber
      '#F87171', // Red
      '#A78BFA', // Purple
      '#FB7185', // Rose
      '#4ADE80', // Green
      '#38BDF8', // Sky
      '#E879F9', // Fuchsia
      '#F59E0B', // Orange
    ];
  }
  return [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#22C55E', // Green
    '#0EA5E9', // Sky
    '#D946EF', // Fuchsia
    '#D97706', // Amber-dark
  ];
};

// Get subscription details for category hover tooltip
const getCategorySubscriptions = (subscriptions, categoryName) => {
  return subscriptions
    .filter(sub => (sub.category || 'Uncategorized') === categoryName)
    .map(sub => ({
      name: sub.name,
      cost: sub.cost,
      currency: sub.currency || 'USD',
      cycle: sub.billingCycle,
      monthlyCost: calculateMonthlyRate(sub.cost, sub.billingCycle)
    }))
    .sort((a, b) => b.cost - a.cost);
};

const getTopExpensiveSubscriptions = (subscriptions, count = 5) => {
  return subscriptions
    .sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost))
    .slice(0, count)
    .map(sub => ({
      name: sub.name,
      cost: parseFloat(sub.cost),
      currency: sub.currency,
      cycle: sub.billingCycle,
    }));
};

const getMonthlyTrendData = (subscriptions) => {
  const months = [];
  const today = new Date();

  // Generate data for the next 12 months
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthKey = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    const monthCost = subscriptions.reduce((total, sub) => {
      const renewalDate = new Date(sub.nextRenewalDate);
      const cycleInDays = sub.billingCycle === 'Monthly' ? 30 : sub.billingCycle === 'Quarterly' ? 90 : 365;

      // Check if subscription will be active in this month
      let currentDate = new Date(renewalDate);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      // Count renewals in this month
      let renewalsInMonth = 0;
      while (currentDate <= monthEnd) {
        if (currentDate >= monthStart && currentDate <= monthEnd) {
          renewalsInMonth++;
        }
        currentDate = new Date(currentDate.getTime() + cycleInDays * 24 * 60 * 60 * 1000);
      }

      // Calculate cost for this month based on billing cycle
      let monthSubCost = 0;
      if (renewalsInMonth > 0) {
        monthSubCost = sub.cost * renewalsInMonth;
      } else if (sub.billingCycle === 'Monthly') {
        monthSubCost = sub.cost;
      } else if (sub.billingCycle === 'Quarterly' && monthDate <= new Date(renewalDate.getFullYear(), renewalDate.getMonth() + 3, 0)) {
        monthSubCost = sub.cost / 3;
      } else if (sub.billingCycle === 'Annually' && monthDate.getFullYear() === renewalDate.getFullYear()) {
        monthSubCost = sub.cost / 12;
      }

      return total + monthSubCost;
    }, 0);

    months.push({
      month: monthKey,
      cost: parseFloat(monthCost.toFixed(2)),
    });
  }

  return months;
};

// Smart Recommendations Engine
const getRecommendations = (subscriptions, budgetLimit, budgetType) => {
  const recommendations = [];

  if (!subscriptions || subscriptions.length === 0) {
    return recommendations;
  }

  const activeSubscriptions = subscriptions.filter(s => s.status !== 'Cancelled');

  // Check for duplicate subscriptions
  const duplicateGroups = {};
  activeSubscriptions.forEach((sub, idx) => {
    activeSubscriptions.forEach((other, otherIdx) => {
      if (idx < otherIdx) {
        const similarity = calculateStringSimilarity(sub.name, other.name);
        if (similarity > 70) {
          const key = [idx, otherIdx].join('-');
          if (!duplicateGroups[key]) {
            duplicateGroups[key] = [sub, other];
          }
        }
      }
    });
  });

  Object.values(duplicateGroups).forEach((dupes) => {
    recommendations.push({
      id: `duplicate-${dupes[0].id}`,
      title: `Possible duplicate: ${dupes[0].name} & ${dupes[1].name}`,
      description: 'These subscriptions have very similar names. Check if they\'re duplicates.',
      severity: 'high',
      impact: 'Save ' + (calculateMonthlyRate(dupes[0].cost, dupes[0].billingCycle) + calculateMonthlyRate(dupes[1].cost, dupes[1].billingCycle)).toFixed(2) + '/month',
    });
  });

  // Check for high-cost subscriptions
  const topExpensive = activeSubscriptions
    .sort((a, b) => calculateMonthlyRate(b.cost, b.billingCycle) - calculateMonthlyRate(a.cost, a.billingCycle))
    .slice(0, 3);

  const avgCost = activeSubscriptions.reduce((sum, sub) => sum + calculateMonthlyRate(sub.cost, sub.billingCycle), 0) / activeSubscriptions.length;

  topExpensive.forEach((sub) => {
    const monthlyCost = calculateMonthlyRate(sub.cost, sub.billingCycle);
    if (monthlyCost > avgCost * 1.5) {
      recommendations.push({
        id: `high-cost-${sub.id}`,
        title: `${sub.name} is expensive`,
        description: `This subscription costs $${monthlyCost.toFixed(2)}/month, which is ${((monthlyCost / avgCost - 1) * 100).toFixed(0)}% above your average.`,
        severity: 'medium',
        impact: `Consider if you use it regularly. Could save $${monthlyCost.toFixed(2)}/month by cancelling.`,
      });
    }
  });

  // Check for upcoming renewals
  const upcomingRenewals = activeSubscriptions
    .filter(sub => !sub.isAwaitingCancellation)
    .filter((sub) => {
      const renewalDate = new Date(sub.nextRenewalDate);
      const today = new Date();
      const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilRenewal > 0 && daysUntilRenewal <= 14;
    });

  if (upcomingRenewals.length > 0) {
    const totalCost = upcomingRenewals.reduce((sum, sub) => sum + sub.cost, 0);
    recommendations.push({
      id: 'upcoming-renewals',
      title: `${upcomingRenewals.length} subscription(s) renewing soon`,
      description: `${upcomingRenewals.map(s => s.name).join(', ')} will renew in the next 2 weeks.`,
      severity: 'low',
      impact: `Total cost: $${totalCost.toFixed(2)}`,
    });
  }

  // Check budget status
  if (budgetLimit && budgetType === 'Monthly') {
    const monthlyTotal = activeSubscriptions.reduce((sum, sub) => sum + calculateMonthlyRate(sub.cost, sub.billingCycle), 0);
    if (monthlyTotal > budgetLimit * 0.9) {
      recommendations.push({
        id: 'budget-alert',
        title: 'Approaching monthly budget',
        description: `You're spending $${monthlyTotal.toFixed(2)} of your $${budgetLimit.toFixed(2)} budget.`,
        severity: monthlyTotal > budgetLimit ? 'high' : 'medium',
        impact: `${((monthlyTotal / budgetLimit) * 100).toFixed(0)}% of budget used. Consider cancelling or downgrading some subscriptions.`,
      });
    }
  }

  // Check for unused subscriptions (status = 'Paused' or 'Cancelled')
  const pausedSubscriptions = subscriptions.filter(s => s.status === 'Paused');
  if (pausedSubscriptions.length > 0) {
    const pausedCost = pausedSubscriptions.reduce((sum, sub) => sum + calculateMonthlyRate(sub.cost, sub.billingCycle), 0);
    recommendations.push({
      id: 'paused-subscriptions',
      title: `You have ${pausedSubscriptions.length} paused subscription(s)`,
      description: 'Consider cancelling paused subscriptions if you don\'t plan to use them.',
      severity: 'low',
      impact: `Potential savings: $${pausedCost.toFixed(2)}/month`,
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
};

// Toast Notification Component
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-accent-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-orange-500 text-white',
    info: 'bg-blue-500 text-white',
  }[type];

  const icon = {
    success: <Check size={20} />,
    error: <AlertTriangle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  }[type];

  return (
    <div
      className={`${bgColor} px-5 py-3.5 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-sm font-medium`}
    >
      {icon}
      <span className="text-sm">{message}</span>
    </div>
  );
};

// Loading fallback for lazy-loaded components
const LazyComponentLoader = ({ darkMode = false }) => (
  <div className={`flex items-center justify-center p-12 rounded-xl ${
    darkMode
      ? 'bg-gray-800/50 backdrop-blur-sm border border-accent-300/20'
      : 'bg-white/80 backdrop-blur-sm border border-gray-200'
  }`}>
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-300"></div>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Loading...
      </p>
    </div>
  </div>
);

// Main App Component
export default function App() {
  const { t, i18n } = useTranslation();
  const { user: authUser, logout } = useUser();
  // ===== OLD STATE DECLARATIONS NOW MANAGED BY HOOKS =====
  // Removed: subscriptions, loading, editingId, formErrors, sortConfig, formData
  // Removed: searchTerm, filterStatus, filterCategory, filterMinCost, filterMaxCost, filterStartDate, filterEndDate
  // These are now provided by: useSubscriptions, useFilters, useAnalytics hooks

  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Budget Configuration State
  const [budgetLimit, setBudgetLimit] = useState(() => {
    const saved = localStorage.getItem('budgetLimit');
    return saved ? parseFloat(saved) : null;
  });
  const [budgetType, setBudgetType] = useState(() => {
    const saved = localStorage.getItem('budgetType');
    return saved || 'Monthly';
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Duplicate Detection State
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [pendingFormData, setPendingFormData] = useState(null);

  // Backup/Restore State
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Recommendations State
  const [dismissedRecommendations, setDismissedRecommendations] = useState(false);

  // Profile Page State
  const [showProfile, setShowProfile] = useState(false);

  // Hooks Test State
  const [showHooksTest, setShowHooksTest] = useState(false);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save budget settings preference
  useEffect(() => {
    if (budgetLimit !== null) {
      localStorage.setItem('budgetLimit', budgetLimit.toString());
      localStorage.setItem('budgetType', budgetType);
    }
  }, [budgetLimit, budgetType]);

  // ===== CUSTOM HOOKS INTEGRATION =====
  // Initialize all three custom hooks for business logic
  const subscriptionsHook = useSubscriptions(authUser);
  const filtersHook = useFilters(subscriptionsHook.subscriptions);
  const analyticsHook = useAnalytics(subscriptionsHook.subscriptions);

  // ===== MAP HOOK DATA TO EXISTING VARIABLE NAMES =====
  // Create aliases for hook data so old code still works
  // This allows gradual refactoring without breaking the app
  const subscriptionsFromHook = subscriptionsHook.subscriptions || [];
  const subscriptions = subscriptionsFromHook; // Alias for backward compatibility
  const loadingFromHook = subscriptionsHook.loading;
  const loading = loadingFromHook; // Alias for backward compatibility
  const formDataFromHook = subscriptionsHook.formData;
  const formErrorsFromHook = subscriptionsHook.formErrors;
  const editingIdFromHook = subscriptionsHook.editingId;

  // Filter hook data
  const searchTermHook = filtersHook.searchTerm || '';
  const filterStatusHook = filtersHook.filterStatus || 'all';
  const filterCategoryHook = filtersHook.filterCategory || 'all';
  const filterMinCostHook = filtersHook.filterMinCost || '';
  const filterMaxCostHook = filtersHook.filterMaxCost || '';
  const filterStartDateHook = filtersHook.filterStartDate || '';
  const filterEndDateHook = filtersHook.filterEndDate || '';
  const sortConfigHook = filtersHook.sortConfig || { key: 'name', direction: 'asc' };
  const filteredSubscriptionsHook = filtersHook.filteredSubscriptions || [];
  const sortedActiveSubscriptionsHook = filtersHook.sortedSubscriptions || [];

  // Analytics hook data
  const totalMonthlyCostHook = analyticsHook.totalMonthlyCost || 0;
  const futureDebtHook = analyticsHook.totalDebt12Months || 0;
  const categoryBreakdownHook = analyticsHook.categoryBreakdown || [];
  const topExpensiveSubscriptionsHook = analyticsHook.topExpensiveSubscriptions || [];
  const upcomingRenewalsHook = analyticsHook.upcomingRenewals || [];
  const monthlyTrendDataHook = analyticsHook.monthlyTrendData || [];
  const statisticsHook = analyticsHook.statistics || {};

  // Create aliases for all hook data (backward compatibility)
  const searchTerm = searchTermHook;
  const filterStatus = filterStatusHook;
  const filterCategory = filterCategoryHook;
  const filterMinCost = filterMinCostHook;
  const filterMaxCost = filterMaxCostHook;
  const filterStartDate = filterStartDateHook;
  const filterEndDate = filterEndDateHook;
  const sortConfig = sortConfigHook;
  const filteredSubscriptions = filteredSubscriptionsHook;
  const sortedActiveSubscriptions = sortedActiveSubscriptionsHook;
  const totalMonthlyCost = totalMonthlyCostHook;
  const futureDebt = futureDebtHook;
  const categoryBreakdown = categoryBreakdownHook;
  const topExpensiveSubscriptions = topExpensiveSubscriptionsHook;
  const upcomingRenewals = upcomingRenewalsHook;
  const monthlyTrendData = monthlyTrendDataHook;
  const statistics = statisticsHook;

  // ===== REPLACE HANDLERS WITH HOOK HANDLERS =====
  // Subscriptions handlers with memoization
  const handleAddSubscription = useCallback(async (data) => {
    return subscriptionsHook.handleAddSubscription(data);
  }, [subscriptionsHook]);

  const handleDelete = useCallback((id) => {
    return subscriptionsHook.handleDeleteSubscription(id);
  }, [subscriptionsHook]);

  const handleToggleCancellation = subscriptionsHook.handleToggleCancellation;

  // Form state setters from hook
  const setFormDataHook = subscriptionsHook.setFormData;
  const setFormErrors = subscriptionsHook.setFormErrors;
  const setEditingId = subscriptionsHook.setEditingId;

  // Backward compatibility aliases
  const setFormData = setFormDataHook;
  const formData = formDataFromHook;
  const formErrors = formErrorsFromHook;
  const editingId = editingIdFromHook;

  // Filter handlers with memoization
  const handleSort = useCallback((key) => {
    filtersHook.handleSort(key);
  }, [filtersHook]);

  const setSearchTermHook = filtersHook.setSearchTerm;
  const setFilterStatusHook = filtersHook.setFilterStatus;
  const setFilterCategoryHook = filtersHook.setFilterCategory;
  const setFilterMinCostHook = filtersHook.setFilterMinCost;
  const setFilterMaxCostHook = filtersHook.setFilterMaxCost;
  const setFilterStartDateHook = filtersHook.setFilterStartDate;
  const setFilterEndDateHook = filtersHook.setFilterEndDate;

  // Wrapped handler for form data changes
  const handleFormDataChange = useCallback((field, value) => {
    setFormDataHook(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setFormDataHook]);

  // ===== OLD USEEFFECTS REMOVED =====
  // Backup and Firebase setup are now handled by useSubscriptions hook
  // No need to duplicate these here

  // Validation function
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Subscription name is required';
    }

    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      errors.cost = 'Cost must be a positive number';
    }

    if (!formData.nextRenewalDate) {
      errors.nextRenewalDate = 'Renewal date is required';
    } else {
      const renewalDate = new Date(formData.nextRenewalDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (renewalDate < today) {
        errors.nextRenewalDate = 'Renewal date must be in the future';
      }
    }

    return errors;
  };

  // Form Handlers
  const handleAddEdit = async (e) => {
    e.preventDefault();

    if (!authUser) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setToast({
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    setFormErrors({});

    // Check for duplicates if adding new subscription
    if (!editingId) {
      const duplicates = checkForDuplicates(formData.name, subscriptions);
      if (duplicates.length > 0) {
        setDuplicateMatches(duplicates);
        setPendingFormData(formData);
        setShowDuplicateWarning(true);
        return;
      }
    }

    try {
      // Validate and sanitize subscription data using security utilities
      const validationResult = validateSubscription(formData);
      if (!validationResult.valid) {
        const errorMessages = Object.entries(validationResult.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join('\n');
        setToast({
          message: `Validation failed:\n${errorMessages}`,
          type: 'error',
        });
        return;
      }

      const appId = window.__appId || 'default';
      const subscriptionsRef = collection(
        db,
        `artifacts/${appId}/users/${authUser.uid}/subscriptions`
      );

      // Use sanitized data from validation result
      const dataToSave = validationResult.sanitized;

      if (editingId) {
        const docRef = doc(subscriptionsRef, editingId);
        await updateDoc(docRef, dataToSave);
        setToast({
          message: `${formData.name} updated successfully`,
          type: 'success',
        });
      } else {
        await addDoc(subscriptionsRef, dataToSave);
        setToast({
          message: `${formData.name} added successfully`,
          type: 'success',
        });
      }

      setFormData({
        name: '',
        cost: '',
        currency: 'USD',
        billingCycle: 'Monthly',
        nextRenewalDate: '',
        category: '',
        isAwaitingCancellation: false,
      });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving subscription:', error);
      let errorMessage = 'Failed to save subscription. Please try again.';

      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to save this subscription.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Database is temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setToast({
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const handleEdit = useCallback((subscription) => {
    setEditingId(subscription.id);
    setFormData({
      name: subscription.name,
      cost: subscription.cost.toString(),
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      nextRenewalDate: subscription.nextRenewalDate,
      category: subscription.category,
      isAwaitingCancellation: subscription.isAwaitingCancellation,
    });
    setShowForm(true);
  }, [setEditingId, setFormData, setShowForm]);

  const handleProceedWithDuplicate = async () => {
    if (!authUser || !pendingFormData) return;

    try {
      // Validate and sanitize subscription data using security utilities
      const validationResult = validateSubscription(pendingFormData);
      if (!validationResult.valid) {
        setToast({
          message: 'Validation failed. Please check your data.',
          type: 'error',
        });
        return;
      }

      const appId = window.__appId || 'default';
      const subscriptionsRef = collection(
        db,
        `artifacts/${appId}/users/${authUser.uid}/subscriptions`
      );

      // Use sanitized data from validation result
      const dataToSave = validationResult.sanitized;

      await addDoc(subscriptionsRef, dataToSave);
      setToast({
        message: `${pendingFormData.name} added successfully`,
        type: 'success',
      });

      setFormData({
        name: '',
        cost: '',
        currency: 'USD',
        billingCycle: 'Monthly',
        nextRenewalDate: '',
        category: '',
        isAwaitingCancellation: false,
      });
      setEditingId(null);
      setShowForm(false);
      setShowDuplicateWarning(false);
      setPendingFormData(null);
      setDuplicateMatches([]);
    } catch (error) {
      console.error('Error saving subscription:', error);
      setToast({
        message: 'Failed to save subscription. Please try again.',
        type: 'error',
      });
    }
  };

  const handleDownloadBackup = () => {
    try {
      const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        subscriptions: subscriptions,
        count: subscriptions.length,
      };

      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subscription-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      setToast({
        message: 'Backup downloaded successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      setToast({
        message: 'Failed to download backup',
        type: 'error',
      });
    }
  };

  const handleRestoreBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.subscriptions || !Array.isArray(backup.subscriptions)) {
        throw new Error('Invalid backup file format');
      }

      if (!authUser) return;

      const appId = window.__appId || 'default';
      const subscriptionsRef = collection(
        db,
        `artifacts/${appId}/users/${authUser.uid}/subscriptions`
      );

      // Delete existing subscriptions
      const existingDocs = await fetch(
        `https://firestore.googleapis.com/v1/projects/subscription-debt-manager/databases/(default)/documents/artifacts/${appId}/users/${authUser.uid}/subscriptions`
      );

      // Simple approach: just add all backed-up subscriptions
      // Firebase will handle duplicates
      for (const sub of backup.subscriptions) {
        const { id, ...dataWithoutId } = sub;
        await addDoc(subscriptionsRef, dataWithoutId);
      }

      setToast({
        message: `Restored ${backup.subscriptions.length} subscriptions from backup`,
        type: 'success',
      });
      setShowBackupModal(false);
    } catch (error) {
      console.error('Error restoring backup:', error);
      setToast({
        message: 'Failed to restore backup. Make sure it\'s a valid backup file.',
        type: 'error',
      });
    }

    // Reset file input
    event.target.value = '';
  };

  // Old handler functions removed - now using hook versions above (lines 614-627)

  // Old handlers and sorting functions removed - now using hook versions

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      cost: '',
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewalDate: '',
      category: '',
      isAwaitingCancellation: false,
    });
    setFormErrors({});
  }, [setShowForm, setEditingId, setFormData, setFormErrors]);

  // Apply filters to subscriptions
  const getFilteredSubscriptions = () => {
    return activeSubscriptions.filter(sub => {
      // Search filter
      if (searchTerm && !sub.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && (sub.status || 'Active') !== filterStatus) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all' && (sub.category || 'Uncategorized') !== filterCategory) {
        return false;
      }

      // Cost range filter
      const cost = parseFloat(sub.cost || 0);
      if (filterMinCost && cost < parseFloat(filterMinCost)) {
        return false;
      }
      if (filterMaxCost && cost > parseFloat(filterMaxCost)) {
        return false;
      }

      // Date range filter
      if (filterStartDate || filterEndDate) {
        const renewalDate = new Date(sub.nextRenewalDate);
        if (filterStartDate && renewalDate < new Date(filterStartDate)) {
          return false;
        }
        if (filterEndDate && renewalDate > new Date(filterEndDate)) {
          return false;
        }
      }

      return true;
    });
  };

  // Calculate metrics using hook data
  const activeSubscriptions = subscriptionsFromHook.filter(
    (sub) => !sub.isAwaitingCancellation
  );
  const pendingCancellations = subscriptionsFromHook.filter(
    (sub) => sub.isAwaitingCancellation
  );

  // Get pending cancellations
  const sortedPendingCancellations = subscriptionsFromHook.filter(
    (sub) => sub.isAwaitingCancellation
  );
  const totalActive = activeSubscriptions.length;

  // Determine currency to use in metrics (use first subscription's currency, default to USD)
  const metricsCurrency = subscriptionsFromHook.length > 0 ? subscriptionsFromHook[0].currency : 'USD';

  // Calculate budget status
  const currentSpending = budgetType === 'Monthly' ? totalMonthlyCost : futureDebt / 12;
  const budgetSpent = budgetLimit ? (currentSpending / budgetLimit) * 100 : 0;
  const isBudgetExceeded = budgetLimit && currentSpending > budgetLimit;
  const isApproachingBudget = budgetLimit && budgetSpent > 80 && budgetSpent <= 100;

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-950'
          : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
            darkMode ? 'border-accent-300 shadow-lg shadow-accent-300/50' : 'border-accent-500'
          }`}></div>
          <p className={`text-lg font-semibold tracking-tight ${darkMode ? 'text-accent-300' : 'text-gray-900'}`}>
            Loading your subscriptions...
          </p>
        </div>
      </div>
    );
  }

  // Show profile page if requested
  if (showProfile) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
        {darkMode && (
          <div className="fixed inset-0 pointer-events-none opacity-2">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-300/10 via-transparent to-accent-500/5"></div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProfilePage onBack={() => setShowProfile(false)} darkMode={darkMode} />
        </div>
      </div>
    );
  }

  // Show hooks test component if requested
  if (showHooksTest) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
        {darkMode && (
          <div className="fixed inset-0 pointer-events-none opacity-2">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-300/10 via-transparent to-accent-500/5"></div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setShowHooksTest(false)}
              className={`px-4 py-2 rounded-lg transition-all ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              ← Back to App
            </button>
          </div>
          <HooksTestComponent />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gray-950'
        : 'bg-gray-50'
    }`}>
      {/* Subtle accent gradient backdrop for dark mode */}
      {darkMode && (
        <div className="fixed inset-0 pointer-events-none opacity-2">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-300/10 via-transparent to-accent-500/5"></div>
        </div>
      )}

      <header className={`${
        darkMode ? 'bg-gray-900/80 border-b border-accent-300/20 backdrop-blur-md shadow-sm shadow-accent-300/5' : 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm'
      } sticky top-0 z-40 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                darkMode ? 'bg-gradient-to-r from-accent-300 to-accent-200 bg-clip-text text-transparent' : 'text-gray-900'
              }`}>
                {t('app.title')}
              </h1>
              <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('app.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-accent-300/20 text-accent-300 hover:bg-accent-300/30 hover:shadow-accent-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={darkMode ? t('header.darkMode') : t('header.lightMode')}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className={`p-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  darkMode
                    ? 'bg-accent-300/20 text-accent-300 hover:bg-accent-300/30 border border-accent-300/30'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                }`}
                title="Change language"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="te">తెలుగు</option>
              </select>
              <button
                onClick={() => setShowBackupModal(true)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-accent-300/20 text-accent-300 hover:bg-accent-300/30'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={t('header.backupRestore')}
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-accent-300/20 text-accent-300 hover:bg-accent-300/30'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={t('header.settings', 'Settings')}
              >
                <Settings size={20} />
              </button>
              {import.meta.env.DEV && (
              <button
                onClick={() => setShowHooksTest(!showHooksTest)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border border-purple-400/30'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                }`}
                title="Test Hooks (Dev Only)"
              >
                🧪 Test
              </button>
              )}
              <button
                onClick={logout}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                title="Logout"
              >
                <LogOut size={20} />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-accent-300 text-gray-950 hover:bg-accent-200 hover:shadow-lg hover:shadow-accent-300/40'
                    : 'bg-accent-500 hover:bg-accent-600 text-white shadow-md hover:shadow-lg'
                }`}
              >
                <Plus size={20} />
                <span className="hidden sm:inline">{t('header.addSubscription')}</span>
                <span className="sm:hidden">{t('header.add')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recommendations Panel */}
        {!dismissedRecommendations && (
          <Suspense fallback={<LazyComponentLoader darkMode={darkMode} />}>
            <RecommendationsPanel
              recommendations={getRecommendations(subscriptionsFromHook, budgetLimit, budgetType)}
              onDismiss={() => setDismissedRecommendations(true)}
            />
          </Suspense>
        )}

        <MetricsCards
          totalMonthlyCost={totalMonthlyCost}
          futureDebt={futureDebt}
          totalActive={totalActive}
          pendingCancellations={pendingCancellations}
          budgetLimit={budgetLimit}
          budgetSpent={budgetSpent}
          isBudgetExceeded={isBudgetExceeded}
          isApproachingBudget={isApproachingBudget}
          metricsCurrency={metricsCurrency}
          darkMode={darkMode}
          onBudgetClick={() => setShowBudgetModal(true)}
        />

        {/* Analytics Dashboard */}
        {activeSubscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <TrendingUp size={28} className={darkMode ? 'text-accent-300' : 'text-accent-500'} />
              {t('analytics.title')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Category Breakdown Pie Chart */}
              <div className={`rounded-xl p-8 transition-all duration-300 card-elevated fade-in-up ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800/80 via-gray-800/50 to-gray-900/80 backdrop-blur-xl border border-accent-300/20'
                  : 'bg-gradient-to-br from-white/90 via-white/80 to-gray-50/90 backdrop-blur-xl border border-gray-200/50'
              }`}>
                <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('analytics.spendingByCategory')}
                </h3>
                <div className="w-full h-96">
                  <GooglePieChart3D
                    data={getCategoryBreakdown(activeSubscriptions)}
                    darkMode={darkMode}
                    title={t('analytics.spendingByCategory')}
                    getCategorySubscriptions={getCategorySubscriptions}
                    activeSubscriptions={activeSubscriptions}
                  />
                </div>
              </div>

              {/* Top Expensive Subscriptions */}
              <div className={`rounded-xl p-8 transition-all duration-300 card-elevated fade-in-up ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800/80 via-gray-800/50 to-gray-900/80 backdrop-blur-xl border border-accent-300/20'
                  : 'bg-gradient-to-br from-white/90 via-white/80 to-gray-50/90 backdrop-blur-xl border border-gray-200/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('analytics.topExpensive')}
                  </h3>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    darkMode
                      ? 'bg-blue-900/30 text-blue-300'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {t('analytics.sortedByCost')}
                  </span>
                </div>
                <div className="space-y-3">
                  {getTopExpensiveSubscriptions(activeSubscriptions, 5).map((sub, index) => (
                    <div key={index} className={`p-4 rounded-lg flex items-center justify-between smooth-transition depth-1 hover:depth-3 ${
                      darkMode
                        ? 'bg-gradient-to-r from-gray-700/40 via-gray-700/20 to-gray-700/40 border border-gray-600/30 hover:border-accent-300/30'
                        : 'bg-gradient-to-r from-gray-50/60 via-white/40 to-gray-50/60 border border-gray-200/50 hover:border-accent-400/30'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-bold w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                            darkMode ? 'bg-accent-300/30 text-accent-300' : 'bg-accent-500/20 text-accent-600'
                          }`}>{index + 1}</span>
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {sub.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-9 text-sm">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {sub.cycle}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            darkMode
                              ? 'bg-gray-600/50 text-gray-300'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {sub.currency}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${darkMode ? 'text-accent-300' : 'text-accent-600'}`}>
                          {sub.cost.toFixed(2)}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {sub.currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Upcoming Renewals Alert */}
        {(() => {
          const upcoming = getUpcomingRenewals(subscriptions);
          return upcoming.length > 0 ? (
            <div className={`rounded-xl p-6 mb-8 transition-all duration-300 ${
              darkMode
                ? 'bg-blue-900/30 border-2 border-blue-400/50'
                : 'bg-blue-50 border-2 border-blue-300'
            }`}>
              <div className="flex items-start gap-4">
                <Clock className={`flex-shrink-0 mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    {t('alerts.upcomingRenewals')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upcoming.map(sub => (
                      <div key={sub.id} className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/40' : 'bg-white'}`}>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{sub.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          {new Date(sub.nextRenewalDate).toLocaleDateString()} - {sub.currency} {sub.cost}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Enhanced Analytics */}
        {activeSubscriptions.length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<LazyComponentLoader darkMode={darkMode} />}>
              <EnhancedAnalytics
                subscriptions={activeSubscriptions}
                monthlyTrendData={getMonthlyTrendData(activeSubscriptions)}
                darkMode={darkMode}
              />
            </Suspense>
          </div>
        )}

        {/* Empty State */}
        {subscriptionsFromHook.length === 0 && !showForm && (
          <div className={`rounded-xl p-12 mb-8 text-center transition-all duration-300 ${
            darkMode
              ? 'bg-gray-800/50 backdrop-blur-sm border border-accent-300/20'
              : 'bg-white/80 backdrop-blur-sm border border-gray-200'
          }`}>
            <AlertCircle size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              {t('empty.noSubscriptions', 'No subscriptions yet')}
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('empty.noSubscriptionsDesc', 'Get started by adding your first subscription to track your spending')}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className={`flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-lg transition-all duration-200 mx-auto ${
                darkMode
                  ? 'bg-accent-300 text-gray-950 hover:bg-accent-200 hover:shadow-lg hover:shadow-accent-300/40'
                  : 'bg-accent-500 hover:bg-accent-600 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <Plus size={20} />
              {t('header.addSubscription', 'Add Your First Subscription')}
            </button>
          </div>
        )}

        {/* Search and Filter Section */}
        <FilterPanel
          subscriptions={subscriptions}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          filterCategory={filterCategory}
          filterMinCost={filterMinCost}
          filterMaxCost={filterMaxCost}
          filterStartDate={filterStartDate}
          filterEndDate={filterEndDate}
          onSearchChange={setSearchTermHook}
          onStatusChange={setFilterStatusHook}
          onCategoryChange={setFilterCategoryHook}
          onMinCostChange={setFilterMinCostHook}
          onMaxCostChange={setFilterMaxCostHook}
          onStartDateChange={setFilterStartDateHook}
          onEndDateChange={setFilterEndDateHook}
          onClearFilters={() => {
            setSearchTermHook('');
            setFilterStatusHook('all');
            setFilterCategoryHook('all');
            setFilterMinCostHook('');
            setFilterMaxCostHook('');
            setFilterStartDateHook('');
            setFilterEndDateHook('');
          }}
          onExportCSV={() => exportToCSV(activeSubscriptions)}
          onExportPDF={() => exportToPDF(activeSubscriptions)}
          darkMode={darkMode}
        />

        {/* Active Subscriptions Table */}
        <SubscriptionTable
          subscriptions={sortedActiveSubscriptions}
          sortConfig={sortConfig}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleCancellation={handleToggleCancellation}
          darkMode={darkMode}
        />

        {/* Pending Cancellations Section */}
        {pendingCancellations.length > 0 && (
          <div className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
            darkMode
              ? 'bg-gradient-to-br from-orange-900/20 to-red-900/10 border border-orange-400/30'
              : 'bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200'
          }`}>
            <div className={`px-8 py-6 border-b ${
              darkMode ? 'border-orange-400/20' : 'border-orange-200'
            }`}>
              <h2 className={`text-2xl font-bold tracking-tight ${
                darkMode ? 'text-orange-300' : 'text-orange-900'
              }`}>
                Pending Cancellations
              </h2>
              <p className={`text-sm mt-3 font-medium ${
                darkMode ? 'text-orange-400/80' : 'text-orange-700'
              }`}>
                These subscriptions will cancel on their next renewal date. They are still included in your future debt calculation.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  darkMode
                    ? 'bg-orange-900/30 border-b border-orange-400/20'
                    : 'bg-orange-100 border-b border-orange-200'
                }`}>
                  <tr>
                    <th className={`px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide ${
                      darkMode ? 'text-orange-300' : 'text-orange-900'
                    }`}>
                      Name
                    </th>
                    <th className={`px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide ${
                      darkMode ? 'text-orange-300' : 'text-orange-900'
                    }`}>
                      Cost
                    </th>
                    <th className={`hidden sm:table-cell px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide ${
                      darkMode ? 'text-orange-300' : 'text-orange-900'
                    }`}>
                      Final Payment Date
                    </th>
                    <th className={`px-8 py-4 text-right text-xs font-semibold uppercase tracking-wide ${
                      darkMode ? 'text-orange-300' : 'text-orange-900'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPendingCancellations.map((sub, index) => (
                    <tr
                      key={sub.id}
                      className={`border-b transition-colors ${
                        darkMode
                          ? `border-orange-400/10 ${index % 2 === 0 ? 'bg-orange-900/15' : 'bg-orange-800/5'} hover:bg-orange-800/20`
                          : `border-orange-200 ${index % 2 === 0 ? 'bg-orange-50' : 'bg-orange-100/50'} hover:bg-orange-100`
                      }`}
                    >
                      <td className={`px-8 py-4 text-sm font-medium ${
                        darkMode ? 'text-orange-300' : 'text-orange-900'
                      }`}>
                        {sub.name}
                      </td>
                      <td className={`px-8 py-4 text-sm font-medium ${
                        darkMode ? 'text-orange-300' : 'text-orange-700'
                      }`}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: sub.currency || 'USD',
                          minimumFractionDigits: 2,
                        }).format(sub.cost)}
                      </td>
                      <td className={`hidden sm:table-cell px-8 py-4 text-sm font-medium ${
                        darkMode ? 'text-orange-300' : 'text-orange-700'
                      }`}>
                        {new Date(sub.nextRenewalDate).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={() => handleToggleCancellation(sub.id, !sub.isAwaitingCancellation)}
                          className={`ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                            darkMode
                              ? 'text-accent-300 hover:bg-accent-300/20 hover:shadow-accent-sm'
                              : 'text-accent-600 hover:bg-accent-100'
                          }`}
                          title="Restore subscription"
                        >
                          <CheckCircle size={16} />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer with About Section */}
      <Footer darkMode={darkMode} />

      {/* Add Subscription Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`sticky top-0 border-b px-7 py-6 flex items-center justify-between ${
              darkMode
                ? 'bg-gray-800 border-accent-300/20'
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold tracking-tight ${
                darkMode ? 'text-accent-300' : 'text-gray-900'
              }`}>
                {editingId ? 'Edit Subscription' : 'Add New Subscription'}
              </h3>
              <button
                onClick={handleCloseForm}
                aria-label={`Close ${editingId ? 'edit subscription' : 'add subscription'} dialog`}
                className={`p-1 transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-accent-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddEdit} className={`p-7 space-y-5`}>
              {/* Name Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-accent-300' : 'text-gray-900'
                }`}>
                  Subscription Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Netflix Premium"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    darkMode
                      ? `bg-gray-700 border-accent-300/30 text-white placeholder-gray-500 focus:ring-accent-300/50 focus:border-accent-300 ${
                        formErrors.name ? 'border-red-500' : ''
                      }`
                      : `border-gray-300 focus:ring-accent-500 focus:border-accent-500 ${
                        formErrors.name ? 'border-red-500' : ''
                      }`
                  }`}
                />
                {formErrors.name && (
                  <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Cost Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-accent-300' : 'text-gray-900'
                }`}>
                  Cost *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  placeholder="0.00"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    darkMode
                      ? `bg-gray-700 border-accent-300/30 text-white placeholder-gray-500 focus:ring-accent-300/50 focus:border-accent-300 ${
                        formErrors.cost ? 'border-red-500' : ''
                      }`
                      : `border-gray-300 focus:ring-accent-500 focus:border-accent-500 ${
                        formErrors.cost ? 'border-red-500' : ''
                      }`
                  }`}
                />
                {formErrors.cost && (
                  <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                    {formErrors.cost}
                  </p>
                )}
              </div>

              {/* Currency Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-accent-300' : 'text-gray-900'
                }`}>
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-accent-300/30 text-white focus:ring-accent-300/50 focus:border-accent-300'
                      : 'border-gray-300 focus:ring-accent-500 focus:border-accent-500'
                  }`}
                >
                  {/* Popular Currencies */}
                  <optgroup label="Popular">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>JPY</option>
                    <option>AUD</option>
                    <option>CAD</option>
                    <option>CHF</option>
                  </optgroup>

                  {/* Asia Pacific */}
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
                  </optgroup>

                  {/* Europe */}
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

                  {/* Americas */}
                  <optgroup label="Americas">
                    <option>ARS</option>
                    <option>BRL</option>
                    <option>CLP</option>
                    <option>COP</option>
                    <option>MXN</option>
                    <option>PEN</option>
                    <option>UYU</option>
                  </optgroup>

                  {/* Middle East & Africa */}
                  <optgroup label="Middle East & Africa">
                    <option>AED</option>
                    <option>EGP</option>
                    <option>ILS</option>
                    <option>KES</option>
                    <option>KWD</option>
                    <option>SAR</option>
                    <option>ZAR</option>
                  </optgroup>
                </select>
              </div>

              {/* Billing Cycle Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-accent-300' : 'text-gray-900'
                }`}>
                  Billing Cycle *
                </label>
                <select
                  required
                  value={formData.billingCycle}
                  onChange={(e) =>
                    setFormData({ ...formData, billingCycle: e.target.value })
                  }
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
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-accent-300' : 'text-gray-900'
                }`}>
                  Next Renewal Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.nextRenewalDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextRenewalDate: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    darkMode
                      ? `bg-gray-700 border-accent-300/30 text-white focus:ring-accent-300/50 focus:border-accent-300 ${
                        formErrors.nextRenewalDate ? 'border-red-500' : ''
                      }`
                      : `border-gray-300 focus:ring-accent-500 focus:border-accent-500 ${
                        formErrors.nextRenewalDate ? 'border-red-500' : ''
                      }`
                  }`}
                />
                {formErrors.nextRenewalDate && (
                  <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                    {formErrors.nextRenewalDate}
                  </p>
                )}
              </div>

              {/* Category Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-accent-300' : 'text-gray-900'
                }`}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-accent-300/30 text-white focus:ring-accent-300/50 focus:border-accent-300'
                      : 'border-gray-300 focus:ring-accent-500 focus:border-accent-500'
                  }`}
                >
                  <option value="">Select a category</option>
                  <option>Entertainment</option>
                  <option>SaaS</option>
                  <option>Health</option>
                  <option>Productivity</option>
                  <option>Cloud Storage</option>
                  <option>Social Media</option>
                  <option>Education</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Status Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-accent-300' : 'text-gray-900'
                }`}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
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
                  onClick={handleCloseForm}
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
      )}

      {/* Budget Configuration Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl max-w-sm w-full transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`border-b px-7 py-6 flex items-center justify-between ${
              darkMode
                ? 'bg-gray-800 border-accent-300/20'
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold tracking-tight ${
                darkMode ? 'text-accent-300' : 'text-gray-900'
              }`}>
                Budget Settings
              </h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                aria-label="Close budget settings dialog"
                className={`p-1 transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-accent-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-6">
              {/* Budget Type Selection */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Budget Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBudgetType('Monthly')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      budgetType === 'Monthly'
                        ? darkMode
                          ? 'bg-accent-300 text-gray-950'
                          : 'bg-accent-500 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBudgetType('Annual')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                      budgetType === 'Annual'
                        ? darkMode
                          ? 'bg-accent-300 text-gray-950'
                          : 'bg-accent-500 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Annual
                  </button>
                </div>
              </div>

              {/* Budget Amount Input */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Budget Limit ({metricsCurrency})
                </label>
                <input
                  type="number"
                  placeholder="Enter budget amount"
                  value={budgetLimit || ''}
                  onChange={(e) => setBudgetLimit(e.target.value ? parseFloat(e.target.value) : null)}
                  className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-accent-300/50'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-accent-300/50'
                  }`}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Current Spending Info */}
              {budgetLimit && (
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <p className={`text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {budgetType} Spending Information:
                  </p>
                  <div className="space-y-1 text-xs">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Current: {metricsCurrency} {currentSpending.toFixed(2)}
                    </p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Budget: {metricsCurrency} {budgetLimit.toFixed(2)}
                    </p>
                    <p className={budgetSpent > 100 ? 'text-red-500' : budgetSpent > 80 ? 'text-yellow-500' : 'text-green-500'}>
                      Used: {budgetSpent.toFixed(0)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    if (budgetLimit) {
                      setToast({
                        message: `Budget set to ${budgetType} ${metricsCurrency} ${budgetLimit.toFixed(2)}`,
                        type: 'success',
                      });
                    }
                    setShowBudgetModal(false);
                  }}
                  className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? 'bg-gradient-to-r from-accent-300 to-accent-400 text-gray-950 hover:shadow-lg hover:shadow-accent-300/50'
                      : 'bg-accent-500 hover:bg-accent-600 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  Save Budget
                </button>
                {budgetLimit && (
                  <button
                    onClick={() => {
                      setBudgetLimit(null);
                      setToast({
                        message: 'Budget cleared',
                        type: 'info',
                      });
                      setShowBudgetModal(false);
                    }}
                    className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-red-400'
                        : 'bg-gray-200 hover:bg-gray-300 text-red-600'
                    }`}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && duplicateMatches.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl max-w-sm w-full transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`border-b px-7 py-6 flex items-center justify-between ${
              darkMode
                ? 'bg-gray-800 border-orange-400/30'
                : 'bg-white border-orange-200'
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-orange-500" size={24} />
                <h3 className={`text-xl font-bold tracking-tight ${
                  darkMode ? 'text-orange-400' : 'text-orange-700'
                }`}>
                  Possible Duplicate
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setPendingFormData(null);
                  setDuplicateMatches([]);
                }}
                aria-label="Close duplicate warning dialog"
                className={`p-1 transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-orange-400' : 'text-gray-500 hover:text-orange-600'
                }`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We found subscriptions with similar names. Make sure you're not adding a duplicate:
              </p>

              <div className="space-y-2">
                {duplicateMatches.map((match, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      darkMode
                        ? 'bg-orange-900/20 border border-orange-400/30'
                        : 'bg-orange-50 border border-orange-300'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {match.name}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {match.similarity.toFixed(0)}% match
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`text-xs font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  New subscription:
                </p>
                <p className={`text-sm font-semibold ${darkMode ? 'text-accent-300' : 'text-accent-600'}`}>
                  {pendingFormData?.name}
                </p>
              </div>

              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Would you like to proceed anyway?
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleProceedWithDuplicate}
                  className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  Yes, Add It
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setPendingFormData(null);
                    setDuplicateMatches([]);
                  }}
                  className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl shadow-2xl max-w-md w-full transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`border-b px-7 py-6 flex items-center justify-between ${
              darkMode
                ? 'bg-gray-800 border-accent-300/20'
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold tracking-tight ${
                darkMode ? 'text-accent-300' : 'text-gray-900'
              }`}>
                Backup & Restore
              </h3>
              <button
                onClick={() => setShowBackupModal(false)}
                aria-label="Close backup and restore dialog"
                className={`p-1 transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-accent-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Backup your subscriptions locally or restore from a previously downloaded backup file.
              </p>

              {/* Download Backup Button */}
              <button
                onClick={handleDownloadBackup}
                className={`w-full flex items-center justify-center gap-3 font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-gradient-to-r from-accent-300 to-accent-400 text-gray-950 hover:shadow-lg hover:shadow-accent-300/50'
                    : 'bg-accent-500 hover:bg-accent-600 text-white shadow-md hover:shadow-lg'
                }`}
              >
                <Download size={20} />
                Download Current Backup
              </button>

              {/* Restore Backup Section */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Restore from File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className={`w-full px-4 py-2 rounded-lg border transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select a .json backup file to restore your subscriptions. This will add all subscriptions from the file.
                </p>
              </div>

              {/* Auto Backup Info */}
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-blue-900/20 border border-blue-400/30' : 'bg-blue-50 border border-blue-300'
              }`}>
                <p className={`text-xs font-medium ${
                  darkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  ℹ️ Automatic Backups
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                  Your subscriptions are automatically backed up to your browser's local storage. Up to 10 backups are kept.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowBackupModal(false)}
                className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
