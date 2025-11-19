import { useState, useMemo } from 'react';
import { useDebounce } from '../utils/debounce';

/**
 * Custom hook for managing filters and search
 * Handles filter state and filtering logic with performance optimization
 */
export const useFilters = (subscriptions) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMinCost, setFilterMinCost] = useState('');
  const [filterMaxCost, setFilterMaxCost] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Debounce search term to reduce re-renders (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(subscriptions.map((sub) => sub.category || 'Uncategorized'));
    return Array.from(cats).sort();
  }, [subscriptions]);

  // Filter subscriptions based on all criteria
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Search filter (using debounced search term for performance)
      if (
        debouncedSearchTerm &&
        !sub.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'active') {
          if (sub.isAwaitingCancellation) return false;
        } else if (filterStatus === 'cancellation') {
          if (!sub.isAwaitingCancellation) return false;
        }
      }

      // Category filter
      if (
        filterCategory !== 'all' &&
        (sub.category || 'Uncategorized') !== filterCategory
      ) {
        return false;
      }

      // Cost range filter
      if (filterMinCost && sub.cost < parseFloat(filterMinCost)) {
        return false;
      }
      if (filterMaxCost && sub.cost > parseFloat(filterMaxCost)) {
        return false;
      }

      // Date range filter
      if (filterStartDate) {
        const subDate = new Date(sub.nextRenewalDate);
        const startDate = new Date(filterStartDate);
        if (subDate < startDate) return false;
      }

      if (filterEndDate) {
        const subDate = new Date(sub.nextRenewalDate);
        const endDate = new Date(filterEndDate);
        if (subDate > endDate) return false;
      }

      return true;
    });
  }, [
    subscriptions,
    debouncedSearchTerm,
    filterStatus,
    filterCategory,
    filterMinCost,
    filterMaxCost,
    filterStartDate,
    filterEndDate,
  ]);

  // Sort filtered subscriptions
  const sortedSubscriptions = useMemo(() => {
    const sorted = [...filteredSubscriptions];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle date comparison
        if (sortConfig.key === 'nextRenewalDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        // Handle string comparison
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sorted;
  }, [filteredSubscriptions, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterMinCost('');
    setFilterMaxCost('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  return {
    // Filter state
    searchTerm,
    debouncedSearchTerm, // Debounced for performance
    filterStatus,
    filterCategory,
    filterMinCost,
    filterMaxCost,
    filterStartDate,
    filterEndDate,
    sortConfig,

    // Filter setters
    setSearchTerm,
    setFilterStatus,
    setFilterCategory,
    setFilterMinCost,
    setFilterMaxCost,
    setFilterStartDate,
    setFilterEndDate,
    setSortConfig,

    // Computed values
    categories,
    filteredSubscriptions,
    sortedSubscriptions,

    // Handlers
    handleSort,
    resetFilters,
  };
};
