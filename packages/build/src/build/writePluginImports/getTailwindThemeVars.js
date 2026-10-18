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

import { mergeObjects } from '@lowdefy/helpers';

import tailwindBridgeDefaults from './tailwindBridgeDefaults.js';

function collectThemeVars(obj, prefix, vars) {
  for (const [key, value] of Object.entries(obj)) {
    const varName = prefix ? `${prefix}-${key}` : `--${key}`;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      collectThemeVars(value, varName, vars);
    } else {
      vars.push([varName, value]);
    }
  }
  return vars;
}

// The app's Tailwind theme variables as [name, value] pairs, in order: the
// antd bridge merged with theme.tailwind, nested keys joined with "-"
// ({ color: { brand: '#f00' } } gives ['--color-brand', '#f00']).
function getTailwindThemeVars({ tailwindConfig }) {
  const merged = mergeObjects([tailwindBridgeDefaults, tailwindConfig ?? {}]);
  return collectThemeVars(merged, undefined, []);
}

export default getTailwindThemeVars;
