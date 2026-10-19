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

const pageId = 'one';

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

function createWindow({ width, height = 800 }) {
  return { innerWidth: width, innerHeight: height };
}

async function mediaContext({ pageConfig, recording, tracking, width }) {
  const window = createWindow({ width });
  const context = await trackingContext({
    lowdefy: { pageId, _internal: { globals: { window } } },
    pageConfig,
    recording,
    tracking,
  });
  const resize = ({ width: nextWidth, height = window.innerHeight }) => {
    window.innerWidth = nextWidth;
    window.innerHeight = height;
    context._internal.updateMedia();
  };
  return { context, resize };
}

const mediaPage = {
  id: 'root',
  type: 'Box',
  blocks: [
    { id: 'size', type: 'Paragraph', properties: { content: { _media: 'size' } } },
    { id: 'width', type: 'Paragraph', properties: { content: { _media: { key: 'width' } } } },
    { id: 'height', type: 'Paragraph', properties: { content: { _media: 'height' } } },
    { id: 'all', type: 'Paragraph', properties: { content: { _media: true } } },
    { id: 'name', type: 'TextInput' },
    { id: 'echo', type: 'Paragraph', properties: { content: { _state: 'name' } } },
    { id: 'static', type: 'Paragraph', properties: { content: 'static' } },
    // _mql is untracked in the stub recording, so this block evaluates on every tracked pass.
    {
      id: 'untracked',
      type: 'Paragraph',
      properties: { content: { _mql: { on: { a: 1 }, expr: '$a' } } },
    },
  ],
};

test('a breakpoint change re-evaluates the blocks that read _media size, and no others', async () => {
  const { context, resize } = await mediaContext({ pageConfig: mediaPage, width: 700 });
  const { counts } = countEvaluations(context);
  const rendered = captureRenders(context);
  resize({ width: 1100 });
  expect(evaluatedIds(counts)).toEqual(['all', 'size', 'untracked', 'width']);
  expect(context._internal.RootSlots.map.size.propertiesEval.output).toEqual({ content: 'lg' });
  expect(context._internal.RootSlots.map.width.propertiesEval.output).toEqual({ content: 1100 });
  const renderedIds = [...rendered].map((key) => key.split(':')[2]);
  expect(renderedIds).toEqual(expect.arrayContaining(['all', 'size', 'width']));
  expect(renderedIds).not.toEqual(expect.arrayContaining(['static']));
  expect(renderedIds).not.toEqual(expect.arrayContaining(['echo']));
  expect(renderedIds).not.toEqual(expect.arrayContaining(['height']));
});

test('a resize within a breakpoint does not re-evaluate blocks that only read _media size', async () => {
  const { context, resize } = await mediaContext({ pageConfig: mediaPage, width: 800 });
  const { counts } = countEvaluations(context);
  resize({ width: 900 });
  expect(evaluatedIds(counts)).toEqual(['all', 'untracked', 'width']);
  expect(context._internal.RootSlots.map.size.propertiesEval.output).toEqual({ content: 'md' });
});

test('a height-only resize re-evaluates only the blocks that read height or the whole object', async () => {
  const { context, resize } = await mediaContext({ pageConfig: mediaPage, width: 800 });
  const { counts } = countEvaluations(context);
  resize({ width: 800, height: 400 });
  expect(evaluatedIds(counts)).toEqual(['all', 'height', 'untracked']);
});

test('a resize event that leaves the viewport unchanged evaluates no block', async () => {
  const { context, resize } = await mediaContext({ pageConfig: mediaPage, width: 800 });
  const { counts } = countEvaluations(context);
  const rendered = captureRenders(context);
  resize({ width: 800 });
  expect(evaluatedIds(counts)).toEqual([]);
  expect(rendered.size).toBe(0);
});

