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

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// A fill step on a block with no text input of its own: a ColorSelector, whose input
// shows only in its picker popup, and a Switch, which fill cannot type into. Run by the
// real runner over the fixture app's fill page.

fixtureTest('fill sets a ColorSelector to a hex colour and closes its picker', async () => {
  const result = await postJourney({
    pageId: 'fill',
    steps: [
      { fill: { blockId: 'theme_color', value: '#ff4d4f' } },
      { expect: { state: { path: 'theme_color', equals: '#ff4d4f' } } },
      { fill: { blockId: 'theme_color', value: '#1677ff80' } },
      { expect: { state: { path: 'theme_color', equals: '#1677ff80' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('fill sets a ColorSelector whose picker an open step left showing', async () => {
  const result = await postJourney({
    pageId: 'fill',
    steps: [
      { open: 'theme_color' },
      { fill: { blockId: 'theme_color', value: '#52c41a' } },
      { expect: { state: { path: 'theme_color', equals: '#52c41a' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('fill of a ColorSelector fails on a value that is not a hex colour', async () => {
  const result = await postJourney({
    pageId: 'fill',
    steps: [{ fill: { blockId: 'theme_color', value: 'red' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Fill of the colour picker in block "theme_color" takes a 6 or 8 digit hex colour, such as #1677ff; got "red".'
  );
});

fixtureTest('fill of a block with no input fails naming the block type', async () => {
  const result = await postJourney({
    pageId: 'fill',
    timeout: 2000,
    steps: [{ fill: { blockId: 'notify_switch', value: 'on' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Fill found no input in block "notify_switch" (Switch) to type into: fill types into a text input, textarea or colour picker.'
  );
});

fixtureTest('fill sets the ColorSelector it names while another picker is open', async () => {
  const result = await postJourney({
    pageId: 'fill',
    steps: [
      { open: 'theme_color' },
      { fill: { blockId: 'accent_color', value: '#722ed1' } },
      { expect: { state: { path: 'accent_color', equals: '#722ed1' } } },
      { expect: { state: { path: 'theme_color', equals: null } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('fill of a disabled ColorSelector fails saying it is disabled', async () => {
  const result = await postJourney({
    pageId: 'fill',
    steps: [{ fill: { blockId: 'locked_color', value: '#722ed1' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe('The colour picker in block "locked_color" is disabled.');
});

fixtureTest('fill of a block that never shows fails as not actionable', async () => {
  const result = await postJourney({
    pageId: 'fill',
    timeout: 2000,
    steps: [{ fill: { blockId: 'hidden_input', value: 'x' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toMatch(/^Block "hidden_input" was not actionable: /);
});
