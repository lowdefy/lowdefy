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
import leaveMethodsToBrowser from './leaveMethodsToBrowser.js';

const RUN_REASON =
  'Block "chain" is of type PluginChain, which has no headless stand-in for CallMethod run: the step runs in a browser.';

test('a CallMethod on a plugin block with no stand-in leaves the step to the browser', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          { id: 'chain', type: 'PluginChain', events: { onRun: [record('onRun')] } },
          methodButton({ id: 'go', blockId: 'chain', method: 'run' }),
        ],
      },
    ],
    steps: [{ click: 'go' }, { expect: { visible: 'go' } }],
  });
  expect(result.passed).toBeUndefined();
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toEqual({ index: 0, step: { click: 'go' }, reason: RUN_REASON });
  expect(result.steps.map((step) => step.status)).toEqual(['browser-only', 'skipped']);
  expect(log).toEqual([]);
});

test('an onMount CallMethod on a plugin block with no stand-in leaves the journey to the browser on open', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: {
          onMount: [
            { id: 'run_chain', type: 'CallMethod', params: { blockId: 'chain', method: 'run' } },
            record('after'),
          ],
        },
        blocks: [{ id: 'chain', type: 'PluginChain', events: { onRun: [record('onRun')] } }],
      },
    ],
    steps: [{ expect: { visible: 'chain' } }],
  });
  expect(result.passed).toBeUndefined();
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toEqual({ phase: 'open', reason: RUN_REASON });
  expect(result.steps.map((step) => step.status)).toEqual(['skipped']);
  expect(readLog(log)).toEqual([['after']]);
});

test('a browser-only action during the open leaves the journey to the browser on open', async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: { onMount: [{ id: 'focus', type: 'SetFocus', params: { blockId: 'home' } }] },
        blocks: [{ id: 'text', type: 'Paragraph' }],
      },
    ],
    steps: [{ expect: { visible: 'text' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toEqual({ phase: 'open', reason: 'SetFocus needs the browser.' });
});

test('an app error during an open with no browser-only mark still fails the journey on open', async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: { onMount: [{ id: 'fail', type: 'Fail' }] },
        blocks: [{ id: 'chain', type: 'PluginChain' }],
      },
    ],
    steps: [{ expect: { visible: 'chain' } }],
  });
  expect(result.browserOnly).toBeUndefined();
  expect(result.passed).toBe(false);
  expect(result.failure.phase).toBe('open');
});

test("a stand-in block's unknown method still fails the step", async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          methodButton({ id: 'go', blockId: 'modal', method: 'flip' }),
          { id: 'modal', type: 'Modal', blocks: [{ id: 'inside', type: 'Paragraph' }] },
        ],
      },
    ],
    steps: [{ click: 'go' }],
  });
  expect(result.browserOnly).toBeUndefined();
  expect(result.passed).toBe(false);
  expect(JSON.stringify(result.failure)).toContain(
    'Failed to call method \\"flip\\" on block \\"modal\\". Check if \\"flip\\" is a valid block method'
  );
});

test('a method the block registered runs, and the block is answered once', () => {
  const actor = { browserOnly: [] };
  const block = { blockId: 'chain', type: 'PluginChain', methods: {} };
  block.registerMethod = (name, method) => {
    block.methods[name] = method;
  };
  leaveMethodsToBrowser({ actor, block });
  const proxied = block.methods;
  leaveMethodsToBrowser({ actor, block });
  expect(block.methods).toBe(proxied);
  const run = () => 'ran';
  block.registerMethod('run', run);
  expect(block.methods.run).toBe(run);
  expect(actor.browserOnly).toEqual([]);
  block.methods.focus();
  expect(actor.browserOnly).toEqual([
    'Block "chain" is of type PluginChain, which has no headless stand-in for CallMethod focus: the step runs in a browser.',
  ]);
});
