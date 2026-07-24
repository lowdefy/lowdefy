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
// any renderer pulled in React or antd this import would fail to load.
import * as staticRenderers from './index.js';

const STATIC_DIR = path.join(process.cwd(), 'src', 'static');

test('the static entry exports a toReport renderer for each supported block type', () => {
  const types = [
    'Title',
    'Paragraph',
    'Statistic',
    'Divider',
    'Descriptions',
    'Card',
    'Content',
    'Alert',
    'Tabs',
    'Collapse',
  ];
  types.forEach((type) => {
    expect(typeof staticRenderers[type]?.toReport).toBe('function');
  });
});

test('no renderer file imports React, antd, or a block component', () => {
  const files = fs
    .readdirSync(STATIC_DIR)
    .filter((name) => name.endsWith('.js') && !name.endsWith('.test.js'));
  const forbidden = [
    /from\s+['"]react['"]/,
    /from\s+['"]react-dom['"]/,
    /from\s+['"]antd['"]/,
    /from\s+['"][./]*\/blocks\//,
  ];
  files.forEach((name) => {
    const source = fs.readFileSync(path.join(STATIC_DIR, name), 'utf8');
    forbidden.forEach((pattern) => {
      expect(source).not.toMatch(pattern);
    });
  });
});

test('package.json declares the ./static export', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  expect(pkg.exports['./static']).toBe('./dist/static/index.js');
});
