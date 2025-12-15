import { memo, useMemo, useCallback } from 'react';

/**
 * Performance Optimization Utilities
 * 
 * This file provides utilities and HOCs for optimizing React components
 */

/**
 * Deep comparison for objects (use sparingly - expensive operation)
 */
export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

/**
 * Shallow comparison for props (recommended for most cases)
 */
export function shallowEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

/**
 * HOC to memoize a component with custom comparison
 * Usage: export default withMemo(MyComponent, shallowEqual);
 */
export function withMemo(Component, areEqual = shallowEqual) {
    return memo(Component, areEqual);
}

/**
 * Hook to create a stable callback that won't cause re-renders
 * Usage: const handleClick = useStableCallback(() => { ... }, [dep1, dep2]);
 */
export function useStableCallback(callback, deps) {
    return useCallback(callback, deps);
}

/**
 * Hook to memoize expensive computations
 * Usage: const result = useMemoizedValue(() => expensiveComputation(data), [data]);
 */
export function useMemoizedValue(factory, deps) {
    return useMemo(factory, deps);
}

/**
 * Debounce function for search inputs and other frequent operations
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll handlers and other high-frequency events
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format price with currency (memoized)
 */
export const formatPrice = (price, currency = 'AED') => {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return `${currency} ${price.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Truncate text with ellipsis (memoized)
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

export default {
    deepEqual,
    shallowEqual,
    withMemo,
    useStableCallback,
    useMemoizedValue,
    debounce,
    throttle,
    formatPrice,
    truncateText,
};
