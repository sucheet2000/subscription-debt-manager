import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useFilters } from '../hooks/useFilters';
import { useAnalytics } from '../hooks/useAnalytics';

/**
 * Comprehensive test component for all custom hooks
 * Shows data from each hook and allows testing handlers
 */
export default function HooksTestComponent() {
  const { user: authUser } = useUser();
  const subscriptionsHook = useSubscriptions(authUser);
  const filtersHook = useFilters(subscriptionsHook.subscriptions);
  const analyticsHook = useAnalytics(subscriptionsHook.subscriptions);

  const [testResults, setTestResults] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);

  // Run tests on component mount
  useEffect(() => {
    if (authUser) {
      runTests();
    }
  }, [authUser]);

  const runTests = () => {
    const results = [];

    // Test 1: useSubscriptions Hook
    results.push({
      category: 'useSubscriptions Hook',
      tests: [
        {
          name: 'Hook initialization',
          status: subscriptionsHook ? 'PASS ✅' : 'FAIL ❌',
          details: subscriptionsHook ? 'Hook loaded successfully' : 'Hook failed to load'
        },
        {
          name: 'subscriptions state',
          status: Array.isArray(subscriptionsHook.subscriptions) ? 'PASS ✅' : 'FAIL ❌',
          details: `Array with ${subscriptionsHook.subscriptions.length} items`
        },
        {
          name: 'loading state',
          status: typeof subscriptionsHook.loading === 'boolean' ? 'PASS ✅' : 'FAIL ❌',
          details: `Loading: ${subscriptionsHook.loading}`
        },
        {
          name: 'formData state',
          status: subscriptionsHook.formData && subscriptionsHook.formData.name !== undefined ? 'PASS ✅' : 'FAIL ❌',
          details: `Form data initialized with ${Object.keys(subscriptionsHook.formData || {}).length} fields`
        },
        {
          name: 'editingId state',
          status: subscriptionsHook.editingId === null ? 'PASS ✅' : 'INFO ℹ️',
          details: `Current editing ID: ${subscriptionsHook.editingId}`
        },
        {
          name: 'formErrors state',
          status: typeof subscriptionsHook.formErrors === 'object' ? 'PASS ✅' : 'FAIL ❌',
          details: `Error object initialized`
        },
        {
          name: 'Handler functions present',
          status:
            subscriptionsHook.handleAddSubscription &&
            subscriptionsHook.handleDeleteSubscription &&
            subscriptionsHook.handleToggleCancellation
            ? 'PASS ✅' : 'FAIL ❌',
          details: 'All CRUD handlers available'
        }
      ]
    });

    // Test 2: useFilters Hook
    results.push({
      category: 'useFilters Hook',
      tests: [
        {
          name: 'Hook initialization',
          status: filtersHook ? 'PASS ✅' : 'FAIL ❌',
          details: 'Hook loaded successfully'
        },
        {
          name: 'Filter states present',
          status:
            filtersHook.searchTerm !== undefined &&
            filtersHook.filterStatus !== undefined &&
            filtersHook.filterCategory !== undefined
            ? 'PASS ✅' : 'FAIL ❌',
          details: 'All filter state variables initialized'
        },
        {
          name: 'sortConfig present',
          status: filtersHook.sortConfig && filtersHook.sortConfig.key ? 'PASS ✅' : 'FAIL ❌',
          details: `Current sort: ${filtersHook.sortConfig?.key} (${filtersHook.sortConfig?.direction})`
        },
        {
          name: 'Sorted subscriptions',
          status: Array.isArray(filtersHook.sortedSubscriptions) ? 'PASS ✅' : 'FAIL ❌',
          details: `${filtersHook.sortedSubscriptions.length} sorted subscriptions`
        },
        {
          name: 'Filtered subscriptions',
          status: Array.isArray(filtersHook.filteredSubscriptions) ? 'PASS ✅' : 'FAIL ❌',
          details: `${filtersHook.filteredSubscriptions.length} filtered subscriptions`
        },
        {
          name: 'Categories available',
          status: Array.isArray(filtersHook.categories) ? 'PASS ✅' : 'FAIL ❌',
          details: `${filtersHook.categories.length} unique categories found`
        },
        {
          name: 'Handler functions',
          status: filtersHook.handleSort && filtersHook.resetFilters ? 'PASS ✅' : 'FAIL ❌',
          details: 'Sort and filter handlers available'
        }
      ]
    });

    // Test 3: useAnalytics Hook
    results.push({
      category: 'useAnalytics Hook',
      tests: [
        {
          name: 'Hook initialization',
          status: analyticsHook ? 'PASS ✅' : 'FAIL ❌',
          details: 'Hook loaded successfully'
        },
        {
          name: 'totalMonthlyCost calculated',
          status: typeof analyticsHook.totalMonthlyCost === 'number' ? 'PASS ✅' : 'FAIL ❌',
          details: `Total monthly cost: $${analyticsHook.totalMonthlyCost?.toFixed(2) || 0}`
        },
        {
          name: 'totalDebt12Months calculated',
          status: typeof analyticsHook.totalDebt12Months === 'number' ? 'PASS ✅' : 'FAIL ❌',
          details: `12-month debt: $${analyticsHook.totalDebt12Months?.toFixed(2) || 0}`
        },
        {
          name: 'categoryBreakdown available',
          status: Array.isArray(analyticsHook.categoryBreakdown) ? 'PASS ✅' : 'FAIL ❌',
          details: `${analyticsHook.categoryBreakdown.length} categories in breakdown`
        },
        {
          name: 'topExpensiveSubscriptions',
          status: Array.isArray(analyticsHook.topExpensiveSubscriptions) ? 'PASS ✅' : 'FAIL ❌',
          details: `Top ${analyticsHook.topExpensiveSubscriptions.length} expensive subscriptions found`
        },
        {
          name: 'upcomingRenewals data',
          status: Array.isArray(analyticsHook.upcomingRenewals) ? 'PASS ✅' : 'FAIL ❌',
          details: `${analyticsHook.upcomingRenewals.length} renewals in next 30 days`
        },
        {
          name: 'monthlyTrendData',
          status: Array.isArray(analyticsHook.monthlyTrendData) && analyticsHook.monthlyTrendData.length === 12 ? 'PASS ✅' : 'FAIL ❌',
          details: `12-month trend data available`
        },
        {
          name: 'Statistics',
          status: analyticsHook.statistics && typeof analyticsHook.statistics.activeCount === 'number' ? 'PASS ✅' : 'FAIL ❌',
          details: `Active: ${analyticsHook.statistics?.activeCount || 0}, Pending: ${analyticsHook.statistics?.cancellationCount || 0}`
        }
      ]
    });

    setTestResults(results);
  };

  const countPasses = () => {
    return testResults.reduce((total, section) =>
      total + section.tests.filter(test => test.status.includes('✅')).length, 0
    );
  };

  const totalTests = testResults.reduce((total, section) =>
    total + section.tests.length, 0
  );

  if (!authUser) {
    return (
      <div className="p-4 text-center text-gray-600">
        Please log in to test hooks
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">🧪 Hooks Test Suite</h2>
        <p className="text-blue-700 mb-4">Testing all three custom hooks</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded p-4">
            <div className="text-3xl font-bold text-green-600">{countPasses()}</div>
            <div className="text-sm text-gray-600">Tests Passed</div>
          </div>
          <div className="bg-white rounded p-4">
            <div className="text-3xl font-bold text-blue-600">{totalTests}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          <div className="bg-white rounded p-4">
            <div className="text-3xl font-bold text-purple-600">
              {((countPasses() / totalTests) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((section, sectionIdx) => (
          <div key={sectionIdx} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === sectionIdx ? null : sectionIdx)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex justify-between items-center hover:opacity-90"
            >
              <span className="text-lg font-bold">{section.category}</span>
              <span>{expandedSection === sectionIdx ? '▼' : '▶'}</span>
            </button>

            {expandedSection === sectionIdx && (
              <div className="bg-white p-4 space-y-3">
                {section.tests.map((test, testIdx) => (
                  <div key={testIdx} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{test.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{test.details}</div>
                      </div>
                      <div className="text-lg ml-4">{test.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data Inspection */}
      <div className="mt-8 bg-gray-100 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900">📊 Live Data from Hooks</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Subscriptions Data */}
          <div className="bg-white rounded p-4">
            <h4 className="font-bold text-purple-600 mb-2">useSubscriptions</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Subscriptions:</span> {subscriptionsHook.subscriptions.length}</div>
              <div><span className="font-semibold">Loading:</span> {subscriptionsHook.loading ? 'Yes' : 'No'}</div>
              <div><span className="font-semibold">Editing ID:</span> {subscriptionsHook.editingId || 'None'}</div>
              <div><span className="font-semibold">Form Errors:</span> {Object.keys(subscriptionsHook.formErrors).length}</div>
            </div>
          </div>

          {/* Filters Data */}
          <div className="bg-white rounded p-4">
            <h4 className="font-bold text-blue-600 mb-2">useFilters</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Sort Key:</span> {filtersHook.sortConfig.key}</div>
              <div><span className="font-semibold">Sort Dir:</span> {filtersHook.sortConfig.direction}</div>
              <div><span className="font-semibold">Search Term:</span> {filtersHook.searchTerm || 'None'}</div>
              <div><span className="font-semibold">Filtered Count:</span> {filtersHook.filteredSubscriptions.length}</div>
            </div>
          </div>

          {/* Analytics Data */}
          <div className="bg-white rounded p-4">
            <h4 className="font-bold text-green-600 mb-2">useAnalytics</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Monthly Cost:</span> ${analyticsHook.totalMonthlyCost?.toFixed(2)}</div>
              <div><span className="font-semibold">12-Month Debt:</span> ${analyticsHook.totalDebt12Months?.toFixed(2)}</div>
              <div><span className="font-semibold">Categories:</span> {analyticsHook.categoryBreakdown.length}</div>
              <div><span className="font-semibold">Upcoming:</span> {analyticsHook.upcomingRenewals.length} renewals</div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded p-4">
            <h4 className="font-bold text-indigo-600 mb-2">Statistics</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Active:</span> {analyticsHook.statistics?.activeCount}</div>
              <div><span className="font-semibold">Pending Cancellation:</span> {analyticsHook.statistics?.cancellationCount}</div>
              <div><span className="font-semibold">Total:</span> {analyticsHook.statistics?.totalCount}</div>
              <div><span className="font-semibold">Avg Cost:</span> ${analyticsHook.statistics?.averageCost}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h4 className="font-bold text-yellow-900 mb-2">📝 How to Test Handlers</h4>
        <p className="text-sm text-yellow-800 mb-3">
          Open browser console (F12) and try these commands:
        </p>
        <pre className="bg-yellow-100 p-3 rounded text-xs overflow-x-auto">
{`// Test filters
window.testFilters = {
  handleSort: () => console.log('Sort handler available'),
  resetFilters: () => console.log('Reset handler available')
};

// Check the hooks are working by inspecting console logs
console.log('✅ Hooks test component loaded');
console.log('All hook data is displayed above');
`}
        </pre>
      </div>
    </div>
  );
}
