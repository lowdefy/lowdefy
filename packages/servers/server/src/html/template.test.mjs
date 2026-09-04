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
  js: 'assets/main-aaa.js',
  css: ['assets/main-aaa.css'],
  imports: ['assets/vendor-bbb.js'],
  pages: {
    home: ['assets/home-eee.js', 'assets/antd-ddd.js'],
  },
};

function render({ basePath, pageId } = {}) {
  return template({ assets, basePath, config: { pageId }, pageId, title: 'Home' });
}

test('template preloads the entry chunks', () => {
  expect(render({ pageId: 'home' })).toContain(
    '<link rel="modulepreload" href="/assets/vendor-bbb.js" />'
  );
});

test('template preloads the page module chunk and the chunks it imports', () => {
  const html = render({ pageId: 'home' });
  expect(html).toContain('<link rel="modulepreload" href="/assets/home-eee.js" />');
  expect(html).toContain('<link rel="modulepreload" href="/assets/antd-ddd.js" />');
});

test('template preloads the page module chunk under the basePath', () => {
  expect(render({ basePath: '/app', pageId: 'home' })).toContain(
    '<link rel="modulepreload" href="/app/assets/home-eee.js" />'
  );
});

test('template preloads nothing extra for a page with no module of its own', () => {
  const html = render({ pageId: '404' });
  expect(html).not.toContain('home-eee');
  expect(html).toContain('<link rel="modulepreload" href="/assets/vendor-bbb.js" />');
});
