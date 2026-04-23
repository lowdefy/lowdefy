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

import { useCallback, useEffect, useMemo, useState } from 'react';
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

function mergeComponents(shared, mode) {
  if (!shared && !mode) return undefined;
  const keys = new Set([...Object.keys(shared ?? {}), ...Object.keys(mode ?? {})]);
  const merged = {};
  keys.forEach((name) => {
    merged[name] = { ...((shared ?? {})[name] ?? {}), ...((mode ?? {})[name] ?? {}) };
  });
  return merged;
}

function useDarkMode({ antd, configDarkMode }) {
  const baseAlgorithm = antd?.algorithm;
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
  window.__lowdefy_isDark = isDark;

  const sharedToken = antd?.token;
  const lightToken = antd?.lightToken;
  const darkToken = antd?.darkToken;
  const sharedComponents = antd?.components;
  const lightComponents = antd?.lightComponents;
  const darkComponents = antd?.darkComponents;

  const token = useMemo(() => {
    const modeToken = isDark ? darkToken : lightToken;
    if (!sharedToken && !modeToken) return undefined;
    return { ...(sharedToken ?? {}), ...(modeToken ?? {}) };
  }, [isDark, sharedToken, lightToken, darkToken]);

  const components = useMemo(
    () => mergeComponents(sharedComponents, isDark ? darkComponents : lightComponents),
    [isDark, sharedComponents, lightComponents, darkComponents]
  );

  // Keep the <html> background in sync with the resolved mode. The _document.js
  // inline script sets an initial background before hydration; this effect takes
  // over once React is active and updates on every dark/light toggle.
  const darkBg = darkToken?.colorBgLayout;
  const lightBg = lightToken?.colorBgLayout;
  useEffect(() => {
    if (isDark) {
      document.documentElement.style.backgroundColor = darkBg ?? '#000';
    } else if (lightBg) {
      document.documentElement.style.backgroundColor = lightBg;
    } else {
      document.documentElement.style.removeProperty('background-color');
    }
  }, [isDark, darkBg, lightBg]);

  return {
    algorithm: resolveAlgorithm(mergeAlgorithm(cleanAlgorithm, isDark)),
    token,
    components,
  };
}

export default useDarkMode;
