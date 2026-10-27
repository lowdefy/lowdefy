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

import { createRequire } from 'module';
import { type } from '@lowdefy/helpers';

const require = createRequire(import.meta.url);

function toAlgorithmList(algorithm) {
  if (type.isNone(algorithm)) {
    return [];
  }
  return type.isArray(algorithm) ? algorithm : [algorithm];
}

// Algorithm names as the web client (useDarkMode) resolves them.
function resolveAlgorithm({ antdTheme, names }) {
  const algorithms = {
    default: antdTheme.defaultAlgorithm,
    dark: antdTheme.darkAlgorithm,
    compact: antdTheme.compactAlgorithm,
  };
  if (names.length === 0) {
    return antdTheme.defaultAlgorithm;
  }
  return names.map((name) => algorithms[name] ?? antdTheme.defaultAlgorithm);
}

function mergeComponents(shared, mode) {
  const names = new Set([...Object.keys(shared ?? {}), ...Object.keys(mode ?? {})]);
  return Object.fromEntries(
    [...names].map((name) => [name, { ...(shared?.[name] ?? {}), ...(mode?.[name] ?? {}) }])
  );
}

// One mode's computed antd tokens, configured the way the web client's
// useDarkMode configures antd: the shared token with the mode's token over it,
// and the app's algorithm with "dark" taken out for light and added for dark.
function getModeTokens({ antdTheme, antd, mode }) {
  const baseNames = toAlgorithmList(antd.algorithm).filter((name) => name !== 'dark');
  const names = mode === 'dark' ? [...baseNames, 'dark'] : baseNames;
  return antdTheme.getDesignToken({
    token: { ...(antd.token ?? {}), ...(antd[`${mode}Token`] ?? {}) },
    components: mergeComponents(antd.components, antd[`${mode}Components`]),
    algorithm: resolveAlgorithm({ antdTheme, names }),
  });
}

// The computed antd tokens for light and dark mode, which native blocks read
// in place of antd's CSS-in-JS, so colours match the web in both modes. Kept on
// the context for the class map and written to mobile/theme.json.
function buildMobileTheme({ components, context }) {
  context.mobileTheme = {};
  if (type.isNone(components.mobile)) {
    return components;
  }
  const antdTheme = require('antd/lib/theme').default;
  const antd = components.theme?.antd ?? {};
  context.mobileTheme = {
    darkMode: components.theme?.darkMode ?? 'system',
    light: getModeTokens({ antdTheme, antd, mode: 'light' }),
    dark: getModeTokens({ antdTheme, antd, mode: 'dark' }),
  };
  return components;
}

export default buildMobileTheme;
