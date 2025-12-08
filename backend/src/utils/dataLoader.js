/**
 * DataLoader Pattern Implementation
 * Batches and caches database queries within a single request
 */

class DataLoader {
  constructor(batchLoadFn, options = {}) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.batch = null;
    this.batchSchedule = null;
    this.maxBatchSize = options.maxBatchSize || Infinity;
    this.batchScheduleDelay = options.batchScheduleDelay || 0;
  }

  /**
   * Load a single key
   * @param {*} key - Key to load
   * @returns {Promise} Promise that resolves to the value
   */
  load(key) {
    // Return cached value if available
    if (this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key));
    }

    // Initialize batch if needed
    if (!this.batch) {
      this.batch = new Map();
    }

    // Create promise for this key
    if (!this.batch.has(key)) {
      this.batch.set(
        key,
        new Promise((resolve, reject) => {
          // Store resolve/reject for later
          this.batch.get(key).resolve = resolve;
          this.batch.get(key).reject = reject;
        })
      );
    }

    // Schedule batch execution
    if (!this.batchSchedule) {
      this.batchSchedule = setTimeout(() => {
        this.dispatchBatch();
      }, this.batchScheduleDelay);
    }

    // Execute immediately if batch is full
    if (this.batch.size >= this.maxBatchSize) {
      clearTimeout(this.batchSchedule);
      this.dispatchBatch();
    }

    return this.batch.get(key);
  }

  /**
   * Load multiple keys
   * @param {Array} keys - Keys to load
   * @returns {Promise<Array>} Promise that resolves to array of values
   */
  loadMany(keys) {
    return Promise.all(
      keys.map((key) =>
        this.load(key).catch((error) => error)
      )
    );
  }

  /**
   * Clear cache for a key
   * @param {*} key - Key to clear
   */
  clear(key) {
    this.cache.delete(key);
    return this;
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.cache.clear();
    return this;
  }

  /**
   * Prime cache with a key-value pair
   * @param {*} key - Key
   * @param {*} value - Value
   */
  prime(key, value) {
    this.cache.set(key, value);
    return this;
  }

  /**
   * Dispatch the current batch
   */
  async dispatchBatch() {
    if (!this.batch || this.batch.size === 0) {
      this.batch = null;
      this.batchSchedule = null;
      return;
    }

    const batch = this.batch;
    const keys = Array.from(batch.keys());
    this.batch = null;
    this.batchSchedule = null;

    try {
      const values = await this.batchLoadFn(keys);

      // Resolve all promises
      keys.forEach((key, index) => {
        const value = values[index];
        const promise = batch.get(key);

        if (value instanceof Error) {
          promise.reject(value);
        } else {
          // Cache the value
          this.cache.set(key, value);
          promise.resolve(value);
        }
      });
    } catch (error) {
      // Reject all promises on error
      keys.forEach((key) => {
        batch.get(key).reject(error);
      });
    }
  }
}

/**
 * Create a DataLoader for User model
 * @param {Function} UserModel - Mongoose User model
 * @returns {DataLoader} DataLoader instance
 */
export const createUserLoader = (UserModel) => {
  return new DataLoader(async (userIds) => {
    const users = await UserModel.find({
      _id: { $in: userIds },
    }).lean();

    // Create a map for quick lookup
    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    // Return users in the same order as requested IDs
    return userIds.map((id) => {
      const idStr = id.toString();
      return userMap.get(idStr) || new Error(`User not found: ${idStr}`);
    });
  });
};

/**
 * Create a DataLoader for Course model
 * @param {Function} CourseModel - Mongoose Course model
 * @returns {DataLoader} DataLoader instance
 */
export const createCourseLoader = (CourseModel) => {
  return new DataLoader(async (courseIds) => {
    const courses = await CourseModel.find({
      _id: { $in: courseIds },
    }).lean();

    const courseMap = new Map();
    courses.forEach((course) => {
      courseMap.set(course._id.toString(), course);
    });

    return courseIds.map((id) => {
      const idStr = id.toString();
      return courseMap.get(idStr) || new Error(`Course not found: ${idStr}`);
    });
  });
};

/**
 * Create a DataLoader for any model
 * @param {Function} Model - Mongoose model
 * @param {Object} options - Options (populate, select, etc.)
 * @returns {DataLoader} DataLoader instance
 */
export const createModelLoader = (Model, options = {}) => {
  return new DataLoader(async (ids) => {
    let query = Model.find({
      _id: { $in: ids },
    });

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.lean !== false) {
      query = query.lean();
    }

    const docs = await query;

    const docMap = new Map();
    docs.forEach((doc) => {
      docMap.set(doc._id.toString(), doc);
    });

    return ids.map((id) => {
      const idStr = id.toString();
      return docMap.get(idStr) || new Error(`Document not found: ${idStr}`);
    });
  });
};

export default DataLoader;

