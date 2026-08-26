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

import { useCallback, useEffect, useState } from 'react';

// Same resolve order as @lowdefy/client's useDarkMode (config > stored user
// preference > OS), without the antd algorithm — antd-mobile switches theme
// via the data-prefers-color-scheme attribute on <html>.
function resolveIsDark({ configDarkMode, userPreference, systemIsDark }) {
  if (configDarkMode === 'dark') return true;
  if (configDarkMode === 'light') return false;
  if (userPreference === 'dark') return true;
  if (userPreference === 'light') return false;
  return systemIsDark;
}

function useMobileDarkMode({ configDarkMode }) {
  const [userPreference, setUserPreference] = useState(() => {
    return window.localStorage?.getItem('lowdefy_darkMode') ?? 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  });

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql?.addEventListener) return;
    const handler = (e) => setSystemIsDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const setPreference = useCallback((newPref) => {
    window.localStorage?.setItem('lowdefy_darkMode', newPref);
    setUserPreference(newPref);
  }, []);

  // Same window contract as the web client, so the SetDarkMode action works.
  window.__lowdefy_setDarkMode = setPreference;

  const isDark = resolveIsDark({ configDarkMode, userPreference, systemIsDark });
  window.__lowdefy_isDark = isDark;

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-prefers-color-scheme',
      isDark ? 'dark' : 'light'
    );
  }, [isDark]);

  return { isDark };
}

export default useMobileDarkMode;
