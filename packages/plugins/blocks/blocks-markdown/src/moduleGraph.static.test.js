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
// any renderer pulled in React this import would fail.
import * as staticRenderers from './static.js';

const SRC_DIR = path.join(process.cwd(), 'src');

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

test('the static entry exports a toReport renderer for each supported block type', () => {
  ['Markdown', 'MarkdownWithCode', 'DangerousMarkdown'].forEach((type) => {
    expect(typeof staticRenderers[type]?.toReport).toBe('function');
  });
});

test('no renderer file imports React or a block component', () => {
  const forbidden = [
    /from\s+['"]react['"]/,
    /from\s+['"]react-dom['"]/,
    /from\s+['"]react-markdown['"]/,
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
