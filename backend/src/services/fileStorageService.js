import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Optional sharp import for image metadata
let sharp = null;
try {
  const sharpModule = await import("sharp");
  sharp = sharpModule.default;
} catch {
  // Sharp not available, will skip metadata extraction
  // This is optional - image uploads will work without it
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the root directory (two levels up from services)
const rootDir = path.resolve(__dirname, "../..");
const dataDir = path.resolve(rootDir, "../frontend/data");

/**
 * Map Cloudinary folder paths to local storage paths
 */
const mapFolderToLocalPath = (cloudinaryFolder) => {
  // Remove "digital-aela" prefix if present
  let folder = cloudinaryFolder.replace(/^digital-aela\/?/, "");

  // Check for exact matches first (most specific)
  if (folder === "courses/covers" || folder.startsWith("courses/covers/")) {
    return "photos/courses";
  }
  if (folder === "books/covers" || folder.startsWith("books/covers/")) {
    return "photos/bookscovers";
  }

  // Map common folder patterns
  const folderMappings = {
    profiles: "photos/profiles",
    gallery: "photos/gallery",
    testimonials: "photos/testimonials",
    certificates: "photos/certificates",
    "course-videos": "videos/coursesVideos",
    "join-us": "documents", // Will be handled more specifically
    audio: "audio",
    documents: "documents",
  };

  // Check for specific mappings
  for (const [key, value] of Object.entries(folderMappings)) {
    if (folder.includes(key)) {
      // Extract additional path info (like course ID)
      const parts = folder.split("/");
      const keyIndex = parts.findIndex((p) => p.includes(key.split("/")[0]));

      if (folder.includes("join-us")) {
        // Handle join-us applications - determine type from folder structure
        const joinUsMatch = folder.match(/join-us\/([^\/]+)\/(.+)/);
        if (joinUsMatch) {
          const [, applicationType, fieldName] = joinUsMatch;
          // Determine if it's image, video, or document
          if (fieldName.includes("video") || fieldName.includes("Video")) {
            return `videos/formVideos/${applicationType}`;
          } else if (
            fieldName.includes("pdf") ||
            fieldName.includes("document") ||
            fieldName.includes("resume")
          ) {
            return `PDFs/documents/${applicationType}`;
          } else {
            return `photos/profiles`; // Default for images in join-us
          }
        }
        return `PDFs/documents`;
      }

      return value;
    }
  }

  // Handle course videos specifically (courses/{id}/videos pattern)
  if (folder.startsWith("courses/") && folder.includes("/videos")) {
    const courseIdMatch = folder.match(/courses\/([^\/]+)/);
    if (courseIdMatch) {
      const courseId = courseIdMatch[1];
      return `videos/coursesVideos/${courseId}`;
    }
    return "videos/coursesVideos";
  }

  // Default mappings based on folder name
  if (folder.includes("invoice")) {
    return "PDFs/invoices";
  }
  if (folder.includes("ebook")) {
    return "PDFs/ebooks";
  }
  if (folder.includes("certificate")) {
    return "PDFs/certificates";
  }
  if (folder.includes("brochure")) {
    return "PDFs/courseBrochures";
  }
  if (folder.includes("video")) {
    return "videos/coursesVideos";
  }
  if (folder.includes("profile")) {
    return "photos/profiles";
  }
  if (folder.includes("course")) {
    return "photos/courses";
  }
  if (folder.includes("book")) {
    return "photos/bookscovers";
  }
  if (folder.includes("job")) {
    return "photos/jobscover";
  }
  if (folder.includes("blog")) {
    return "photos/blogimages";
  }

  // Default to photos if no match
  return "photos/profiles";
};

/**
 * Generate unique filename
 */
const generateFilename = (originalName, extension) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = extension || path.extname(originalName || "").slice(1) || "jpg";
  return `${timestamp}-${random}.${ext}`;
};

/**
 * Get file extension from mimetype
 */
const getExtensionFromMimeType = (mimetype) => {
  const mimeMap = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "video/mp4": "mp4",
    "video/mpeg": "mpg",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
    "video/webm": "webm",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
  };
  return mimeMap[mimetype] || "bin";
};

