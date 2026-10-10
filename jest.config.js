/**
 * Jest settings for the unit tests in __tests__/.
 *
 * Two of our libraries are shipped as modern "ES modules"
 * (@noble/hashes and AsyncStorage v3). Jest must translate them before it
 * can run them, so we add them to the list of node_modules that are NOT
 * ignored by the translator (Babel).
 *
 * Libraries with native (phone) code - AsyncStorage, react-native-svg and
 * react-native-nitro-sound - are replaced by the small stand-ins in
 * __mocks__/ during tests.
 */
module.exports = {
  preset: '@react-native/jest-preset',
  // The server has its own tests (cd server && npm test).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/server/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@noble|react-native-svg|react-native-nitro-sound|react-native-nitro-modules)/)',
  ],
};
