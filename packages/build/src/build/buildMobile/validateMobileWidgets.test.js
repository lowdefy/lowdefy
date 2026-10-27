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
import validateMobileWidgets from './validateMobileWidgets.js';

// No errors array: collectExceptions throws the first error, as a build without one would.
const context = {};

test('validateMobileWidgets accepts count and list sources', () => {
  expect(() =>
    validateMobileWidgets({
      context,
      widgets: [
        {
          id: 'open',
          title: 'Open tasks',
          layout: 'count',
          endpointId: 'open-count',
          path: '/tasks',
        },
        { id: 'next', title: 'Next jobs', layout: 'list', endpointId: 'next-jobs' },
      ],
    })
  ).not.toThrow();
});

test('validateMobileWidgets refuses a source without an endpoint', () => {
  expect(() =>
    validateMobileWidgets({ context, widgets: [{ id: 'open', title: 'Open' }] })
  ).toThrow('App "mobile.widgets[0].endpointId" should be a non-empty string.');
});

test('validateMobileWidgets refuses an unknown layout and a path without a leading slash', () => {
  expect(() =>
    validateMobileWidgets({
      context,
      widgets: [{ id: 'a', title: 'A', endpointId: 'e', layout: 'chart' }],
    })
  ).toThrow('App "mobile.widgets[0].layout" should be one of count, list.');
  expect(() =>
    validateMobileWidgets({
      context,
      widgets: [{ id: 'a', title: 'A', endpointId: 'e', path: 'tasks' }],
    })
  ).toThrow('App "mobile.widgets[0].path" should be a page path starting with "/".');
});
