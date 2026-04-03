import { useState, useCallback } from 'react';
import { useToast } from './useToast';

/**
 * useResilientAction — Premium Hook for Resilient API Interactions.
 * 
 * Logic:
 * 1. Executes an async action (usually an API call).
 * 2. Catches "Circuit Breaker OPEN" errors from the backend.
 * 3. Provides 'isSafeMode' flag to allow UI degradation (e.g., showing a Fallback Badge).
 * 4. Integrates with the global toast system for premium feedback.
 */
export function useResilientAction() {
  const [loading, setLoading] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const toast = useToast();

  const execute = useCallback(async (action, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      loadingMessage = "Processing...",
      successMessage = "Action complete",
      errorMessage = "An error occurred"
    } = options;

    setLoading(true);
    try {
      const result = await action();
      
      // If we reach success, assume backend is healthy (or recovering)
      setIsSafeMode(false);
      
      if (onSuccess) onSuccess(result);
      if (successMessage) toast.success(successMessage);
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || errorMessage;
      
      // Detection Logic for Backend Circuit Breaker
      if (errorMsg.includes("Circuit Breaker OPEN")) {
        setIsSafeMode(true);
        toast.warning("AI Provider Overloaded. Switching to Fast Mode (Minimal latency).");
      } else {
        toast.error(errorMsg);
      }

      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    execute,
    loading,
    isSafeMode,
    setIsSafeMode
  };
}
