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

import React from 'react';
import { ThemeProvider } from '@lowdefy/client-native';
import { appStorageKey } from '@lowdefy/helpers';

import { useSessionState, useShell } from '../ShellContext.js';

// One theme for every screen of the app, so all its pages show the same mode: the mobile root's
// theme, and the dark mode preference SetDarkMode keeps under the app's key, as on the web.
function ShellThemeProvider({ children }) {
  const { host } = useShell();
  const { rootConfig } = useSessionState();
  return (
    <ThemeProvider
      host={host}
      storageKey={appStorageKey({
        basePath: '',
        name: 'lowdefy_darkMode',
        slug: rootConfig.lowdefyApp.slug,
      })}
      theme={rootConfig.theme}
    >
      {children}
    </ThemeProvider>
  );
}

export default ShellThemeProvider;
