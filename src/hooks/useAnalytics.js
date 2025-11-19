import { useMemo } from 'react';

/**
 * Custom hook for analytics calculations
 * Handles all metrics, trends, and analytics data
 */
export const useAnalytics = (subscriptions) => {
  // Helper functions for calculations
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

  const calculateRenewalsInNext12Months = (nextRenewalDate, billingCycle) => {
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

  // Calculate total monthly cost
  const totalMonthlyCost = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      return total + calculateMonthlyRate(sub.cost, sub.billingCycle);
    }, 0);
  }, [subscriptions]);

  // Calculate 12-month debt
  const totalDebt12Months = useMemo(() => {
    return subscriptions
      .filter((sub) => !sub.isAwaitingCancellation)
      .reduce((total, sub) => {
        const renewals = calculateRenewalsInNext12Months(
          sub.nextRenewalDate,
          sub.billingCycle
        );
        return total + renewals * sub.cost;
      }, 0);
  }, [subscriptions]);

  // Calculate cancellation debt
  const cancellationDebt = useMemo(() => {
    return subscriptions
      .filter((sub) => sub.isAwaitingCancellation)
      .reduce((total, sub) => {
        const renewals = calculateRenewalsInNext12Months(
          sub.nextRenewalDate,
          sub.billingCycle
        );
        return total + renewals * sub.cost;
      }, 0);
  }, [subscriptions]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryMap = {};

    subscriptions.forEach((sub) => {
      const category = sub.category || 'Uncategorized';
      const monthlyCost = calculateMonthlyRate(sub.cost, sub.billingCycle);

      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += monthlyCost;
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  // Top expensive subscriptions
  const topExpensiveSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => !sub.isAwaitingCancellation)
      .sort(
        (a, b) =>
          calculateMonthlyRate(b.cost, b.billingCycle) -
          calculateMonthlyRate(a.cost, a.billingCycle)
      )
      .slice(0, 5);
  }, [subscriptions]);

  // Upcoming renewals (next 30 days)
  const upcomingRenewals = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return subscriptions
      .filter((sub) => {
        const renewalDate = new Date(sub.nextRenewalDate);
        return (
          renewalDate >= today &&
          renewalDate <= thirtyDaysFromNow &&
          !sub.isAwaitingCancellation
        );
      })
      .sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate));
  }, [subscriptions]);

  // Monthly trend data
  const monthlyTrendData = useMemo(() => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = monthDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });

      const monthCost = subscriptions.reduce((total, sub) => {
        const renewalDate = new Date(sub.nextRenewalDate);
        const cycleInDays =
          sub.billingCycle === 'Monthly'
            ? 30
            : sub.billingCycle === 'Quarterly'
            ? 90
            : 365;

        let currentDate = new Date(renewalDate);
        const monthStart = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1
        );
        const monthEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0
        );

        let renewalsInMonth = 0;
        while (currentDate <= monthEnd) {
          if (currentDate >= monthStart && currentDate <= monthEnd) {
            renewalsInMonth++;
          }
          currentDate = new Date(
            currentDate.getTime() + cycleInDays * 24 * 60 * 60 * 1000
          );
        }

        let monthSubCost = 0;
        if (renewalsInMonth > 0) {
          monthSubCost = sub.cost * renewalsInMonth;
        } else if (sub.billingCycle === 'Monthly') {
          monthSubCost = sub.cost;
        } else if (
          sub.billingCycle === 'Quarterly' &&
          monthDate <=
          new Date(renewalDate.getFullYear(), renewalDate.getMonth() + 3, 0)
        ) {
          monthSubCost = sub.cost / 3;
        } else if (
          sub.billingCycle === 'Annually' &&
          monthDate.getFullYear() === renewalDate.getFullYear()
        ) {
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
  }, [subscriptions]);

  // Statistics
  const statistics = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(
      (sub) => !sub.isAwaitingCancellation
    );
    const awaitingCancellation = subscriptions.filter(
      (sub) => sub.isAwaitingCancellation
    );

    return {
      activeCount: activeSubscriptions.length,
      cancellationCount: awaitingCancellation.length,
      totalCount: subscriptions.length,
      averageCost:
        activeSubscriptions.length > 0
          ? (totalMonthlyCost / activeSubscriptions.length).toFixed(2)
          : 0,
    };
  }, [subscriptions, totalMonthlyCost]);

  return {
    // Metrics
    totalMonthlyCost,
    totalDebt12Months,
    cancellationDebt,

    // Data
    categoryBreakdown,
    topExpensiveSubscriptions,
    upcomingRenewals,
    monthlyTrendData,
    statistics,

    // Helper functions
    calculateMonthlyRate,
    calculateRenewalsInNext12Months,
  };
};
