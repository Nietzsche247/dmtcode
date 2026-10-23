import { useEffect, useState, useCallback } from 'react';
import { submitObservation, type ObservationAssets } from '@/lib/submitObservation';
import { useRef } from 'react';
import { toast } from 'sonner';

interface PendingSubmission {
  id: string;
  data: any;
  timestamp: number;
  assets?: ObservationAssets;
}

const STORAGE_KEY = 'dmtcode-pending-submissions';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending count on mount
  useEffect(() => {
    const pending = getPendingSubmissions();
    setPendingCount(pending.length);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncPendingSubmissions();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You are offline. Submissions will sync when reconnected.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPendingSubmissions = (): PendingSubmission[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const savePendingSubmission = useCallback((data: any, assets?: ObservationAssets): string => {
    const pending = getPendingSubmissions();
    const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pending.push({
      id,
      data: { ...data, id: data.id || crypto.randomUUID() },
      assets,
      timestamp: Date.now()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    setPendingCount(pending.length);
    toast.success('Symbol saved offline. Will sync when online.');
    return id;
  }, []);

  const removePendingSubmission = useCallback((id: string) => {
    const pending = getPendingSubmissions();
    const filtered = pending.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    setPendingCount(filtered.length);
  }, []);

  const syncPendingSubmissions = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    
    const pending = getPendingSubmissions();
    if (pending.length === 0) return;
    for (const submission of pending) {
      if (!submission.data.id) submission.data.id = crypto.randomUUID();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    
    syncingRef.current = true;
    setIsSyncing(true);
    toast.info(`Syncing ${pending.length} offline submission(s)...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const submission of pending) {
      try {
        await submitObservation(submission.data, submission.assets);
        removePendingSubmission(submission.id);
        successCount++;
      } catch (err) {
        console.error('Sync failed:', err);
        failCount++;
      }
    }
    
    syncingRef.current = false;
    setIsSyncing(false);
    
    if (successCount > 0) {
      toast.success(`Synced ${successCount} submission(s) successfully!`);
    }
    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} submission(s). Will retry later.`);
    }
  }, [isSyncing, removePendingSubmission]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    savePendingSubmission,
    syncPendingSubmissions,
    getPendingSubmissions
  };
};
