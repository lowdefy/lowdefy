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

import DependencyTracker from '../../src/tracking/DependencyTracker.js';
import { captureRenders, countEvaluations, trackingContext } from '../trackingContext.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

// These tests are about tracked passes, so they hold even when the suite runs with test:full.
let trackerEnabled;
beforeAll(() => {
  trackerEnabled = DependencyTracker.enabled;
  DependencyTracker.enabled = true;
});
afterAll(() => {
  DependencyTracker.enabled = trackerEnabled;
});

function evaluatedIds(counts) {
  return Object.keys(counts).sort();
}

// The parser records through _mcp's own tracking declaration, which is what these tests are about.
async function mcpContext({ displayMode, tracking }) {
  const host = { displayMode };
  const context = await trackingContext({
    lowdefy: {
      pageId: 'one',
      _internal: { mcp: { getDisplayMode: () => host.displayMode } },
    },
    pageConfig: mcpPage,
    recording: 'parser',
    tracking,
  });
  const setDisplayMode = (next) => {
    host.displayMode = next;
    context._internal.updateMcp();
  };
  return { context, setDisplayMode };
}

const mcpPage = {
  id: 'root',
  type: 'Box',
  blocks: [
    { id: 'mode', type: 'Paragraph', properties: { content: { _mcp: 'displayMode' } } },
    { id: 'embedded', type: 'Paragraph', properties: { content: { _mcp: 'embedded' } } },
    { id: 'name', type: 'TextInput' },
    { id: 'echo', type: 'Paragraph', properties: { content: { _state: 'name' } } },
    { id: 'static', type: 'Paragraph', properties: { content: 'static' } },
  ],
};

test('a display mode change re-evaluates and re-renders the block that reads _mcp displayMode, and no other', async () => {
  const { context, setDisplayMode } = await mcpContext({ displayMode: 'inline' });
  const { mode, embedded } = context._internal.RootSlots.map;
  expect(mode.propertiesEval.output).toEqual({ content: 'inline' });
  expect(embedded.propertiesEval.output).toEqual({ content: true });
  const { counts } = countEvaluations(context);
  const rendered = captureRenders(context);
  setDisplayMode('fullscreen');
  expect(evaluatedIds(counts)).toEqual(['mode']);
  expect(mode.propertiesEval.output).toEqual({ content: 'fullscreen' });
  expect([...rendered].map((key) => key.split(':')[2])).toEqual(['mode']);
  setDisplayMode('pip');
  expect(mode.propertiesEval.output).toEqual({ content: 'pip' });
});

test('a host context change that leaves the display mode unchanged evaluates no block', async () => {
  const { context, setDisplayMode } = await mcpContext({ displayMode: 'inline' });
  const { counts } = countEvaluations(context);
  setDisplayMode('inline');
  expect(evaluatedIds(counts)).toEqual([]);
});

test('a display mode change runs a full pass when dependency tracking is off', async () => {
  const { context, setDisplayMode } = await mcpContext({ displayMode: 'inline', tracking: false });
  const { counts } = countEvaluations(context);
  setDisplayMode('fullscreen');
  expect(evaluatedIds(counts)).toEqual(
    expect.arrayContaining(['echo', 'embedded', 'mode', 'static'])
  );
  expect(context._internal.RootSlots.map.mode.propertiesEval.output).toEqual({
    content: 'fullscreen',
  });
});

test('_mcp reads null for every key on a page that is not inside a host, and updateMcp does nothing', async () => {
  const context = await trackingContext({
    lowdefy: { pageId: 'one' },
    pageConfig: mcpPage,
    recording: 'parser',
  });
  const { mode, embedded } = context._internal.RootSlots.map;
  expect(mode.propertiesEval.output).toEqual({ content: null });
  expect(embedded.propertiesEval.output).toEqual({ content: null });
  const { counts } = countEvaluations(context);
  context._internal.updateMcp();
  expect(evaluatedIds(counts)).toEqual([]);
});
