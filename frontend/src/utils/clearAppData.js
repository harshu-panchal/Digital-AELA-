/**
 * Clear All App Data Utility
 * 
 * Use this when the app is stuck in a loading state.
 * This clears all localStorage, IndexedDB, and caches.
 * 
 * Usage from console:
 * import('/src/utils/clearAppData.js').then(m => m.clearAllAppData())
 */

import { clearAllLocalData } from '../services/api/baseClient';

/**
 * Clear all app data and reload the page
 * Call this when the app is stuck in a loading state
 */
export const clearAllAppData = async () => {
    console.log('[ClearAppData] Starting full data clear...');

    // 1. Clear API caches and tokens
    try {
        clearAllLocalData();
    } catch (e) {
        console.warn('[ClearAppData] Error clearing API data:', e);
    }

    // 2. Clear all localStorage
    try {
        const keysToPreserve = []; // Add any keys to preserve here if needed
        const allKeys = Object.keys(localStorage);

        allKeys.forEach(key => {
            if (!keysToPreserve.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        console.log('[ClearAppData] localStorage cleared');
    } catch (e) {
        console.warn('[ClearAppData] Error clearing localStorage:', e);
    }

    // 3. Clear sessionStorage
    try {
        sessionStorage.clear();
        console.log('[ClearAppData] sessionStorage cleared');
    } catch (e) {
        console.warn('[ClearAppData] Error clearing sessionStorage:', e);
    }

    // 4. Clear IndexedDB (translation cache and others)
    try {
        if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
            const databases = await indexedDB.databases();
            for (const db of databases) {
                if (db.name) {
                    indexedDB.deleteDatabase(db.name);
                }
            }
            console.log('[ClearAppData] IndexedDB cleared');
        }
    } catch (e) {
        console.warn('[ClearAppData] Could not clear IndexedDB:', e);
    }

    // 5. Reload the page to reset app state
    console.log('[ClearAppData] Reloading page...');
    window.location.reload();
};

/**
 * Clear only auth-related data (tokens, session)
 * Use when experiencing login issues
 */
export const clearAuthData = () => {
    console.log('[ClearAppData] Clearing auth data...');

    const authKeys = [
        'aela.auth.tokens',
        'aela.auth.session',
        'aela.auth.users',
        'aela.csrf.token',
        'aela.financial.auth',
    ];

    authKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            // Ignore
        }
    });

    // Clear session storage auth data
    try {
        sessionStorage.removeItem('aela.financial.auth');
    } catch (e) {
        // Ignore
    }

    console.log('[ClearAppData] Auth data cleared');
};

export default clearAllAppData;
