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

import addNonceToElements from './addNonceToElements.js';
import { expect, test } from 'vitest';

test('addNonceToElements adds the nonce to every script and style element', () => {
  const html = `<script src="https://cdn.example.com/a.js"></script>
<script>window.a = 1;</script>
<STYLE>body { margin: 0; }</STYLE>
<link rel="stylesheet" href="https://fonts.example.com/font.css" />`;
  expect(addNonceToElements({ html, nonce: 'abc' }))
    .toEqual(`<script nonce="abc" src="https://cdn.example.com/a.js"></script>
<script nonce="abc">window.a = 1;</script>
<STYLE nonce="abc">body { margin: 0; }</STYLE>
<link rel="stylesheet" href="https://fonts.example.com/font.css" />`);
});

test('addNonceToElements leaves script tag text inside a script body unchanged', () => {
  const html = `<script>document.write("<script src=\\"x.js\\"><\\/script>");</script>`;
  expect(addNonceToElements({ html, nonce: 'abc' })).toEqual(
    `<script nonce="abc">document.write("<script src=\\"x.js\\"><\\/script>");</script>`
  );
});

test('addNonceToElements returns html without script or style elements unchanged', () => {
  const html = '<link rel="icon" href="/icon.png" /><noscript>No script</noscript>';
  expect(addNonceToElements({ html, nonce: 'abc' })).toEqual(html);
});

test('addNonceToElements returns an empty string unchanged', () => {
  expect(addNonceToElements({ html: '', nonce: 'abc' })).toEqual('');
});
