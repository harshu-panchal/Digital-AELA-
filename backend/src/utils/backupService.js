import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup directory
const BACKUP_DIR = path.join(__dirname, "../../backups");

/**
 * Ensure backup directory exists
 */
export const ensureBackupDir = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    return BACKUP_DIR;
  } catch (error) {
    console.error("Failed to create backup directory:", error);
    throw error;
  }
};

/**
 * Create database backup using mongodump
 */
export const createDatabaseBackup = async (backupName) => {
  try {
    await ensureBackupDir();
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-${backupName}-${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Use mongodump to create backup
    // Note: mongodump must be installed on the system
    const dumpCommand = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;

    try {
      await execAsync(dumpCommand, { maxBuffer: 1024 * 1024 * 100 }); // 100MB buffer
    } catch (execError) {
      // If mongodump is not available, create a JSON export instead
      console.warn("mongodump not available, using JSON export method");
      return await createJSONBackup(backupName, backupPath);
    }

    // Get file size
    const stats = await fs.stat(backupPath);
    const fileSize = stats.size;

    return {
      filePath: backupPath,
      fileName: backupFileName,
      fileSize,
    };
  } catch (error) {
    console.error("Database backup error:", error);
    throw error;
  }
};

/**
 * Create JSON backup (fallback method)
 */
export const createJSONBackup = async (backupName, backupPath) => {
  try {
    const connection = mongoose.connection;
    const db = connection.db;
    
    if (!db) {
      throw new Error("Database connection not available");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(BACKUP_DIR, `backup-${backupName}-${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });

    // Get all collections
    const collections = await db.listCollections().toArray();
    const backupData = {
      metadata: {
        database: db.databaseName,
        timestamp: new Date().toISOString(),
        collections: collections.map((c) => c.name),
      },
      data: {},
    };

    // Export each collection
    for (const collection of collections) {
      const collectionData = await db.collection(collection.name).find({}).toArray();
      backupData.data[collection.name] = collectionData;
    }

    // Write backup to file
    const jsonPath = path.join(backupDir, "backup.json");
    await fs.writeFile(jsonPath, JSON.stringify(backupData, null, 2), "utf-8");

    // Create tar.gz archive
    const archiveName = `backup-${backupName}-${timestamp}.tar.gz`;
    const archivePath = path.join(BACKUP_DIR, archiveName);
    
    try {
      // Try to create tar.gz if tar is available
      const tarCommand = `cd "${BACKUP_DIR}" && tar -czf "${archiveName}" "backup-${backupName}-${timestamp}"`;
      await execAsync(tarCommand);
      
      // Remove the directory after archiving
      await fs.rm(backupDir, { recursive: true, force: true });
      
      const stats = await fs.stat(archivePath);
      return {
        filePath: archivePath,
        fileName: archiveName,
        fileSize: stats.size,
      };
    } catch (tarError) {
      // If tar is not available, return the JSON file
      const stats = await fs.stat(jsonPath);
      return {
        filePath: jsonPath,
        fileName: `backup-${backupName}-${timestamp}.json`,
        fileSize: stats.size,
      };
    }
  } catch (error) {
    console.error("JSON backup error:", error);
    throw error;
  }
};

/**
 * Restore database from backup
 */
export const restoreDatabaseBackup = async (backupFilePath) => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    // Check if file exists
    await fs.access(backupFilePath);

    // Determine backup type
    const isGzip = backupFilePath.endsWith(".gz");
    const isJSON = backupFilePath.endsWith(".json");

    if (isGzip) {
      // Use mongorestore for gzip archives
      const restoreCommand = `mongorestore --uri="${mongoUri}" --archive="${backupFilePath}" --gzip --drop`;
      await execAsync(restoreCommand, { maxBuffer: 1024 * 1024 * 100 });
    } else if (isJSON) {
      // Restore from JSON
      const backupData = JSON.parse(await fs.readFile(backupFilePath, "utf-8"));
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error("Database connection not available");
      }

      // Restore each collection
      for (const [collectionName, documents] of Object.entries(backupData.data || {})) {
        if (documents && documents.length > 0) {
          // Drop existing collection
          try {
            await db.collection(collectionName).drop();
          } catch (dropError) {
            // Collection might not exist, continue
          }
          
          // Insert documents
          await db.collection(collectionName).insertMany(documents);
        }
      }
    } else {
      throw new Error("Unsupported backup file format");
    }

    return { success: true };
  } catch (error) {
    console.error("Database restore error:", error);
    throw error;
  }
};

/**
 * Delete backup file
 */
export const deleteBackupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    // File might not exist, that's okay
    if (error.code !== "ENOENT") {
      console.error("Failed to delete backup file:", error);
      throw error;
    }
    return { success: true };
  }
};

/**
 * Get backup file stream for download
 */
export const getBackupFileStream = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const stream = await fs.readFile(filePath);
    return {
      stream,
      size: stats.size,
      filename: path.basename(filePath),
    };
  } catch (error) {
    console.error("Failed to read backup file:", error);
    throw error;
  }
};

/**
 * Clean up expired backups
 */
export const cleanupExpiredBackups = async () => {
  try {
    const Backup = (await import("../models/Backup.js")).default;
    const now = new Date();

    // Find expired backups
    const expiredBackups = await Backup.find({
      expiresAt: { $lte: now },
      status: "completed",
    });

    for (const backup of expiredBackups) {
      if (backup.filePath) {
        try {
          await deleteBackupFile(backup.filePath);
        } catch (error) {
          console.error(`Failed to delete expired backup file: ${backup.filePath}`, error);
        }
      }
      backup.status = "expired";
      await backup.save();
    }

    return { cleaned: expiredBackups.length };
  } catch (error) {
    console.error("Cleanup expired backups error:", error);
    throw error;
  }
};

