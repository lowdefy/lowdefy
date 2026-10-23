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
import { expect, test } from 'vitest';

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

test('template dark mode script reads the preference under the app key', () => {
  const html = template({
    assets,
    basePath: '/app',
    config: { pageConfig: {} },
    pageAssets: { js: [], css: [], prefetch: [] },
    slug: 'sales',
  });
  expect(html).toContain('var k="lowdefy:sales:/app:lowdefy_darkMode";');
  expect(html).toContain(
    'var p=localStorage.getItem(k);if(p===null)p=localStorage.getItem("lowdefy_darkMode");'
  );
});

const pageAssets = { js: [], css: [], prefetch: [] };

test('template puts the nonce on every script element, the appended ones included', () => {
  const html = template({
    appendHead: '<script src="https://cdn.example.com/a.js"></script><style>p{}</style>',
    appendBody: '<script>window.b = 1;</script>',
    assets,
    config: { pageConfig: {} },
    nonce: 'bm9uY2U=',
    pageAssets,
  });
  const scripts = html.match(/<script\b[^>]*>/g);
  expect(scripts.length).toEqual(6);
  scripts.forEach((tag) => expect(tag).toContain(' nonce="bm9uY2U="'));
  expect(html).toContain('<style nonce="bm9uY2U=">p{}</style>');
  expect(html).toContain('<meta property="csp-nonce" nonce="bm9uY2U=" />');
});

test('template has the layer order style take the nonce of its script', () => {
  const html = template({ assets, config: { pageConfig: {} }, nonce: 'bm9uY2U=', pageAssets });
  expect(html).toContain(
    'var n=document.currentScript&&document.currentScript.nonce;if(n)s.nonce=n;'
  );
});

test('template writes no nonce without a Content-Security-Policy', () => {
  const html = template({
    appendHead: '<script src="https://cdn.example.com/a.js"></script>',
    appendBody: '<script>window.b = 1;</script>',
    assets,
    config: { pageConfig: {} },
    nonce: null,
    pageAssets,
  });
  expect(html).not.toContain(' nonce="');
  expect(html).not.toContain('csp-nonce');
  expect(html).toContain('<script src="https://cdn.example.com/a.js"></script>');
  expect(html).toContain('<script>window.b = 1;</script>');
});
