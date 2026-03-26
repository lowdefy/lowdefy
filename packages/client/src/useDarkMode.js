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
import { theme as antdTheme } from 'antd';

const algorithmMap = {
  default: antdTheme.defaultAlgorithm,
  dark: antdTheme.darkAlgorithm,
  compact: antdTheme.compactAlgorithm,
};

function resolveAlgorithm(algorithm) {
  if (Array.isArray(algorithm)) {
    return algorithm.map((a) => algorithmMap[a] || antdTheme.defaultAlgorithm);
  }
  return algorithmMap[algorithm] || antdTheme.defaultAlgorithm;
}

function stripDarkFromAlgorithm(algorithm) {
  if (Array.isArray(algorithm)) {
    const filtered = algorithm.filter((a) => a !== 'dark');
    return filtered.length > 0 ? filtered : 'default';
  }
  if (algorithm === 'dark') return 'default';
  return algorithm;
}

function mergeAlgorithm(baseAlgorithm, isDark) {
  if (!isDark) return baseAlgorithm;
  const base = Array.isArray(baseAlgorithm) ? baseAlgorithm : baseAlgorithm ? [baseAlgorithm] : [];
  return [...base, 'dark'];
}

function resolveIsDark({ configDarkMode, userPreference, systemIsDark }) {
  if (configDarkMode === 'dark') return true;
  if (configDarkMode === 'light') return false;
  // configDarkMode is 'system' or undefined — user preference decides
  if (userPreference === 'dark') return true;
  if (userPreference === 'light') return false;
  // userPreference is 'system' — follow OS
  return systemIsDark;
}

function useDarkMode({ baseAlgorithm, configDarkMode }) {
  const cleanAlgorithm = stripDarkFromAlgorithm(baseAlgorithm);

  const [userPreference, setUserPreference] = useState(() => {
    return window.localStorage?.getItem('lowdefy_darkMode') ?? 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  });

  // Listen for OS theme changes
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

  window.__lowdefy_setDarkMode = setPreference;

  const isDark = resolveIsDark({ configDarkMode, userPreference, systemIsDark });
  return resolveAlgorithm(mergeAlgorithm(cleanAlgorithm, isDark));
}

export default useDarkMode;
