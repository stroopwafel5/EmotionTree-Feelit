/**
 * A pretend AsyncStorage for the Jest tests.
 *
 * Jest automatically uses this file instead of the real library (which
 * needs a phone). It keeps everything in memory, and supports both the v3
 * `createAsyncStorage(name)` API and the old default export.
 */
function createAsyncStorage() {
  const data = new Map();
  return {
    getItem: async key => (data.has(key) ? data.get(key) : null),
    setItem: async (key, value) => {
      data.set(key, String(value));
    },
    removeItem: async key => {
      data.delete(key);
    },
    getAllKeys: async () => [...data.keys()],
    clear: async () => {
      data.clear();
    },
  };
}

module.exports = {
  __esModule: true,
  createAsyncStorage,
  default: createAsyncStorage(),
};
