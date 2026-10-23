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

import getContextKey from './getContextKey.js';
import { expect, test } from 'vitest';

test('getContextKey gives one context the same key every time', () => {
  const context = {};
  expect(getContextKey(context)).toBe(getContextKey(context));
});

test('getContextKey gives a rebuilt context a new key', () => {
  expect(getContextKey({})).not.toBe(getContextKey({}));
});
