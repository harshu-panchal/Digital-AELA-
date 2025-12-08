/**
 * Query Logger Utility
 * Monitors slow queries and identifies optimization opportunities
 */

const SLOW_QUERY_THRESHOLD = 100; // 100ms
const queryStats = new Map();

/**
 * Log a query execution
 * @param {string} model - Model name
 * @param {string} operation - Operation type (find, findOne, count, etc.)
 * @param {number} duration - Execution time in ms
 * @param {Object} query - Query object
 */
export const logQuery = (model, operation, duration, query = {}) => {
  if (duration > SLOW_QUERY_THRESHOLD) {
    const key = `${model}.${operation}`;
    const stats = queryStats.get(key) || {
      count: 0,
      totalDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      slowQueries: [],
    };

    stats.count++;
    stats.totalDuration += duration;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.minDuration = Math.min(stats.minDuration, duration);
    
    if (duration > SLOW_QUERY_THRESHOLD * 2) {
      // Very slow queries - log details
      stats.slowQueries.push({
        duration,
        query: JSON.stringify(query).substring(0, 200), // Limit query string length
        timestamp: new Date().toISOString(),
      });
      
      // Keep only last 10 very slow queries
      if (stats.slowQueries.length > 10) {
        stats.slowQueries.shift();
      }
    }

    queryStats.set(key, stats);

    // Log slow queries in development
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[Slow Query] ${model}.${operation} took ${duration}ms`,
        query
      );
    }
  }
};

/**
 * Get query statistics
 * @returns {Object} Query statistics
 */
export const getQueryStats = () => {
  const stats = {};
  queryStats.forEach((value, key) => {
    stats[key] = {
      count: value.count,
      avgDuration: value.count > 0 ? (value.totalDuration / value.count).toFixed(2) : 0,
      maxDuration: value.maxDuration,
      minDuration: value.minDuration === Infinity ? 0 : value.minDuration,
      slowQueries: value.slowQueries,
    };
  });
  return stats;
};

/**
 * Reset query statistics
 */
export const resetQueryStats = () => {
  queryStats.clear();
};

/**
 * Get slow query report
 * @returns {Array} Array of slow query reports
 */
export const getSlowQueryReport = () => {
  const report = [];
  queryStats.forEach((stats, key) => {
    if (stats.count > 0) {
      const avgDuration = stats.totalDuration / stats.count;
      if (avgDuration > SLOW_QUERY_THRESHOLD) {
        report.push({
          query: key,
          count: stats.count,
          avgDuration: avgDuration.toFixed(2),
          maxDuration: stats.maxDuration,
          slowQueries: stats.slowQueries,
        });
      }
    }
  });
  
  // Sort by average duration descending
  return report.sort((a, b) => parseFloat(b.avgDuration) - parseFloat(a.avgDuration));
};

/**
 * Mongoose query middleware wrapper
 * Wraps a query function to log execution time
 */
export const withQueryLogging = (modelName, operation, queryFn) => {
  return async (...args) => {
    const startTime = Date.now();
    try {
      const result = await queryFn(...args);
      const duration = Date.now() - startTime;
      logQuery(modelName, operation, duration, args[0] || {});
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logQuery(modelName, `${operation}_error`, duration, args[0] || {});
      throw error;
    }
  };
};

export default {
  logQuery,
  getQueryStats,
  resetQueryStats,
  getSlowQueryReport,
  withQueryLogging,
};

