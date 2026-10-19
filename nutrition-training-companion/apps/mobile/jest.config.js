/* Unit tests for the lead-owned code (services, store, shared domain). */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@kingstinct/.*|react-native-nitro-modules|@react-native-healthkit/.*|react-native-svg|zustand))'
  ]
};
