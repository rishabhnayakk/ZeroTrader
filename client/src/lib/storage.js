/**
 * LocalStorage management helper for ZeroTrader
 * Automatically handles JSON parsing/serialization and key prefixing.
 */
const PREFIX = 'zerotrader_';

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.warn(`[storage] Failed to get ${key}:`, err);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[storage] Failed to set ${key}:`, err);
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (err) {
      console.warn(`[storage] Failed to remove ${key}:`, err);
    }
  },

  clearAppStorage: () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.warn('[storage] Failed to clear app storage:', err);
    }
  },
};

export default storage;
