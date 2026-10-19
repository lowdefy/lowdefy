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

import getSkeletonPhase from './getSkeletonPhase.js';

test('getSkeletonPhase is idle before loading starts', () => {
  expect(getSkeletonPhase({ active: false, startedAt: null, now: 0 })).toEqual({
    phase: 'idle',
    until: null,
  });
});

test('getSkeletonPhase hides the skeleton for the first 120 ms', () => {
  expect(getSkeletonPhase({ active: true, startedAt: 1000, now: 1119 })).toEqual({
    phase: 'hidden',
    until: 1120,
  });
});

test('getSkeletonPhase shows the skeleton from 120 ms while loading', () => {
  expect(getSkeletonPhase({ active: true, startedAt: 1000, now: 1120 }).phase).toBe('visible');
});

test('getSkeletonPhase never shows the skeleton for a response faster than 120 ms', () => {
  expect(getSkeletonPhase({ active: false, startedAt: 1000, now: 1100 }).phase).toBe('idle');
});

test('getSkeletonPhase holds a shown skeleton for at least 300 ms', () => {
  expect(getSkeletonPhase({ active: false, startedAt: 1000, now: 1200 })).toEqual({
    phase: 'holding',
    until: 1420,
  });
});

test('getSkeletonPhase ends the hold once the skeleton was shown 300 ms', () => {
  expect(getSkeletonPhase({ active: false, startedAt: 1000, now: 1420 }).phase).toBe('idle');
});
