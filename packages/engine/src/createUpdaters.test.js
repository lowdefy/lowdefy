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

import { jest } from '@jest/globals';

import createUpdaters from './createUpdaters.js';

test('update calls every updater registered for the block', () => {
  const updaters = createUpdaters();
  const onTab = jest.fn();
  const onPushed = jest.fn();
  const other = jest.fn();
  updaters.register('title', onTab);
  updaters.register('title', onPushed);
  updaters.register('button', other);
  updaters.update('title');
  expect(onTab).toHaveBeenCalledTimes(1);
  expect(onPushed).toHaveBeenCalledTimes(1);
  expect(other).not.toHaveBeenCalled();
});

test('registering the same updater twice keeps one', () => {
  const updaters = createUpdaters();
  const updater = jest.fn();
  updaters.register('title', updater);
  updaters.register('title', updater);
  updaters.update('title');
  expect(updater).toHaveBeenCalledTimes(1);
});

test('an unregistered updater is not called, and the others still are', () => {
  const updaters = createUpdaters();
  const onTab = jest.fn();
  const onPushed = jest.fn();
  updaters.register('title', onTab);
  const unregister = updaters.register('title', onPushed);
  unregister();
  updaters.update('title');
  expect(onTab).toHaveBeenCalledTimes(1);
  expect(onPushed).not.toHaveBeenCalled();
  unregister();
  updaters.update('title');
  expect(onTab).toHaveBeenCalledTimes(2);
});

test('update with nothing registered does nothing', () => {
  const updaters = createUpdaters();
  expect(() => updaters.update('title')).not.toThrow();
});
