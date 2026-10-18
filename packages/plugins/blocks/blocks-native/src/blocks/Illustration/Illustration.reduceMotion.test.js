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
import { AccessibilityInfo, Animated } from 'react-native';
import { waitFor } from '@testing-library/react-native';

import { page, renderPage, screen, styleOf } from '../../test/renderPage.js';

// The Reduce Motion setting is read once per app, so this test has a file of its own.
const HIDDEN = { includeHiddenElements: true };

const pageConfig = page([
  {
    id: 'art',
    type: 'Illustration',
    properties: {
      svg: '<svg viewBox="0 0 10 10"><rect id="dot" width="2" height="2" fill="#000"/></svg>',
      animations: [
        {
          target: 'dot',
          property: 'opacity',
          duration: 6000,
          keyframes: [
            { at: 0, value: 0.4 },
            { at: 0.5, value: 1 },
          ],
        },
      ],
    },
  },
]);

test('with Reduce Motion on, an Illustration stops its clocks and holds the start of each animation', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const loop = Animated.loop;
  const stops = [];
  const spy = jest.spyOn(Animated, 'loop').mockImplementation((animation, config) => {
    const running = loop(animation, config);
    const stop = jest.fn(() => running.stop());
    stops.push(stop);
    return { ...running, stop };
  });
  await renderPage({ pageConfig });
  const dot = await screen.findByTestId('art_dot', HIDDEN);
  await waitFor(() => expect(stops.every((stop) => stop.mock.calls.length > 0)).toBe(true));
  expect(styleOf(dot).opacity).toBe(0.4);
  spy.mockRestore();
});
