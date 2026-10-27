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

import fs from 'fs';
import { createRequire } from 'module';
import { compile } from 'tailwindcss';

const require = createRequire(import.meta.url);

// Whether a token is a Tailwind class at all, decided by Tailwind 4 itself
// with the app's theme, as the web compiles it: a token Tailwind writes CSS
// for is a class. The mobile build fails on such a class when it has no
// native form, and skips every other token (prose, state keys), which gets no
// CSS on the web either.
async function createTailwindClassCheck({ themeVars }) {
  const themePath = require.resolve('tailwindcss/theme.css');
  const css = [
    '@import "tailwindcss/theme.css";',
    '@theme inline {',
    ...themeVars.map(([name, value]) => `  ${name}: ${value};`),
    '}',
    '@tailwind utilities;',
  ].join('\n');
  const compiler = await compile(css, {
    base: '/',
    loadStylesheet: async (id, base) => ({
      path: themePath,
      base,
      content: fs.readFileSync(themePath, 'utf8'),
    }),
  });
  let output = compiler.build([]);
  const results = new Map();
  return function isTailwindClass(token) {
    if (!results.has(token)) {
      // build() is incremental: the output grows only when the token is a class.
      const next = compiler.build([token]);
      results.set(token, next.length !== output.length);
      output = next;
    }
    return results.get(token);
  };
}

export default createTailwindClassCheck;
