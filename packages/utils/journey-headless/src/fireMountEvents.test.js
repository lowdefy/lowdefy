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

import runTestJourney, { record } from './tests/runTestJourney.js';

const SKELETON = { id: 'skeleton', type: 'Box' };

function setState(params) {
  return { id: 'set_state', type: 'SetState', params };
}

// A Record action whose name reads state at `path`, so the log holds what the event saw.
function recordState(path) {
  return { id: `record_${path}`, type: 'Record', params: { _state: path } };
}

function names(log) {
  return log.map(({ name }) => name);
}

// A record page, as an app's company page: the page loads the record in onMountAsync, a frame
// shows its skeleton while state `loading` is true, and the panel inside reads the record's id on
// mount.
function recordPage({ frame = {}, panel = {}, blocks = [] } = {}) {
  return {
    id: 'home',
    events: {
      onInit: [setState({ loading: true })],
      onMountAsync: [
        { id: 'load', type: 'Wait', params: 20 },
        setState({ record: { id: 'c1' }, loading: false }),
      ],
    },
    blocks: [
      {
        id: 'frame',
        type: 'Box',
        loading: { _state: 'loading' },
        skeleton: SKELETON,
        blocks: [
          {
            id: 'panel',
            type: 'Box',
            events: { onMount: [recordState('record.id')] },
            ...panel,
          },
        ],
        ...frame,
      },
      ...blocks,
    ],
  };
}

test("a loading block's skeleton holds its content back until the page's onMountAsync loads it", async () => {
  const { errors, log, result } = await runTestJourney({
    pages: [recordPage()],
    steps: [{ expect: { visible: 'panel' } }],
  });
  expect(result.passed).toBe(true);
  expect(errors).toEqual([]);
  expect(names(log)).toEqual(['c1']);
});

test('content mounts in mount order once loading ends, children first', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      recordPage({
        panel: {
          events: { onMount: [record('panel')] },
          blocks: [{ id: 'deals', type: 'Box', events: { onMount: [record('deals')] } }],
        },
      }),
    ],
    steps: [{ expect: { visible: 'deals' } }],
  });
  expect(result.passed).toBe(true);
  expect(names(log)).toEqual(['deals', 'panel']);
});

test("a block's own onMount shows its skeleton until it finishes", async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          {
            id: 'frame',
            type: 'Box',
            skeleton: SKELETON,
            events: {
              onMount: [
                { id: 'load', type: 'Wait', params: 20 },
                setState({ record: { id: 'c2' } }),
              ],
            },
            blocks: [{ id: 'panel', type: 'Box', events: { onMount: [recordState('record.id')] } }],
          },
        ],
      },
    ],
    steps: [{ expect: { visible: 'panel' } }],
  });
  expect(result.passed).toBe(true);
  expect(names(log)).toEqual(['c2']);
});

test("a parent's loading holds back the content of a skeleton below it", async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: {
          onInit: [setState({ loading: true })],
          onMountAsync: [
            { id: 'load', type: 'Wait', params: 20 },
            setState({ record: { id: 'c3' }, loading: false }),
          ],
        },
        blocks: [
          {
            id: 'outer',
            type: 'Box',
            loading: { _state: 'loading' },
            blocks: [
              {
                id: 'inner',
                type: 'Box',
                skeleton: SKELETON,
                blocks: [
                  { id: 'panel', type: 'Box', events: { onMount: [recordState('record.id')] } },
                ],
              },
            ],
          },
        ],
      },
    ],
    steps: [{ expect: { visible: 'panel' } }],
  });
  expect(result.passed).toBe(true);
  expect(names(log)).toEqual(['c3']);
});

test('content unmounts when its block shows the skeleton again, and mounts again after', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      recordPage({
        blocks: [
          {
            id: 'reload',
            type: 'Button',
            events: {
              onClick: [
                setState({ loading: true }),
                { id: 'load', type: 'Wait', params: 20 },
                setState({ record: { id: 'c4' }, loading: false }),
              ],
            },
          },
        ],
      }),
    ],
    steps: [{ expect: { visible: 'panel' } }, { click: 'reload' }],
  });
  expect(result.passed).toBe(true);
  expect(names(log)).toEqual(['c1', 'c4']);
});

