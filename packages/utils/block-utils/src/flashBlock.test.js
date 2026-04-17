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

/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';

import flashBlock from './flashBlock.js';

test('flashBlock calls element.animate on the bl-{blockId} element', () => {
  const el = document.createElement('div');
  el.id = 'bl-myBlock';
  const animate = jest.fn();
  el.animate = animate;
  document.body.appendChild(el);

  flashBlock('myBlock');

  expect(animate).toHaveBeenCalledTimes(1);
  const [keyframes, timing] = animate.mock.calls[0];
  expect(Array.isArray(keyframes)).toBe(true);
  expect(keyframes.length).toBeGreaterThanOrEqual(2);
  expect(timing).toEqual(
    expect.objectContaining({
      duration: expect.any(Number),
      easing: 'ease-out',
    })
  );

  document.body.removeChild(el);
});

test('flashBlock no-ops when target element is absent', () => {
  expect(() => flashBlock('missingBlock')).not.toThrow();
});

test('flashBlock no-ops gracefully when element has no animate method', () => {
  const el = document.createElement('div');
  el.id = 'bl-legacyBrowser';
  document.body.appendChild(el);

  expect(() => flashBlock('legacyBrowser')).not.toThrow();

  document.body.removeChild(el);
});
