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

import oklchToHex from './oklchToHex.js';
import resolveAntdVar from './resolveAntdVar.js';

const require = createRequire(import.meta.url);
// twrnc's ES build uses extensionless imports Node cannot load, so the
// CommonJS entry is required. Only the parser is used; nothing of twrnc ships
// in the shell.
const { create } = require('twrnc/create');

// Tailwind 4 theme namespaces and the Tailwind 3 theme keys twrnc reads.
// Tailwind 4 only reads these namespaces for utilities, so a variable outside
// them (font-size-*, font-family-* in the bridge) does nothing here either.
const namespaces = [
  ['--color-', 'colors'],
  ['--radius-', 'borderRadius'],
  ['--spacing-', 'spacing'],
  ['--text-', 'fontSize'],
  ['--font-weight-', 'fontWeight'],
  ['--tracking-', 'letterSpacing'],
  ['--leading-', 'lineHeight'],
];

function getNamespace(varName) {
  return namespaces.find(([prefix]) => varName.startsWith(prefix));
}

function mapThemeVars({ themeVars, tokenVars }) {
  const theme = {};
  themeVars.forEach(([varName, rawValue]) => {
    const namespace = getNamespace(varName);
    if (!namespace) return;
    const [prefix, themeKey] = namespace;
    const name = varName.slice(prefix.length);
    // Tailwind 4 has no DEFAULT keys (rounded is always 0.25rem), and
    // --text-sm--line-height style modifiers are not sizes.
    if (name === 'DEFAULT' || name.includes('--')) return;
    const value = resolveAntdVar({ value: rawValue, tokenVars });
    if (value === undefined || value === null) return;
    theme[themeKey] = theme[themeKey] ?? {};
    theme[themeKey][name] = themeKey === 'colors' ? oklchToHex(value) : value;
  });
  return theme;
}

// A twrnc instance for one colour mode: Tailwind 3's defaults from twrnc, the
// colours and radii of Tailwind 4's default theme, and the app's Tailwind
// theme (the antd bridge and theme.tailwind) with antd variables resolved to
// this mode's computed tokens.
function createNativeTailwind({ themeVars, tokenVars, defaultTheme }) {
  const appTheme = mapThemeVars({ themeVars, tokenVars });
  const { colors: appColors, borderRadius: appRadius, ...extend } = appTheme;
  return create(
    {
      theme: {
        colors: { transparent: 'transparent', ...defaultTheme.colors, ...appColors },
        borderRadius: {
          none: '0px',
          DEFAULT: '0.25rem',
          ...defaultTheme.borderRadius,
          full: '9999px',
          ...appRadius,
        },
        extend,
      },
    },
    'ios'
  );
}

export default createNativeTailwind;