/**
 * Save image to local storage
 */
export const saveImageToLocal = async (
  fileInput,
  folder = "digital-aela",
  originalName = null
) => {
  try {
    let fileSize = 0;

    // Validate input
    if (Buffer.isBuffer(fileInput)) {
      if (fileInput.length === 0) throw new Error("Buffer is empty");
      fileSize = fileInput.length;
    } else if (typeof fileInput === "string") {
      try {
        const stats = await fs.stat(fileInput);
        fileSize = stats.size;
      } catch (err) {
        throw new Error(`File not found at path: ${fileInput}`);
      }
    } else {
      throw new Error("Invalid input: must be a buffer or file path");
    }

    // Map folder to local path
    const localFolder = mapFolderToLocalPath(folder);
    const fullPath = path.join(dataDir, localFolder);

    // Ensure directory exists
    await fs.mkdir(fullPath, { recursive: true });

    // Get image metadata using sharp (if available)
    let metadata = {};
    let format = "jpg";
    let width = null;
    let height = null;

    if (sharp) {
      try {
        // If fileInput is a path, sharp can read from it directly
        const imageMetadata = await sharp(fileInput).metadata();
        format = imageMetadata.format || "jpg";
        width = imageMetadata.width;
        height = imageMetadata.height;
      } catch (e) {
        console.warn(
          "[FileStorage] Sharp metadata extraction failed:",
          e.message
        );
      }
    } else if (originalName) {
      format = path.extname(originalName).slice(1).toLowerCase() || "jpg";
    }

    // Generate filename
    const filename = generateFilename(originalName, format);
    const filePath = path.join(fullPath, filename);

    // Write file to disk
    if (Buffer.isBuffer(fileInput)) {
      await fs.writeFile(filePath, fileInput);
    } else {
      // If it's a file path (from multer diskStorage), try to move it
      try {
        await fs.rename(fileInput, filePath);
      } catch (err) {
        // If rename fails (e.g., across partitions EXDEV), fall back to copy + unlink
        if (err.code === 'EXDEV') {
          await fs.copyFile(fileInput, filePath);
          try {
            await fs.unlink(fileInput);
          } catch (unlinkErr) {
            console.warn("[FileStorage] Failed to delete temp file:", unlinkErr);
          }
        } else {
          throw err;
        }
      }
    }

    // Generate URL
    const url = `/static/${localFolder}/${filename}`;
    const relativePath = `${localFolder}/${filename}`;

    return {
      filePath: relativePath,
      url,
      format,
      width,
      height,
      bytes: fileSize,
      public_id: relativePath.replace(/\//g, "-"),
    };
  } catch (error) {
    console.error("[FileStorage] Error saving image:", error);
    throw error;
  }
};

/**
 * Save video to local storage
 */
export const saveVideoToLocal = async (
  fileInput,
  folder = "digital-aela/course-videos",
  originalName = null
) => {
  try {
    let fileSize = 0;

    // Validate input (buffer or file path)
    if (Buffer.isBuffer(fileInput)) {
      if (fileInput.length === 0) throw new Error("Buffer is empty");
      fileSize = fileInput.length;
    } else if (typeof fileInput === "string") {
      // Check if file exists
      try {
        const stats = await fs.stat(fileInput);
        fileSize = stats.size;
      } catch (err) {
        throw new Error(`File not found at path: ${fileInput}`);
      }
    } else {
      throw new Error("Invalid input: must be a buffer or file path");
    }

    // Map folder to local path
    let localFolder = mapFolderToLocalPath(folder);

    // Extract course ID from folder if present (digital-aela/courses/{id}/videos)
    const courseIdMatch = folder.match(/courses\/([^\/]+)/);
    if (courseIdMatch) {
      const courseId = courseIdMatch[1];
      localFolder = `videos/coursesVideos/${courseId}`;
    }

    const fullPath = path.join(dataDir, localFolder);

    // Ensure directory exists
    await fs.mkdir(fullPath, { recursive: true });

    // Determine format from original name or default to mp4
    let format = "mp4";
    if (originalName) {
      const ext = path.extname(originalName).slice(1).toLowerCase();
      if (["mp4", "mov", "avi", "webm", "mpeg"].includes(ext)) {
        format = ext;
      }
    }

    // Generate filename
    const filename = generateFilename(originalName, format);
    const filePath = path.join(fullPath, filename);

    // Write file to disk
    if (Buffer.isBuffer(fileInput)) {
      await fs.writeFile(filePath, fileInput);
    } else {
      // If it's a file path (from multer diskStorage), try to move it
      try {
        await fs.rename(fileInput, filePath);
      } catch (err) {
        // If rename fails (e.g., across partitions EXDEV), fall back to copy + unlink
        if (err.code === 'EXDEV') {
          await fs.copyFile(fileInput, filePath);
          try {
            await fs.unlink(fileInput);
          } catch (unlinkErr) {
            console.warn("[FileStorage] Failed to delete temp file:", unlinkErr);
          }
        } else {
          throw err;
        }
      }
    }

    // Generate URL
    const url = `/static/${localFolder}/${filename}`;
    const relativePath = `${localFolder}/${filename}`;

    return {
      filePath: relativePath,
      url,
      format,
      duration: null, // Video duration would require ffmpeg/ffprobe
      width: null,
      height: null,
      bytes: fileSize,
      // Keep public_id for backward compatibility
      public_id: relativePath.replace(/\//g, "-"),
    };
  } catch (error) {
    console.error("[FileStorage] Error saving video:", error);
    throw error;
  }
};

/**
 * Save PDF to local storage
 */
export const savePdfToLocal = async (
  buffer,
  folder = "digital-aela/course-brochures",
  originalName = null
) => {
  try {
    // Validate buffer
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Invalid buffer provided");
    }

    if (buffer.length === 0) {
      throw new Error("Buffer is empty");
    }

    // Map folder to local path
    let localFolder = mapFolderToLocalPath(folder);

    // Handle specific PDF types
    if (folder.includes("invoice")) {
      // Extract payment ID if present (digital-aela/invoices/{paymentId})
      const invoiceMatch = folder.match(/invoices\/([^\/]+)/);
      if (invoiceMatch) {
        const paymentId = invoiceMatch[1];
        localFolder = `PDFs/invoices/${paymentId}`;
      } else {
        localFolder = "PDFs/invoices";
      }
    } else if (folder.includes("ebook")) {
      // Extract user ID if present (digital-aela/ebooks/{userId})
      const ebookMatch = folder.match(/ebooks\/([^\/]+)/);
      if (ebookMatch) {
        const userId = ebookMatch[1];
        localFolder = `PDFs/ebooks/${userId}`;
      } else {
        localFolder = "PDFs/ebooks";
      }
    } else if (folder.includes("certificate")) {
      // Extract certificate ID if present
      const certMatch = folder.match(/certificates\/([^\/]+)/);
      if (certMatch) {
        const certId = certMatch[1];
        localFolder = `PDFs/certificates/${certId}`;
      } else {
        localFolder = "PDFs/certificates";
      }
    } else if (folder.includes("brochure")) {
      localFolder = "PDFs/courseBrochures";
    } else {
      localFolder = "PDFs/documents";
    }

    const fullPath = path.join(dataDir, localFolder);

    // Ensure directory exists
    await fs.mkdir(fullPath, { recursive: true });

    // Generate filename
    const filename = generateFilename(originalName, "pdf");
    const filePath = path.join(fullPath, filename);

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    // Generate URL
    const url = `/static/${localFolder}/${filename}`;
    const relativePath = `${localFolder}/${filename}`;

    return {
      filePath: relativePath,
      url,
      format: "pdf",
      bytes: buffer.length,
      // Keep public_id for backward compatibility
      public_id: relativePath.replace(/\//g, "-"),
    };
  } catch (error) {
    console.error("[FileStorage] Error saving PDF:", error);
    throw error;
  }
};

/**
 * Save document to local storage (PDF, Word, Excel, PowerPoint)
 */
export const saveDocumentToLocal = async (
  fileInput,
  folder = "digital-aela/documents",
  originalName = null,
  mimetype = null
) => {
  try {
    let fileSize = 0;

    // Validate input (buffer or file path)
    if (Buffer.isBuffer(fileInput)) {
      if (fileInput.length === 0) throw new Error("Buffer is empty");
      fileSize = fileInput.length;
    } else if (typeof fileInput === "string") {
      // Check if file exists
      try {
        const stats = await fs.stat(fileInput);
        fileSize = stats.size;
      } catch (err) {
        throw new Error(`File not found at path: ${fileInput}`);
      }
    } else {
      throw new Error("Invalid input: must be a buffer or file path");
    }

    // Determine format from mimetype or original name
    let format = "bin";
    if (mimetype) {
      format = getExtensionFromMimeType(mimetype);
    } else if (originalName) {
      format = path.extname(originalName).slice(1).toLowerCase();
    }

    // Map folder to local path
    let localFolder = mapFolderToLocalPath(folder);

    // Handle specific document types
    if (folder.includes("module")) {
      // Extract course ID and module ID if present (digital-aela/courses/{courseId}/modules/{moduleId})
      const moduleMatch = folder.match(/courses\/([^\/]+)\/modules\/([^\/]+)/);
      if (moduleMatch) {
        const [, courseId, moduleId] = moduleMatch;
        localFolder = `documents/courses/${courseId}/modules/${moduleId}`;
      } else {
        localFolder = "documents/modules";
      }
    } else if (folder.includes("document")) {
      localFolder = "documents";
    } else {
      localFolder = "documents";
    }

    const fullPath = path.join(dataDir, localFolder);

    // Ensure directory exists
    await fs.mkdir(fullPath, { recursive: true });

    // Generate filename
    const filename = generateFilename(originalName, format);
    const filePath = path.join(fullPath, filename);

    // Write file to disk
    if (Buffer.isBuffer(fileInput)) {
      await fs.writeFile(filePath, fileInput);
    } else {
      // If it's a file path (from multer diskStorage), move/copy it
      await fs.copyFile(fileInput, filePath);
      // Clean up temp file
      try {
        await fs.unlink(fileInput);
      } catch (err) {
        console.warn("[FileStorage] Failed to delete temp file:", err);
      }
    }

    // Generate URL
    const url = `/static/${localFolder}/${filename}`;
    const relativePath = `${localFolder}/${filename}`;

    return {
      filePath: relativePath,
      url,
      format,
      bytes: fileSize,
      public_id: relativePath.replace(/\//g, "-"),
    };
  } catch (error) {
    console.error("[FileStorage] Error saving document:", error);
    throw error;
  }
};

/**
 * Save audio file to local storage
 */
export const saveAudioToLocal = async (
  fileInput,
  folder = "digital-aela/audio",
  originalName = null,
  mimetype = null
) => {
  try {
    let fileSize = 0;

    // Validate input (buffer or file path)
    if (Buffer.isBuffer(fileInput)) {
      if (fileInput.length === 0) throw new Error("Buffer is empty");
      fileSize = fileInput.length;
    } else if (typeof fileInput === "string") {
      // Check if file exists
      try {
        const stats = await fs.stat(fileInput);
        fileSize = stats.size;
      } catch (err) {
        throw new Error(`File not found at path: ${fileInput}`);
      }
    } else {
      throw new Error("Invalid input: must be a buffer or file path");
    }

    // Determine format from mimetype or original name
    let format = "mp3";
    if (mimetype) {
      format = getExtensionFromMimeType(mimetype);
    } else if (originalName) {
      const ext = path.extname(originalName).slice(1).toLowerCase();
      if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) {
        format = ext;
      }
    }

    // Map folder to local path
    let localFolder = mapFolderToLocalPath(folder);

    // Handle module audio files
    if (folder.includes("module")) {
      const moduleMatch = folder.match(/courses\/([^\/]+)\/modules\/([^\/]+)/);
      if (moduleMatch) {
        const [, courseId, moduleId] = moduleMatch;
        localFolder = `audio/courses/${courseId}/modules/${moduleId}`;
      } else {
        localFolder = "audio/modules";
      }
    } else if (folder.includes("audio")) {
      localFolder = "audio";
    } else {
      localFolder = "audio";
    }

    const fullPath = path.join(dataDir, localFolder);

    // Ensure directory exists
    await fs.mkdir(fullPath, { recursive: true });

    // Generate filename
    const filename = generateFilename(originalName, format);
    const filePath = path.join(fullPath, filename);

    // Write file to disk
    if (Buffer.isBuffer(fileInput)) {
      await fs.writeFile(filePath, fileInput);
    } else {
      // If it's a file path (from multer diskStorage), move/copy it
      await fs.copyFile(fileInput, filePath);
      // Clean up temp file
      try {
        await fs.unlink(fileInput);
      } catch (err) {
        console.warn("[FileStorage] Failed to delete temp file:", err);
      }
    }

    // Generate URL
    const url = `/static/${localFolder}/${filename}`;
    const relativePath = `${localFolder}/${filename}`;

    return {
      filePath: relativePath,
      url,
      format,
      bytes: fileSize,
      public_id: relativePath.replace(/\//g, "-"),
    };
  } catch (error) {
    console.error("[FileStorage] Error saving audio:", error);
    throw error;
  }
};

/**
 * Save generic file to local storage (handles multiple types)
 */
export const saveFileToLocal = async (
  fileInput,
  folder = "digital-aela/files",
  originalName = null,
  mimetype = null
) => {
  try {
    if (!mimetype) {
      throw new Error("MIME type is required");
    }

    // Route to appropriate handler based on MIME type
    if (mimetype.startsWith("image/")) {
      return await saveImageToLocal(fileInput, folder, originalName);
    } else if (mimetype.startsWith("video/")) {
      return await saveVideoToLocal(fileInput, folder, originalName);
    } else if (mimetype.startsWith("audio/")) {
      return await saveAudioToLocal(fileInput, folder, originalName, mimetype);
    } else if (
      mimetype === "application/pdf" ||
      mimetype.includes("msword") ||
      mimetype.includes("wordprocessingml") ||
      mimetype.includes("spreadsheetml") ||
      mimetype.includes("presentationml") ||
      mimetype.includes("excel") ||
      mimetype.includes("powerpoint")
    ) {
      return await saveDocumentToLocal(
        fileInput,
        folder,
        originalName,
        mimetype
      );
    } else {
      // Default to document handler for unknown types
      return await saveDocumentToLocal(
        fileInput,
        folder,
        originalName,
        mimetype
      );
    }
  } catch (error) {
    console.error("[FileStorage] Error saving file:", error);
    throw error;
  }
};

/**
 * Delete file from local storage
 */
export const deleteFileFromLocal = async (filePathOrUrl) => {
  try {
    // Handle both URL format (/static/...) and file path format
    let relativePath = filePathOrUrl;

    if (filePathOrUrl.startsWith("/static/")) {
      relativePath = filePathOrUrl.replace("/static/", "");
    } else if (filePathOrUrl.includes("static/")) {
      relativePath = filePathOrUrl.split("static/")[1];
    }

    const fullPath = path.join(dataDir, relativePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      // File doesn't exist, return success (idempotent)
      return { success: true, message: "File not found, considered deleted" };
    }

    // Delete file
    await fs.unlink(fullPath);

    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("[FileStorage] Error deleting file:", error);
    throw error;
  }
};

/**
 * Get file info (for validation)
 */
export const getFileInfo = async (filePathOrUrl) => {
  try {
    let relativePath = filePathOrUrl;

    if (filePathOrUrl.startsWith("/static/")) {
      relativePath = filePathOrUrl.replace("/static/", "");
    }

    const fullPath = path.join(dataDir, relativePath);

    const stats = await fs.stat(fullPath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
};
