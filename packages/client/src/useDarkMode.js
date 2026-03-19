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

import { useState } from 'react';
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

function mergeAlgorithm(baseAlgorithm, darkMode) {
  if (!darkMode) return baseAlgorithm;
  const base = Array.isArray(baseAlgorithm) ? baseAlgorithm : baseAlgorithm ? [baseAlgorithm] : [];
  if (base.includes('dark')) return base;
  return [...base, 'dark'];
}

function useDarkMode(baseAlgorithm) {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = window.localStorage?.getItem('lowdefy_darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  });
  window.__lowdefy_setDarkMode = setDarkMode;

  return resolveAlgorithm(mergeAlgorithm(baseAlgorithm, darkMode));
}

export default useDarkMode;
