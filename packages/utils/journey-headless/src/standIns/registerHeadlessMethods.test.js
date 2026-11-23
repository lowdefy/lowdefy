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

import runTestJourney, { methodButton, readLog, record } from '../tests/runTestJourney.js';
import registerHeadlessMethods from './registerHeadlessMethods.js';

test("an onMount CallMethod on a plugin block runs the event its meta declares, before the mount's next action", async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: {
          onMount: [
            {
              id: 'run_chain',
              type: 'CallMethod',
              params: { blockId: 'chain', method: 'run', args: [{ from: 'mount' }] },
            },
            record('after'),
          ],
        },
        blocks: [{ id: 'chain', type: 'PluginRunChain', events: { onRun: [record('onRun')] } }],
      },
    ],
    steps: [{ expect: { visible: 'chain' } }],
  });
  expect(result.browserOnly).toBeUndefined();
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onRun', { from: 'mount' }], ['after']]);
});

test('a declared method called from a step runs its event, and the event gets no event without an argument', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          { id: 'chain', type: 'PluginRunChain', events: { onRun: [record('onRun')] } },
          methodButton({ id: 'go', blockId: 'chain', method: 'run' }),
        ],
      },
    ],
    steps: [{ click: 'go' }],
  });
  expect(result.browserOnly).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onRun']]);
});

test('a method the meta does not declare on the same block stays browser-only', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          { id: 'chain', type: 'PluginRunChain', events: { onRun: [record('onRun')] } },
          methodButton({ id: 'go', blockId: 'chain', method: 'pause' }),
        ],
      },
    ],
    steps: [{ click: 'go' }],
  });
  expect(result.passed).toBeUndefined();
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toEqual({
    index: 0,
    step: { click: 'go' },
    reason:
      'Block "chain" is of type PluginRunChain, which has no headless stand-in for CallMethod pause: the step runs in a browser.',
  });
  expect(log).toEqual([]);
});

const HIDDEN_RUN_REASON =
  'Block "chain" is of type PluginRunChain, which has no headless stand-in for CallMethod run: the step runs in a browser.';

test('a declared method on a hidden block stays browser-only, as the browser renders no component for it', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: {
          onMount: [
            { id: 'run_chain', type: 'CallMethod', params: { blockId: 'chain', method: 'run' } },
          ],
        },
        blocks: [
          {
            id: 'chain',
            type: 'PluginRunChain',
            visible: false,
            events: { onRun: [record('onRun')] },
          },
        ],
      },
    ],
    steps: [{ expect: { hidden: 'chain' } }],
  });
  expect(result.passed).toBeUndefined();
  expect(result.browserOnly).toEqual({ phase: 'open', reason: HIDDEN_RUN_REASON });
  expect(log).toEqual([]);
});

test('a declared method inside a closed Modal stays browser-only until the Modal opens', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          methodButton({ id: 'open', blockId: 'modal', method: 'setOpen', args: [{ open: true }] }),
          methodButton({ id: 'go', blockId: 'chain', method: 'run' }),
          {
            id: 'modal',
            type: 'Modal',
            blocks: [{ id: 'chain', type: 'PluginRunChain', events: { onRun: [record('onRun')] } }],
          },
        ],
      },
    ],
    steps: [{ click: 'open' }, { click: 'go' }],
  });
  expect(result.browserOnly).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onRun']]);
  const closed = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          methodButton({ id: 'go', blockId: 'chain', method: 'run' }),
          {
            id: 'modal',
            type: 'Modal',
            blocks: [{ id: 'chain', type: 'PluginRunChain', events: { onRun: [record('onRun')] } }],
          },
        ],
      },
    ],
    steps: [{ click: 'go' }],
  });
  expect(closed.result.browserOnly).toEqual({
    index: 0,
    step: { click: 'go' },
    reason: HIDDEN_RUN_REASON,
  });
  expect(closed.log).toEqual([]);
});

test('a declaration that names no event fails, naming the block type and the method', () => {
  const block = { type: 'PluginChain', registerMethod: () => undefined };
  expect(() =>
    registerHeadlessMethods({ block, headlessMethods: { run: { fires: 'onRun' } } })
  ).toThrow(
    'Block type PluginChain declares headlessMethods.run as {"fires":"onRun"}: it should be the name of the block event the method fires.'
  );
  expect(() => registerHeadlessMethods({ block, headlessMethods: ['run'] })).toThrow(
    'Block type PluginChain declares headlessMethods as ["run"]: it should be an object of { [method]: the name of the event it fires }.'
  );
});

test('a block whose meta declares no methods registers none', () => {
  const registered = [];
  const block = { type: 'PluginChain', registerMethod: (method) => registered.push(method) };
  registerHeadlessMethods({ block, headlessMethods: undefined });
  expect(registered).toEqual([]);
});
