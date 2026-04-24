module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-safe-area-context|@react-native-async-storage/async-storage|react-native-vector-icons|@react-native-picker/picker|@react-native-community/datetimepicker)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/backend/', '<rootDir>/node_modules/'],
  fakeTimers: {
    enableGlobally: true,
  },
};
