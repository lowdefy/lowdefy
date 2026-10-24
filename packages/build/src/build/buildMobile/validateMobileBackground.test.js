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
import validateMobileBackground from './validateMobileBackground.js';
import validateMobileShare from './validateMobileShare.js';

test('validateMobileBackground accepts an endpoint and an interval of 15 minutes or more', () => {
  expect(() =>
    validateMobileBackground({ background: { endpointId: 'refresh', interval: 30 } })
  ).not.toThrow();
});

test('validateMobileBackground refuses an interval under 15 minutes', () => {
  expect(() =>
    validateMobileBackground({ background: { endpointId: 'refresh', interval: 5 } })
  ).toThrow('App "mobile.background.interval" should be a number of 15 or more.');
});

test('validateMobileShare needs the page shared items open', () => {
  expect(() => validateMobileShare({ share: { pageId: 'inbox' } })).not.toThrow();
  expect(() => validateMobileShare({ share: {} })).toThrow(
    'App "mobile.share.pageId" should be a non-empty string.'
  );
});
