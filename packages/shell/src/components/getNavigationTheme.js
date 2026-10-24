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

/**
 * The React Navigation theme the shell's navigators draw with, from the app's theme tokens: the
 * header and back button take the tint, screens the grouped background, and titles the label
 * colour. On iOS 26 the header and tab bar are the system's glass bars, which take their mode from
 * the window (ThemeProvider sets it) and their tint from here.
 *
 * @param {Object} params
 * @param {Object} params.base React Navigation's DefaultTheme or DarkTheme, for its fonts.
 * @param {boolean} params.isDark
 * @param {Object} params.tokens The theme tokens of the mode showing.
 * @returns {{ dark: boolean, colors: Object, fonts: Object }}
 */
function getNavigationTheme({ base, isDark, tokens }) {
  return {
    ...base,
    dark: isDark,
    colors: {
      primary: tokens.colorTint,
      background: tokens.colorGroupedBackground,
      card: tokens.colorGroupedBackground,
      text: tokens.colorLabel,
      border: tokens.colorSeparator,
      notification: tokens.colorError,
    },
  };
}

export default getNavigationTheme;
