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

import createDevServerExclude from './createDevServerExclude.js';

function isExcluded(exclude, url) {
  return exclude.some((pattern) => pattern.test(url));
}

test('createDevServerExclude leaves Vite module paths to Vite when there is no basePath', () => {
  const exclude = createDevServerExclude({ basePath: '' });

  expect(isExcluded(exclude, '/@vite/client')).toBe(true);
  expect(isExcluded(exclude, '/@react-refresh')).toBe(true);
  expect(isExcluded(exclude, '/client/main.jsx')).toBe(true);
  expect(isExcluded(exclude, '/build/plugins/blocks.js')).toBe(true);
  expect(isExcluded(exclude, '/lib/client/ErrorBar.jsx')).toBe(true);
  expect(isExcluded(exclude, '/node_modules/.vite/deps/react.js?v=1')).toBe(true);
  expect(isExcluded(exclude, '/client/App.jsx?t=1712345678')).toBe(true);
  expect(isExcluded(exclude, '/favicon.ico')).toBe(true);
});

test('createDevServerExclude routes page, api and docs paths to Hono when there is no basePath', () => {
  const exclude = createDevServerExclude({ basePath: '' });

  expect(isExcluded(exclude, '/')).toBe(false);
  expect(isExcluded(exclude, '/home')).toBe(false);
  expect(isExcluded(exclude, '/api/ping')).toBe(false);
  expect(isExcluded(exclude, '/lowdefy-docs/mcp')).toBe(false);
});

test('createDevServerExclude leaves Vite module paths under the basePath to Vite', () => {
  const exclude = createDevServerExclude({ basePath: '/app' });

  expect(isExcluded(exclude, '/app/@vite/client')).toBe(true);
  expect(isExcluded(exclude, '/app/@react-refresh')).toBe(true);
  expect(isExcluded(exclude, '/app/@fs/Users/dev/app/plugin.js')).toBe(true);
  expect(isExcluded(exclude, '/app/client/main.jsx')).toBe(true);
  expect(isExcluded(exclude, '/app/build/plugins/blocks.js')).toBe(true);
  expect(isExcluded(exclude, '/app/lib/client/ErrorBar.jsx')).toBe(true);
  expect(isExcluded(exclude, '/app/node_modules/.vite/deps/react.js?v=1')).toBe(true);
});

test('createDevServerExclude routes page, api and docs paths under the basePath to Hono', () => {
  const exclude = createDevServerExclude({ basePath: '/app' });

  expect(isExcluded(exclude, '/app')).toBe(false);
  expect(isExcluded(exclude, '/app/home')).toBe(false);
  expect(isExcluded(exclude, '/app/client-list')).toBe(false);
  expect(isExcluded(exclude, '/app/api/ping')).toBe(false);
  expect(isExcluded(exclude, '/app/lowdefy-docs/mcp')).toBe(false);
});

test('createDevServerExclude does not hand unprefixed module paths to Vite under a basePath', () => {
  const exclude = createDevServerExclude({ basePath: '/app' });

  expect(isExcluded(exclude, '/@vite/client')).toBe(false);
  expect(isExcluded(exclude, '/client/main.jsx')).toBe(false);
});

test('createDevServerExclude matches a basePath containing regular expression characters literally', () => {
  const exclude = createDevServerExclude({ basePath: '/my.app' });

  expect(isExcluded(exclude, '/my.app/@vite/client')).toBe(true);
  expect(isExcluded(exclude, '/myxapp/@vite/client')).toBe(false);
});
