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

import oklchToHex from './oklchToHex.js';

const require = createRequire(import.meta.url);

// The colours and radii of Tailwind 4's default theme, the version the web
// client compiles with. twrnc ships Tailwind 3's values, which differ (Tailwind
// 4 moved its palette to oklch and changed the radius scale), so the mobile
// class map takes these from Tailwind 4's own theme.css to match the web.
function loadTailwindDefaultTheme() {
  const themeCss = fs.readFileSync(require.resolve('tailwindcss/theme.css'), 'utf8');
  const colors = {};
  const borderRadius = {};
  for (const match of themeCss.matchAll(/^\s*--(color|radius)-([\w.-]+):\s*([^;]+);/gm)) {
    const [, namespace, name, value] = match;
    if (namespace === 'color') {
      colors[name] = oklchToHex(value);
    } else {
      borderRadius[name] = value.trim();
    }
  }
  return { colors, borderRadius };
}

export default loadTailwindDefaultTheme;