test('a hidden block mounts its content once it shows, and again after it hides and shows', async () => {
  const toggle = (show) => ({
    id: show ? 'show' : 'hide',
    type: 'Button',
    events: { onClick: [setState({ shown: show })] },
  });
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: { onInit: [setState({ shown: false })] },
        blocks: [
          toggle(true),
          toggle(false),
          {
            id: 'section',
            type: 'Box',
            visible: { _state: 'shown' },
            blocks: [{ id: 'panel', type: 'Box', events: { onMount: [record('panel')] } }],
          },
        ],
      },
    ],
    steps: [
      { expect: { hidden: 'panel' } },
      { click: 'show' },
      { click: 'hide' },
      { click: 'show' },
      { expect: { visible: 'panel' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(names(log)).toEqual(['panel', 'panel']);
});

test('content that mounts once loading ends can run a method of a block that mounts with it', async () => {
  const { errors, log, result } = await runTestJourney({
    pages: [
      recordPage({
        panel: {
          events: {
            onMount: [
              {
                id: 'run_reload',
                type: 'CallMethod',
                params: { blockId: 'panel_reload', method: 'run' },
              },
            ],
          },
          blocks: [
            {
              id: 'panel_reload',
              type: 'PluginRunChain',
              events: { onRun: [recordState('record.id')] },
            },
          ],
        },
      }),
    ],
    steps: [{ expect: { visible: 'panel' } }],
  });
  expect(result.passed).toBe(true);
  expect(result.browserOnly).toBeUndefined();
  expect(errors).toEqual([]);
  expect(names(log)).toEqual(['c1']);
});

test('content behind a skeleton is hidden to an expect, and no click target', async () => {
  const { log, result } = await runTestJourney({
    pages: [recordPage({ frame: { loading: true }, panel: { type: 'Button', events: {} } })],
    steps: [{ expect: { hidden: 'panel' } }, { click: 'panel' }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.message).toContain('Block "panel" is not visible');
  expect(log).toEqual([]);
});

test("an onMount that finishes after its block unmounted does not end the new mount's loading", async () => {
  // At 30 ms the frame shows its skeleton for 10 ms, unmounting slow_block while its first
  // onMount still waits. Its content mounts only once the second onMount, from the remount,
  // finishes.
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: {
          onMountAsync: [
            { id: 'before_refresh', type: 'Wait', params: 30 },
            setState({ refreshing: true }),
            { id: 'refresh', type: 'Wait', params: 10 },
            setState({ refreshing: false }),
          ],
        },
        blocks: [
          {
            id: 'frame',
            type: 'Box',
            loading: { _state: 'refreshing' },
            skeleton: SKELETON,
            blocks: [
              {
                id: 'slow_block',
                type: 'Box',
                skeleton: SKELETON,
                events: {
                  onMount: [{ id: 'load', type: 'Wait', params: 150 }, record('slow_block')],
                },
                blocks: [{ id: 'content', type: 'Box', events: { onMount: [record('content')] } }],
              },
            ],
          },
        ],
      },
    ],
    steps: [{ expect: { visible: 'content' } }],
  });
  expect(result.passed).toBe(true);
  expect(names(log)).toEqual(['slow_block', 'slow_block', 'content']);
});

test('an open Modal that hides shows closed again, so its content does not mount again', async () => {
  const button = (id, actions) => ({ id, type: 'Button', events: { onClick: actions } });
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: { onInit: [setState({ shown: true })] },
        blocks: [
          button('open', [
            {
              id: 'open_modal',
              type: 'CallMethod',
              params: { blockId: 'modal', method: 'setOpen', args: [{ open: true }] },
            },
          ]),
          button('hide', [setState({ shown: false })]),
          button('show', [setState({ shown: true })]),
          {
            id: 'modal',
            type: 'Modal',
            visible: { _state: 'shown' },
            blocks: [{ id: 'panel', type: 'Box', events: { onMount: [record('panel')] } }],
          },
        ],
      },
    ],
    steps: [
      { click: 'open' },
      { expect: { visible: 'panel' } },
      { click: 'hide' },
      { click: 'show' },
      { expect: { hidden: 'panel' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(names(log)).toEqual(['panel']);
});
