import express from "express";
import { apiRateLimiter } from "./rateLimiter.js";

const router = express.Router();

/**
 * Batch Request Handler
 * Allows multiple API requests in a single HTTP request
 * 
 * POST /api/v1/batch
 * Body: {
 *   requests: [
 *     { method: "GET", path: "/api/v1/courses", headers: {} },
 *     { method: "GET", path: "/api/v1/jobs", headers: {} }
 *   ]
 * }
 */
export const batchHandler = async (req, res, next) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "requests must be a non-empty array",
        },
      });
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 20;
    if (requests.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Batch size cannot exceed ${MAX_BATCH_SIZE} requests`,
        },
      });
    }

    // Execute requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (request, index) => {
        try {
          const { method, path, headers = {}, body = null } = request;

          // Validate request
          if (!method || !path) {
            throw new Error("method and path are required");
          }

          if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
            throw new Error(`Invalid method: ${method}`);
          }

          // Create a new request object for internal routing
          const internalReq = {
            method: method.toUpperCase(),
            path,
            headers: {
              ...req.headers,
              ...headers,
            },
            body,
            query: {},
            auth: req.auth, // Preserve authentication
          };

          // For now, return a placeholder response
          // In a full implementation, you would route the request internally
          // This is a simplified version that returns the request details
          return {
            index,
            status: 200,
            data: {
              message: "Batch request processed",
              method,
              path,
            },
          };
        } catch (error) {
          return {
            index,
            status: 400,
            error: {
              code: "BATCH_REQUEST_ERROR",
              message: error.message,
            },
          };
        }
      })
    );

    // Format results
    const responses = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          index,
          status: 500,
          error: {
            code: "BATCH_REQUEST_ERROR",
            message: result.reason?.message || "Unknown error",
          },
        };
      }
    });

    return res.json({
      responses,
      count: responses.length,
    });
  } catch (error) {
    return next(error);
  }
};

// Apply rate limiting to batch endpoint
// Use a more specific path to avoid conflicts
router.post("/batch", apiRateLimiter, batchHandler);

export default router;

