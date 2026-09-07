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

import { DangerousHtml, Html } from './Html.static.js';

// A stand-in for the reports plugin's html renderer: echoes the box it was
// asked for so the tests can assert what the renderer requested.
function makeRenderHtml({ measuredHeight = 48 } = {}) {
  return jest.fn(async ({ width, height }) => ({
    svg: `<svg width="${width}" height="${height ?? measuredHeight}"></svg>`,
    height: height ?? measuredHeight,
  }));
}

function makeContext(overrides = {}) {
  return {
    renderHtml: makeRenderHtml(),
    logger: { warn: jest.fn(), debug: jest.fn() },
    ...overrides,
  };
}

async function run(
  renderer,
  {
    type = 'Html',
    blockId = 'tile_1',
    properties = {},
    style,
    layout = { width: 250 },
    context,
  } = {}
) {
  const ctx = context ?? makeContext();
  const result = await renderer.toReport({
    block: { id: blockId, blockId, type, properties, style },
    layout,
    context: ctx,
  });
  return { result, context: ctx };
}

describe('Html', () => {
  test('Html renders through context.renderHtml at the column width and returns an svg node', async () => {
    const { result, context } = await run(Html, {
      properties: { html: '<div>Tile</div>' },
      layout: { width: 250 },
    });
    expect(context.renderHtml).toHaveBeenCalledWith({
      html: '<div>Tile</div>',
      width: 250,
      height: undefined,
    });
    expect(result).toEqual({
      kind: 'svg',
      svg: '<svg width="250" height="48"></svg>',
      width: 250,
      height: 48,
    });
  });

  test('Html passes the block style height to the engine and keeps it on the node', async () => {
    const { result, context } = await run(Html, {
      properties: { html: '<div>Tile</div>' },
      style: { block: { height: 76 } },
      layout: { width: 200 },
    });
    expect(context.renderHtml).toHaveBeenCalledWith({
      html: '<div>Tile</div>',
      width: 200,
      height: 76,
    });
    expect(result.height).toBe(76);
  });

  test('Html reads a css string height from the element style', async () => {
    const { context } = await run(Html, {
      properties: { html: '<div>Tile</div>' },
      style: { element: { height: '120px' } },
    });
    expect(context.renderHtml.mock.calls[0][0].height).toBe(120);
  });

  test('Html returns null for blank html without calling the engine', async () => {
    const { result, context } = await run(Html, { properties: {} });
    expect(result).toBeNull();
    const empty = await run(Html, { properties: { html: '' } });
    expect(empty.result).toBeNull();
    expect(context.renderHtml).not.toHaveBeenCalled();
  });

  test('Html returns null when the markup measures to zero height', async () => {
    const { result } = await run(Html, {
      properties: { html: '<div></div>' },
      context: makeContext({ renderHtml: makeRenderHtml({ measuredHeight: 0 }) }),
    });
    expect(result).toBeNull();
  });

  test('Html warns on <table> markup and still renders it', async () => {
    const { result, context } = await run(Html, {
      properties: { html: '<table><tr><td>A</td></tr></table>' },
    });
    expect(result.kind).toBe('svg');
    const [meta, message] = context.logger.warn.mock.calls[0];
    expect(meta.blockId).toBe('tile_1');
    expect(message).toContain('<table>');
  });

  test('Html warns on <img> markup and still renders it', async () => {
    const { result, context } = await run(Html, {
      properties: { html: '<div><img src="/logo.png"/></div>' },
    });
    expect(result.kind).toBe('svg');
    expect(context.logger.warn.mock.calls[0][1]).toContain('<img>');
  });

  test('Html skips the block and warns with the blockId when the engine throws', async () => {
    const renderHtml = jest.fn(async () => {
      throw new Error('layout failed');
    });
    const { result, context } = await run(Html, {
      properties: { html: '<div>x</div>' },
      context: makeContext({ renderHtml }),
    });
    expect(result).toBeNull();
    const [meta, message] = context.logger.warn.mock.calls[0];
    expect(meta.blockId).toBe('tile_1');
    expect(meta.err.message).toBe('layout failed');
    expect(message).toContain('layout failed');
  });

  test('Html skips the block and warns once when no html renderer is supplied', async () => {
    const logger = { warn: jest.fn() };
    const first = await run(Html, { properties: { html: '<div>x</div>' }, context: { logger } });
    const second = await run(Html, { properties: { html: '<div>y</div>' }, context: { logger } });
    expect(first.result).toBeNull();
    expect(second.result).toBeNull();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][1]).toContain('renderHtml');
  });
});

describe('DangerousHtml', () => {
  test('DangerousHtml shares the Html renderer', async () => {
    expect(DangerousHtml).toBe(Html);
    const { result } = await run(DangerousHtml, {
      type: 'DangerousHtml',
      properties: { html: '<div>Tile</div>' },
    });
    expect(result.kind).toBe('svg');
  });
});
