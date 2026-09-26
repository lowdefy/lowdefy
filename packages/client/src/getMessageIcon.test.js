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

import getMessageIcon from './getMessageIcon.js';

test('getMessageIcon returns the semantic status icon without a title', () => {
  expect(getMessageIcon({ status: 'success' })).toEqual({ name: 'success', title: '' });
  expect(getMessageIcon({ status: 'info' })).toEqual({ name: 'info', title: '' });
  expect(getMessageIcon({ status: 'warning' })).toEqual({ name: 'warning', title: '' });
  expect(getMessageIcon({ status: 'error' })).toEqual({ name: 'error', title: '' });
});

test('getMessageIcon returns a spinning loading icon for loading messages', () => {
  expect(getMessageIcon({ status: 'loading' })).toEqual({
    name: 'loading',
    spin: true,
    title: '',
  });
});

test('getMessageIcon returns undefined for a status without an icon', () => {
  expect(getMessageIcon({ status: 'open' })).toBeUndefined();
});
