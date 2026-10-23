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

import DOMPurify from 'dompurify';

import { getSafeHref } from './index.js';
import { expect, test } from 'vitest';

function dompurifyKeepsHref(href) {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', href);
  const clean = DOMPurify.sanitize(anchor.outerHTML, { RETURN_DOM: true });
  return clean.firstChild.hasAttribute('href');
}

// A URL links as a block property exactly when DOMPurify keeps it in sanitised
// HTML. getSafeHref also refuses leading whitespace and control characters,
// which DOMPurify strips before testing, so those are not compared here.
const urls = [
  'https://a.test/x',
  'http://a.test',
  'ftp://a.test/file',
  'ftps://a.test/file',
  'mailto:a@b.test',
  'tel:+27123456789',
  'callto:someone',
  'sms:+27123456789',
  'cid:part1@a.test',
  'xmpp:a@b.test',
  'matrix:u/a:b.test',
  '/docs',
  '//a.test',
  './docs',
  '?tab=2',
  '#section',
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  'vbscript:msgbox(1)',
  'data:text/html,x',
  'file:///etc/hosts',
  'blob:https://a.test/1',
  'slack://open',
  'localhost:3000',
];

test.each(urls)('getSafeHref agrees with DOMPurify on %s', (href) => {
  expect(getSafeHref(href) !== undefined).toBe(dompurifyKeepsHref(href));
});
