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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, StatusBar, useColorScheme } from 'react-native';

import getSemanticTokens from './getSemanticTokens.js';
import readDarkModePreference from './readDarkModePreference.js';
import resolveColorSchemeOverride from './resolveColorSchemeOverride.js';
import resolveIsDark from './resolveIsDark.js';
import ThemeContext from './ThemeContext.js';

/**
 * Gives native blocks the tokens of the theme mode showing (antd's computed tokens with the iOS
 * semantic colours, see getSemanticTokens), and keeps the mode the way the web client does: `theme.darkMode` ('system', 'light' or 'dark'), the person's
 * preference that the SetDarkMode action sets and the store keeps, and the device's colour
 * scheme. It sets the host window members the engine reads for SetDarkMode and
 * `_media: darkMode`.
 *
 * The app window takes the mode too, so the navigation bar, tab bar, status bar and SwiftUI
 * controls match the page when config or the person fixes a mode the device does not show.
 *
 * A shell wraps its pages in one, so every page shows the same mode; a LowdefyPage outside one
 * makes its own.
 *
 * @param {Object} props
 * @param {Object} props.host The @lowdefy/client-core host (its storage and globals).
 * @param {string} props.storageKey The app's key for the preference
 *   (appStorageKey 'lowdefy_darkMode').
 * @param {{ darkMode: string, light: Object, dark: Object }} props.theme The mobile theme the
 *   server sends: antd's computed tokens for each mode.
 */
const ThemeProvider = ({ children, host, storageKey, theme }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState(() =>
    readDarkModePreference({ storage: host.storage, storageKey })
  );
  const setPreference = useCallback(
    (next) => {
      try {
        host.storage.set(storageKey, next);
      } catch {
        // The preference still applies for this session when the platform blocks storage.
      }
      // Set now, not on the next render: SetDarkMode updates the engine straight after, and
      // _media: darkModePreference reads it then.
      host.globals.window.__lowdefy_darkModePreference = next;
      setPreferenceState(next);
    },
    [host, storageKey]
  );
  const isDark = resolveIsDark({
    configDarkMode: theme.darkMode,
    preference,
    systemIsDark: systemScheme === 'dark',
  });
  const { window } = host.globals;
  window.__lowdefy_setDarkMode = setPreference;
  window.__lowdefy_darkModePreference = preference;
  window.__lowdefy_isDark = isDark;
  const colorSchemeOverride = resolveColorSchemeOverride({
    configDarkMode: theme.darkMode,
    preference,
  });
  useEffect(() => {
    Appearance.setColorScheme(colorSchemeOverride);
  }, [colorSchemeOverride]);
  const value = useMemo(
    () => ({
      isDark,
      preference,
      tokens: getSemanticTokens({ isDark, tokens: isDark ? theme.dark : theme.light }),
    }),
    [isDark, preference, theme]
  );
  return (
    <ThemeContext.Provider value={value}>
      <StatusBar animated barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
