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
import { Animated } from 'react-native';

import createShimmerClock from './createShimmerClock.js';

test('createShimmerClock runs one loop while any placeholder holds it', () => {
  const start = jest.fn();
  const stop = jest.fn();
  const loop = jest.spyOn(Animated, 'loop').mockReturnValue({ start, stop });
  const clock = createShimmerClock({ duration: 1200 });
  expect(clock.isRunning()).toBe(false);
  clock.acquire();
  clock.acquire();
  expect(loop).toHaveBeenCalledTimes(1);
  expect(start).toHaveBeenCalledTimes(1);
  clock.release();
  expect(clock.isRunning()).toBe(true);
  expect(stop).not.toHaveBeenCalled();
  clock.release();
  expect(clock.isRunning()).toBe(false);
  expect(stop).toHaveBeenCalledTimes(1);
  loop.mockRestore();
});

test('createShimmerClock starts again after it stopped, and ignores an extra release', () => {
  const start = jest.fn();
  const loop = jest.spyOn(Animated, 'loop').mockReturnValue({ start, stop: jest.fn() });
  const clock = createShimmerClock({ duration: 1200 });
  clock.release();
  expect(clock.isRunning()).toBe(false);
  clock.acquire();
  clock.release();
  clock.acquire();
  expect(start).toHaveBeenCalledTimes(2);
  expect(clock.isRunning()).toBe(true);
  loop.mockRestore();
});
