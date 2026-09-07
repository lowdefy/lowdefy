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
import path from 'path';

// Importing the entry proves it resolves in Node without a browser runtime; if
// any renderer pulled in React or antd this import would fail.
import * as staticRenderers from './static.js';
import * as metas from './metas.js';

const SRC_DIR = path.join(process.cwd(), 'src');

// Every co-located `*.static.js` renderer file (excludes the aggregator and any test).
function staticRendererFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...staticRendererFiles(full));
    } else if (entry.name.endsWith('.static.js') && !entry.name.endsWith('.static.test.js')) {
      found.push(full);
    }
  }
  return found;
}

const staticTypes = Object.keys(metas).filter((name) => metas[name].static === true);

test('every meta declaring static: true has a toReport renderer on the static entry', () => {
  expect(staticTypes.length).toBeGreaterThan(0);
  staticTypes.forEach((type) => {
    expect(typeof staticRenderers[type]?.toReport).toBe('function');
  });
});

test('every static entry export has a meta declaring static: true', () => {
  Object.keys(staticRenderers).forEach((type) => {
    expect(metas[type]?.static).toBe(true);
  });
});

test('no renderer file imports React, antd, or a block component', () => {
  const forbidden = [
    /from\s+['"]react['"]/,
    /from\s+['"]react-dom['"]/,
    /from\s+['"]antd['"]/,
    /from\s+['"]@lowdefy\/block-utils['"]/,
    /from\s+['"]\.\/[A-Z][^'"]*\.js['"]/,
  ];
  staticRendererFiles(SRC_DIR).forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    forbidden.forEach((pattern) => {
      expect(source).not.toMatch(pattern);
    });
  });
});

test('package.json declares the ./static export', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  expect(pkg.exports['./static']).toBe('./dist/static.js');
});