test('a media change no block reads runs no pass, so untracked blocks are not evaluated', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      { id: 'size', type: 'Paragraph', properties: { content: { _media: 'size' } } },
      {
        id: 'untracked',
        type: 'Paragraph',
        properties: { content: { _mql: { on: { a: 1 }, expr: '$a' } } },
      },
    ],
  };
  const { context, resize } = await mediaContext({ pageConfig, width: 800 });
  const { counts } = countEvaluations(context);
  resize({ width: 900 });
  expect(evaluatedIds(counts)).toEqual([]);
});

test('a page with no _media reads evaluates no block on resize', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      { id: 'name', type: 'TextInput' },
      { id: 'echo', type: 'Paragraph', properties: { content: { _state: 'name' } } },
    ],
  };
  const { context, resize } = await mediaContext({ pageConfig, width: 800 });
  const { counts } = countEvaluations(context);
  resize({ width: 1600, height: 300 });
  expect(evaluatedIds(counts)).toEqual([]);
});

test('visibility driven by _media size shows and hides a container and its children', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'mobile',
        type: 'Box',
        visible: { _eq: [{ _media: 'size' }, 'xs'] },
        blocks: [{ id: 'inside', type: 'Paragraph', properties: { content: 'menu' } }],
      },
      { id: 'static', type: 'Paragraph', properties: { content: 'static' } },
    ],
  };
  const { context, resize } = await mediaContext({ pageConfig, width: 1200 });
  const { mobile, inside } = context._internal.RootSlots.map;
  expect(mobile.visibleEval.output).toBe(false);
  expect(inside.visibleEval.output).toBe(false);
  const { counts } = countEvaluations(context);
  resize({ width: 500 });
  expect(mobile.visibleEval.output).toBe(true);
  expect(inside.visibleEval.output).toBe(true);
  expect(evaluatedIds(counts)).toEqual(['inside', 'mobile']);
  resize({ width: 1200 });
  expect(mobile.visibleEval.output).toBe(false);
  expect(inside.visibleEval.output).toBe(false);
});

test('the operator tracking declaration records _media reads by key', async () => {
  const { context } = await mediaContext({
    pageConfig: mediaPage,
    recording: 'parser',
    width: 800,
  });
  const { size, width, all } = context._internal.RootSlots.map;
  expect([...size.reads]).toEqual(['media:size']);
  expect(size.alwaysEvaluate).toBe(null);
  expect([...width.reads]).toEqual(['media:width']);
  expect([...all.reads]).toEqual(['media:*']);
});

test('with the real declarations a same-breakpoint resize skips blocks reading _media size', async () => {
  const { context, resize } = await mediaContext({
    pageConfig: mediaPage,
    recording: 'parser',
    width: 800,
  });
  const { counts } = countEvaluations(context);
  resize({ width: 900 });
  expect(evaluatedIds(counts)).not.toContain('size');
  expect(evaluatedIds(counts)).toContain('width');
  counts.size = undefined;
  resize({ width: 1100 });
  expect(context._internal.RootSlots.map.size.propertiesEval.output).toEqual({ content: 'lg' });
});

test('with dependency tracking off a media change runs a full pass', async () => {
  const { context, resize } = await mediaContext({
    pageConfig: mediaPage,
    tracking: false,
    width: 800,
  });
  const { counts } = countEvaluations(context);
  resize({ width: 1100 });
  expect(evaluatedIds(counts)).toEqual([
    'all',
    'echo',
    'height',
    'name',
    'root',
    'size',
    'static',
    'untracked',
    'width',
  ]);
  expect(context._internal.RootSlots.map.size.propertiesEval.output).toEqual({ content: 'lg' });
});

test('media reads inside list rows re-evaluate on a breakpoint change', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          { id: 'list.$.size', type: 'Paragraph', properties: { content: { _media: 'size' } } },
        ],
      },
    ],
  };
  const { context, resize } = await mediaContext({ pageConfig, width: 500 });
  context._internal.RootSlots.map.list.pushItem();
  context._internal.update();
  expect(context._internal.RootSlots.map['list.0.size'].propertiesEval.output).toEqual({
    content: 'xs',
  });
  resize({ width: 1600 });
  expect(context._internal.RootSlots.map['list.0.size'].propertiesEval.output).toEqual({
    content: '2xl',
  });
});
