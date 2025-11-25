import os from "os";
import mongoose from "mongoose";

// Health thresholds
const HEALTH_THRESHOLDS = {
  MEMORY_USAGE_PERCENT: 85, // Alert if memory usage > 85%
  CPU_USAGE_PERCENT: 90, // Alert if CPU usage > 90%
  DB_RESPONSE_TIME_MS: 1000, // Alert if DB query takes > 1 second
  ERROR_RATE_PERCENT: 5, // Alert if error rate > 5%
};

// Track system metrics
let errorCount = 0;
let requestCount = 0;
let lastHealthCheck = null;

/**
 * Get current memory usage percentage
 */
const getMemoryUsage = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  return (usedMemory / totalMemory) * 100;
};

/**
 * Get current CPU usage (simplified - average over last second)
 */
const getCpuUsage = () => {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~((idle / total) * 100);

  return usage;
};

/**
 * Check database connection health
 */
const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;
    return { healthy: true, responseTime };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

/**
 * Record an error for error rate calculation
 */
export const recordError = () => {
  errorCount++;
  requestCount++;
};

/**
 * Record a successful request
 */
export const recordRequest = () => {
  requestCount++;
};

/**
 * Calculate error rate percentage
 */
const getErrorRate = () => {
  if (requestCount === 0) return 0;
  return (errorCount / requestCount) * 100;
};

/**
 * Reset error tracking (call periodically)
 */
export const resetErrorTracking = () => {
  errorCount = 0;
  requestCount = 0;
};

/**
 * Perform comprehensive system health check
 */
export const performHealthCheck = async () => {
  try {
    const issues = [];

    // Check memory usage
    const memoryUsage = getMemoryUsage();
    if (memoryUsage > HEALTH_THRESHOLDS.MEMORY_USAGE_PERCENT) {
      issues.push({
        type: "memory",
        severity: "high",
        message: `High memory usage: ${memoryUsage.toFixed(1)}%`,
      });
    }

    // Check CPU usage
    const cpuUsage = getCpuUsage();
    if (cpuUsage > HEALTH_THRESHOLDS.CPU_USAGE_PERCENT) {
      issues.push({
        type: "cpu",
        severity: "high",
        message: `High CPU usage: ${cpuUsage.toFixed(1)}%`,
      });
    }

    // Check database health
    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth.healthy) {
      issues.push({
        type: "database",
        severity: "critical",
        message: `Database connection issue: ${dbHealth.error}`,
      });
    } else if (dbHealth.responseTime > HEALTH_THRESHOLDS.DB_RESPONSE_TIME_MS) {
      issues.push({
        type: "database",
        severity: "medium",
        message: `Slow database response: ${dbHealth.responseTime}ms`,
      });
    }

    // Check error rate
    const errorRate = getErrorRate();
    if (
      errorRate > HEALTH_THRESHOLDS.ERROR_RATE_PERCENT &&
      requestCount > 100
    ) {
      // Only check if we have enough requests for meaningful rate
      issues.push({
        type: "errors",
        severity: "high",
        message: `High error rate: ${errorRate.toFixed(
          1
        )}% (${errorCount} errors out of ${requestCount} requests)`,
      });
    }

    lastHealthCheck = {
      timestamp: new Date(),
      memoryUsage,
      cpuUsage,
      databaseHealthy: dbHealth.healthy,
      databaseResponseTime: dbHealth.responseTime,
      errorRate,
      issues: issues.length,
    };

    return lastHealthCheck;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[SystemHealth] Error performing health check:", error);
    return null;
  }
};

/**
 * Get last health check results
 */
export const getLastHealthCheck = () => {
  return lastHealthCheck;
};

/**
 * Initialize health monitoring (call on server start)
 */
export const initializeHealthMonitoring = () => {
  // Perform health check every 5 minutes
  setInterval(async () => {
    await performHealthCheck();
  }, 5 * 60 * 1000);

  // Reset error tracking every hour
  setInterval(() => {
    resetErrorTracking();
  }, 60 * 60 * 1000);

  // Perform initial health check after 1 minute (to let server stabilize)
  setTimeout(async () => {
    await performHealthCheck();
  }, 60 * 1000);

  // eslint-disable-next-line no-console
  console.log("[SystemHealth] Health monitoring initialized");
};
