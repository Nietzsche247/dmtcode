import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDashboardTracking } from './useDashboardTracking';

export const useSaveSymbol = (symbolId: string) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { trackSymbolSaved, trackSymbolUnsaved } = useDashboardTracking();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId && symbolId) {
      checkIfSaved();
    }
  }, [userId, symbolId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
  };

  const checkIfSaved = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('saved_symbols')
      .select('id')
      .eq('user_id', userId)
      .eq('symbol_id', symbolId)
      .maybeSingle();

    setIsSaved(!!data);
  };

  const toggleSave = useCallback(async () => {
    if (!userId) {
      toast.error('Please log in to save symbols');
      return false;
    }

    setLoading(true);

    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_symbols')
          .delete()
          .eq('user_id', userId)
          .eq('symbol_id', symbolId);

        if (error) throw error;

        trackSymbolUnsaved(symbolId);
        setIsSaved(false);
        toast.success('Symbol removed from saved');
      } else {
        // Save
        const { error } = await supabase
          .from('saved_symbols')
          .insert({
            user_id: userId,
            symbol_id: symbolId,
          });

        if (error) throw error;

        trackSymbolSaved(symbolId);
        setIsSaved(true);
        toast.success('Symbol saved');
      }

      return true;
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save symbol');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, symbolId, isSaved, trackSymbolSaved, trackSymbolUnsaved]);

  return {
    userId,
    isSaved,
    loading,
    toggleSave,
  };
};