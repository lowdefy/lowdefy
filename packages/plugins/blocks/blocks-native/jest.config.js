/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// The blocks run under React Native's own Jest preset, as @lowdefy/client-native's tests do:
// babel-jest with the React Native Babel preset, React Native's module mocks and a node
// environment. The workspace packages they import resolve to their dist folders outside
// node_modules, so babel-jest compiles them too.
//
// @expo/ui draws SwiftUI and Jetpack Compose views through native modules Jest does not have,
// so its pickers, switch, icon, date picker, menu, segmented control, bottom sheet and context
// menu are replaced by small React Native stand-ins (src/test/expoUi*.js) that keep their props,
// expo-image's Image by one too (src/test/expoImage.js), expo-web-browser's in-app browser by a
// mock (src/test/expoWebBrowser.js), and expo-speech-recognition's recogniser by a stand-in tests
// drive (src/test/expoSpeechRecognition.js).
export default {
  preset: '@react-native/jest-preset',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/'],
  coverageReporters: [['lcov', { projectRoot: '../../../..' }], 'text', 'clover'],
  errorOnDeprecated: true,
  moduleNameMapper: {
    '^@expo/ui$': '<rootDir>/src/test/expoUi.js',
    '^@expo/ui/community/bottom-sheet$': '<rootDir>/src/test/expoUiBottomSheet.js',
    '^@expo/ui/community/datetime-picker$': '<rootDir>/src/test/expoUiDateTimePicker.js',
    '^@expo/ui/community/menu$': '<rootDir>/src/test/expoUiMenu.js',
    '^@expo/ui/community/segmented-control$': '<rootDir>/src/test/expoUiSegmentedControl.js',
    '^@expo/ui/swift-ui$': '<rootDir>/src/test/expoUiSwiftUi.js',
    '^expo-image$': '<rootDir>/src/test/expoImage.js',
    '^expo-speech-recognition$': '<rootDir>/src/test/expoSpeechRecognition.js',
    '^expo-web-browser$': '<rootDir>/src/test/expoWebBrowser.js',
  },
  setupFiles: ['<rootDir>/src/test/removeWindow.js'],
  // The preset's pattern assumes a flat node_modules; pnpm nests each package under .pnpm.
  // react-native-marked ships TypeScript source and its parser, marked, ships ES modules.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|react-native-svg|react-native-marked|react-native-reanimated-table|marked|@jsamr|github-slugger|change-case|intl-messageformat|@formatjs)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/test/'],
};
