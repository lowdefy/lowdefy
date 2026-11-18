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

import { expect, test } from 'vitest';

import getOpenLinkUrl from './getOpenLinkUrl.js';

const base = 'https://app.example.com/base/tickets/12?tab=notes';

test('getOpenLinkUrl returns an http or https URL as an absolute URL', () => {
  expect(getOpenLinkUrl({ base, url: 'https://other.example.org/docs?a=1#top' })).toBe(
    'https://other.example.org/docs?a=1#top'
  );
  expect(getOpenLinkUrl({ base, url: 'http://other.example.org' })).toBe(
    'http://other.example.org/'
  );
  expect(getOpenLinkUrl({ base, url: new URL('https://other.example.org/docs') })).toBe(
    'https://other.example.org/docs'
  );
});

test('getOpenLinkUrl resolves a relative link against the view address on the app origin', () => {
  expect(getOpenLinkUrl({ base, url: '/base/runs?state=open' })).toBe(
    'https://app.example.com/base/runs?state=open'
  );
  expect(getOpenLinkUrl({ base, url: '?tab=files' })).toBe(
    'https://app.example.com/base/tickets/12?tab=files'
  );
  expect(getOpenLinkUrl({ base, url: '//other.example.org/x' })).toBe(
    'https://other.example.org/x'
  );
});

test('getOpenLinkUrl refuses every scheme but http and https', () => {
  [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'blob:https://app.example.com/1',
    'vbscript:msgbox(1)',
    'ftp://files.example.org/a',
    'mailto:someone@example.com',
    'about:blank',
  ].forEach((url) => {
    expect(getOpenLinkUrl({ base, url })).toBeNull();
  });
});

test('getOpenLinkUrl returns null when there is no URL or it does not parse', () => {
  expect(getOpenLinkUrl({ base, url: undefined })).toBeNull();
  expect(getOpenLinkUrl({ base, url: null })).toBeNull();
  expect(getOpenLinkUrl({ base, url: '' })).toBeNull();
  expect(getOpenLinkUrl({ base, url: 'https://' })).toBeNull();
});
