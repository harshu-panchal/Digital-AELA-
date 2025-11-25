import { useEffect, useRef, useCallback } from "react";
import { isNetworkError } from "../services/api/baseClient";

/**
 * Custom hook for smart polling with circuit breaker pattern
 * Stops polling after consecutive failures and resumes when connection is restored
 * 
 * @param {Function} pollFunction - Async function to call on each poll
 * @param {number} intervalMs - Polling interval in milliseconds
 * @param {Object} options - Configuration options
 * @param {number} options.maxConsecutiveFailures - Max failures before stopping (default: 3)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {Function} options.onError - Error callback
 */
export const useSmartPolling = (
  pollFunction,
  intervalMs,
  options = {}
) => {
  const {
    maxConsecutiveFailures = 3,
    enabled = true,
    onError,
  } = options;

  const intervalRef = useRef(null);
  const consecutiveFailuresRef = useRef(0);
  const isPollingRef = useRef(false);
  const shouldContinueRef = useRef(true);
  const pollFunctionRef = useRef(pollFunction);
  const onErrorRef = useRef(onError);

  // Update refs when dependencies change
  useEffect(() => {
    pollFunctionRef.current = pollFunction;
  }, [pollFunction]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const executePoll = useCallback(async () => {
    if (!shouldContinueRef.current || !enabled || isPollingRef.current) {
      return;
    }

    // If we've exceeded max failures, stop polling
    if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    isPollingRef.current = true;
    try {
      await pollFunctionRef.current();
      // Reset failure count on success
      consecutiveFailuresRef.current = 0;
    } catch (error) {
      const isNetworkErr = isNetworkError(error);
      const isRateLimitError = error.status === 429;
      
      // For rate limit errors, increase polling interval temporarily
      if (isRateLimitError) {
        // Stop current interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Wait longer before retrying (exponential backoff)
        const backoffDelay = Math.min(
          intervalMs * Math.pow(2, consecutiveFailuresRef.current),
          intervalMs * 8 // Max 8x the normal interval
        );
        
        setTimeout(() => {
          if (shouldContinueRef.current && enabled) {
            executePoll();
            intervalRef.current = setInterval(executePoll, intervalMs);
          }
        }, backoffDelay);
        
        consecutiveFailuresRef.current += 1;
      } else if (isNetworkErr && error.status !== 401) {
        // Only count network errors as failures (not auth errors)
        consecutiveFailuresRef.current += 1;
      } else if (!isNetworkErr && error.status !== 401) {
        // For non-network errors (except auth), also count as failure
        consecutiveFailuresRef.current += 1;
      }

      // Call error callback if provided
      if (onErrorRef.current) {
        onErrorRef.current(error, consecutiveFailuresRef.current);
      }

      // Stop polling on auth errors (401)
      if (error.status === 401 && error.requiresLogin) {
        shouldContinueRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [enabled, maxConsecutiveFailures]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    shouldContinueRef.current = true;
    consecutiveFailuresRef.current = 0;

    // Initial poll
    executePoll();

    // Set up interval
    intervalRef.current = setInterval(executePoll, intervalMs);

    return () => {
      shouldContinueRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, enabled]);

  // Function to manually reset the circuit breaker (useful when connection is restored)
  const resetCircuitBreaker = useCallback(() => {
    consecutiveFailuresRef.current = 0;
    shouldContinueRef.current = true;
    
    // Restart polling if it was stopped
    if (!intervalRef.current && enabled) {
      executePoll();
      intervalRef.current = setInterval(executePoll, intervalMs);
    }
  }, [executePoll, intervalMs, enabled]);

  return { resetCircuitBreaker };
};

