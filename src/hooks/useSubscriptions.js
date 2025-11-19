import { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { validateSubscription, sanitizeSubscriptionForDisplay } from '../utils/securityUtils';

/**
 * Custom hook for managing subscription data
 * Handles Firestore sync, CRUD operations, and local caching
 */
export const useSubscriptions = (authUser) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    currency: 'USD',
    billingCycle: 'Monthly',
    nextRenewalDate: '',
    category: '',
    status: 'Active',
    paymentHistory: [],
    isAwaitingCancellation: false,
  });
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const db = getFirestore();
  const initialFormData = { ...formData };

  // Setup Firestore listener for real-time updates
  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      setSubscriptions([]);
      return;
    }

    const appId = window.__appId || 'default';
    const subscriptionsRef = collection(
      db,
      `artifacts/${appId}/users/${authUser.uid}/subscriptions`
    );

    const unsubscribe = onSnapshot(
      subscriptionsRef,
      (snapshot) => {
        const subs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...sanitizeSubscriptionForDisplay(doc.data()),
        }));
        setSubscriptions(subs);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscriptions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, db]);

  // Automatic backup to localStorage
  useEffect(() => {
    if (subscriptions.length > 0) {
      const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        subscriptions: subscriptions,
        count: subscriptions.length,
      };

      const backupsKey = 'subscriptions_backups';
      let backups = [];
      try {
        const stored = localStorage.getItem(backupsKey);
        if (stored) {
          backups = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading existing backups:', e);
      }

      backups.push(backup);
      if (backups.length > 10) {
        backups = backups.slice(-10);
      }

      try {
        localStorage.setItem(backupsKey, JSON.stringify(backups));
        localStorage.setItem('subscriptions_latest_backup', JSON.stringify(backup));
      } catch (e) {
        console.error('Error saving backup:', e);
      }
    }
  }, [subscriptions]);

  // Add or update subscription
  const handleAddSubscription = async (overrideDuplicateCheck = false) => {
    const validation = validateSubscription(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors || {});
      return { success: false, errors: validation.errors };
    }

    try {
      const appId = window.__appId || 'default';
      const subscriptionsRef = collection(
        db,
        'artifacts',
        appId,
        'users',
        authUser.uid,
        'subscriptions'
      );

      if (editingId) {
        const docRef = doc(subscriptionsRef, editingId);
        await updateDoc(docRef, validation.sanitized);
      } else {
        await addDoc(subscriptionsRef, validation.sanitized);
      }

      setFormData(initialFormData);
      setEditingId(null);
      setFormErrors({});
      return { success: true };
    } catch (error) {
      console.error('Error saving subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete subscription
  const handleDeleteSubscription = async (id) => {
    try {
      const appId = window.__appId || 'default';
      const subscriptionsRef = collection(
        db,
        'artifacts',
        appId,
        'users',
        authUser.uid,
        'subscriptions'
      );
      const docRef = doc(subscriptionsRef, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Toggle cancellation status
  const handleToggleCancellation = async (id, isAwaitingCancellation) => {
    try {
      const appId = window.__appId || 'default';
      const subscriptionsRef = collection(
        db,
        'artifacts',
        appId,
        'users',
        authUser.uid,
        'subscriptions'
      );
      const docRef = doc(subscriptionsRef, id);
      await updateDoc(docRef, {
        isAwaitingCancellation: !isAwaitingCancellation,
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Edit subscription
  const handleEditSubscription = (subscription) => {
    setFormData(subscription);
    setEditingId(subscription.id);
    setFormErrors({});
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setFormErrors({});
  };

  return {
    // State
    subscriptions,
    loading,
    formData,
    editingId,
    formErrors,

    // State setters
    setFormData,
    setEditingId,
    setFormErrors,
    setSubscriptions,

    // Handlers
    handleAddSubscription,
    handleDeleteSubscription,
    handleToggleCancellation,
    handleEditSubscription,
    handleCancelEdit,
  };
};
