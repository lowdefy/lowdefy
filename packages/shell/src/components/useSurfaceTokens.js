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

import { useContext } from 'react';
import { useColorScheme } from 'react-native';
import { iosColors, ThemeContext } from '@lowdefy/client-native';

// The iOS default tint, for the screens shown before the app's theme is known.
const SYSTEM_TINT = '#007AFF';

/**
 * The colours the shell's own screens (loading, messages, sign in, lock) draw with: the app's
 * theme tokens inside its ThemeProvider. A shell opens, signs in and locks before the app's root
 * config, and so its theme, has arrived; those screens take the device's mode in the iOS
 * semantic colours and tint.
 *
 * @returns {Object} Tokens with colorGroupedBackground, colorCell, colorLabel,
 *   colorSecondaryLabel, colorSeparator, colorTint and colorError.
 */
function useSurfaceTokens() {
  const theme = useContext(ThemeContext);
  const systemScheme = useColorScheme();
  if (theme !== null) {
    return theme.tokens;
  }
  const isDark = systemScheme === 'dark';
  return {
    ...iosColors[isDark ? 'dark' : 'light'],
    colorError: isDark ? '#FF453A' : '#FF3B30',
    colorTint: SYSTEM_TINT,
  };
}

export default useSurfaceTokens;
