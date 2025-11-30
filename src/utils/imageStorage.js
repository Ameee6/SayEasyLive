// IndexedDB utilities for storing images in browser storage
// Provides persistent image storage without backend

const DB_NAME = 'sayeasy_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db = null;

/**
 * Initialize IndexedDB connection
 * @returns {Promise<IDBDatabase>} Database instance
 */
export const initImageDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save image to IndexedDB
 * @param {string} id - Unique identifier for the image (e.g., 'main-top', 'main-bottom', 'card-1')
 * @param {string} dataUrl - Base64 data URL of the image
 * @returns {Promise<boolean>} Success status
 */
export const saveImage = async (id, dataUrl) => {
  try {
    const database = await initImageDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, dataUrl, timestamp: Date.now() });

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('Failed to save image:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error saving image:', error);
    return false;
  }
};

/**
 * Load image from IndexedDB
 * @param {string} id - Unique identifier for the image
 * @returns {Promise<string|null>} Base64 data URL or null if not found
 */
export const loadImage = async (id) => {
  try {
    const database = await initImageDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result ? request.result.dataUrl : null);
      };
      request.onerror = () => {
        console.error('Failed to load image:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

/**
 * Load all images from IndexedDB
 * @returns {Promise<Object>} Object mapping id to dataUrl
 */
export const loadAllImages = async () => {
  try {
    const database = await initImageDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = {};
        request.result.forEach((item) => {
          images[item.id] = item.dataUrl;
        });
        resolve(images);
      };
      request.onerror = () => {
        console.error('Failed to load all images:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error loading all images:', error);
    return {};
  }
};

/**
 * Delete image from IndexedDB
 * @param {string} id - Unique identifier for the image
 * @returns {Promise<boolean>} Success status
 */
export const deleteImage = async (id) => {
  try {
    const database = await initImageDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('Failed to delete image:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Clear all images from IndexedDB
 * @returns {Promise<boolean>} Success status
 */
export const clearAllImages = async () => {
  try {
    const database = await initImageDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('Failed to clear images:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error clearing images:', error);
    return false;
  }
};

/**
 * Convert File to base64 data URL
 * @param {File} file - File object from input
 * @returns {Promise<string>} Base64 data URL
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Resize image to optimize storage
 * @param {string} dataUrl - Original image data URL
 * @param {number} maxWidth - Maximum width (default 400px for buttons)
 * @param {number} maxHeight - Maximum height (default 400px for buttons)
 * @returns {Promise<string>} Resized image data URL
 */
export const resizeImage = (dataUrl, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG for smaller file size (quality 0.85)
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl); // Return original on error
    img.src = dataUrl;
  });
};
