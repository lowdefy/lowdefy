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

import template from './template.js';

const assets = {
  js: 'assets/main.js',
  css: ['assets/main.css'],
  imports: ['assets/react.js'],
};

test('template preloads the page types chunks and links their stylesheets', () => {
  const html = template({
    assets,
    basePath: '/app',
    config: { pageConfig: {} },
    pageAssets: {
      js: ['assets/aaaa.js', 'assets/antd.js'],
      css: ['assets/antd.css'],
      prefetch: [],
    },
  });
  expect(html).toContain('<link rel="stylesheet" href="/app/assets/main.css" />');
  expect(html).toContain('<link rel="stylesheet" href="/app/assets/antd.css" />');
  expect(html).toContain('<link rel="modulepreload" href="/app/assets/react.js" />');
  expect(html).toContain('<link rel="modulepreload" href="/app/assets/aaaa.js" />');
  expect(html).toContain('<link rel="modulepreload" href="/app/assets/antd.js" />');
  expect(html).toContain('<script type="module" src="/app/assets/main.js"></script>');
});

test('template prefetches the page lazy block chunks after its preloads', () => {
  const html = template({
    assets,
    basePath: '/app',
    config: { pageConfig: {} },
    pageAssets: {
      js: ['assets/aaaa.js'],
      css: [],
      prefetch: ['assets/AgentChat.lazy.js', 'assets/AgentChat.css'],
    },
  });
  expect(html).toContain(
    '<link rel="prefetch" href="/app/assets/AgentChat.lazy.js" crossorigin />'
  );
  expect(html).toContain('<link rel="prefetch" href="/app/assets/AgentChat.css" crossorigin />');
  expect(html).not.toContain('<link rel="modulepreload" href="/app/assets/AgentChat.lazy.js" />');
  expect(html.indexOf('rel="prefetch"')).toBeGreaterThan(
    html.indexOf('<link rel="modulepreload" href="/app/assets/aaaa.js" />')
  );
});

test('template writes no prefetch links for a page without lazy blocks', () => {
  const html = template({
    assets,
    config: { pageConfig: {} },
    pageAssets: { js: ['assets/aaaa.js'], css: [], prefetch: [] },
  });
  expect(html).not.toContain('rel="prefetch"');
});
