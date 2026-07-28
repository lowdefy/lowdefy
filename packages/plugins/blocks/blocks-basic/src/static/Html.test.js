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

// Renders the markup patterns the design's spike surveyed through the real
// takumi engine: inline-styled flex tiles, `<style>` classes with CSS
// variables, Tailwind utility classes against compiled CSS, bare block-flow
// markup, the deprecated `<font>` tag, and `<table>` (which cannot lay out).

import { jest } from '@jest/globals';

import { fonts } from '../../../../../reports/src/fonts/fonts.js';
import { validateNode } from '../../../../../reports/src/ir/nodes.js';
import { DangerousHtml, Html } from './Html.js';

// A hand-written stand-in for the report-styles artifact (`build/reports/
// styles.css`): the shape Tailwind v4 emits — `@property`, `@layer`, theme
// variables, `oklch()` colours, `calc()`/`rem` lengths — for the utilities the
// Tailwind fixture below uses.
const REPORT_STYLES = `
@property --tw-gradient-position { syntax: "*"; inherits: false; }
@layer theme {
  :root {
    --color-slate-100: oklch(96.8% 0.007 247.896);
    --color-slate-500: #64748b;
    --spacing: 0.25rem;
  }
}
@layer utilities {
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .gap-2 { gap: calc(var(--spacing) * 2); }
  .rounded-lg { border-radius: 0.5rem; }
  .bg-slate-100 { background-color: var(--color-slate-100); }
  .p-4 { padding: calc(var(--spacing) * 4); }
  .text-xs { font-size: 0.75rem; }
  .text-slate-500 { color: var(--color-slate-500); }
  .text-2xl { font-size: 1.5rem; }
  .font-bold { font-weight: 700; }
}
`;

const TILE_INLINE = `
<div style="display:flex;flex-direction:column;padding:12px;background:#dff0d8">
  <span style="font-size:11px;color:#888">Revenue</span>
  <span style="font-size:22px;font-weight:700">R 1.2m</span>
</div>`;

const TILE_STYLE_TAG = `
<style>
  .tile { display: flex; flex-direction: column; padding: 16px; background: var(--tile-bg, #eeeeee); }
  .label { color: #888; font-size: 11px; }
</style>
<div class="tile" style="--tile-bg:#dff0d8"><span class="label">Revenue</span><span>R 1.2m</span></div>`;

const TILE_TAILWIND = `
<div class="flex flex-col gap-2 rounded-lg bg-slate-100 p-4">
  <span class="text-xs text-slate-500">Revenue</span>
  <span class="text-2xl font-bold">R 1.2m</span>
</div>`;

// Call a renderer with a `propertiesEval.output`-shaped block projection and
// validate the node it returns against the closed IR validator.
async function run(
  renderer,
  { type = 'Html', blockId = 'tile_1', properties = {}, style, layout = {}, context = {} } = {}
) {
  const result = await renderer.toReport({
    block: { id: blockId, blockId, type, properties, style },
    layout,
    context: { fonts, ...context },
  });
  if (result != null) validateNode(result);
  return result;
}

describe('Html', () => {
  test('an inline-styled flex tile renders an SVG at the column width', async () => {
    const node = await run(Html, { properties: { html: TILE_INLINE }, layout: { width: 250 } });
    expect(node.kind).toBe('svg');
    expect(node.width).toBe(250);
    expect(node.svg.startsWith('<svg')).toBe(true);
    expect(node.svg).toContain('width="250"');
    // The tile's own background is painted, so the flex box laid out as a box.
    expect(node.svg).toContain('#dff0d8');
  });

  test('the height is measured from the content and matches the rendered SVG', async () => {
    const short = await run(Html, {
      properties: { html: '<div style="display:flex"><span>One line</span></div>' },
      layout: { width: 200 },
    });
    const tall = await run(Html, {
      properties: { html: TILE_INLINE },
      layout: { width: 200 },
    });
    expect(short.height).toBeGreaterThan(0);
    expect(tall.height).toBeGreaterThan(short.height);
    expect(tall.svg).toContain(`height="${tall.height}"`);
  });

  test('a <style> block applies its classes and resolves CSS variables', async () => {
    const node = await run(Html, { properties: { html: TILE_STYLE_TAG }, layout: { width: 250 } });
    // `var(--tile-bg)` resolved to the inline custom property, not the fallback.
    expect(node.svg).toContain('#dff0d8');
    expect(node.svg).not.toContain('#eeeeee');
    // `.label { color: #888 }` reached the text.
    expect(node.svg).toContain('fill="#888"');
  });

  test('Tailwind utility classes render styled when the report CSS is in the stack', async () => {
    const node = await run(Html, {
      properties: { html: TILE_TAILWIND },
      layout: { width: 250 },
      context: { stylesheets: REPORT_STYLES },
    });
    // `bg-slate-100`'s oklch() theme variable, resolved to sRGB.
    expect(node.svg).toContain('#f1f5f9');
    expect(node.svg).toContain('fill="#64748b"');
    expect(node.height).toBeGreaterThan(50);
  });

  test('the same tile is unstyled without the report CSS', async () => {
    const node = await run(Html, { properties: { html: TILE_TAILWIND }, layout: { width: 250 } });
    expect(node.svg).not.toContain('#f1f5f9');
    expect(node.height).toBeLessThan(50);
  });

  test('bare block-flow markup renders with heading defaults', async () => {
    const node = await run(Html, {
      properties: { html: '<h3>Section title</h3><p>Body copy that wraps over lines.</p>' },
      layout: { width: 200 },
    });
    // A heading plus a wrapped paragraph stacks well past one line.
    expect(node.height).toBeGreaterThan(50);
    expect(node.svg).toMatch(/<(path|use)/);
  });

  test('a <font> tag renders', async () => {
    const node = await run(Html, {
      properties: { html: '<div><font size="4">-12.4%</font></div>' },
      layout: { width: 200 },
    });
    expect(node.kind).toBe('svg');
    expect(node.height).toBeGreaterThan(0);
    expect(node.svg).toMatch(/<(path|use)/);
  });

  test('<table> markup renders and logs the documented warning', async () => {
    const warn = jest.fn();
    const node = await run(Html, {
      properties: { html: '<table><tr><td>A</td><td>1</td></tr></table>' },
      layout: { width: 200 },
      context: { logger: { warn } },
    });
    expect(node.kind).toBe('svg');
    expect(warn).toHaveBeenCalledTimes(1);
    const [meta, message] = warn.mock.calls[0];
    expect(meta.blockId).toBe('tile_1');
    expect(message).toContain('<table>');
    expect(message).toContain('tile_1');
    expect(message).toContain('flex markup');
  });

  // takumi never fetches an image, so an <img> draws nothing and takes no space.
  // Without a warning an author's logo just disappears from the document.
  test('<img> markup logs a warning naming the block that does load images', async () => {
    const warn = jest.fn();
    const node = await run(Html, {
      properties: { html: '<div><img src="/logo.png" width="40" height="40" />Acme</div>' },
      layout: { width: 200 },
      context: { logger: { warn } },
    });
    expect(node.kind).toBe('svg');
    expect(warn).toHaveBeenCalledTimes(1);
    const [meta, message] = warn.mock.calls[0];
    expect(meta.blockId).toBe('tile_1');
    expect(message).toContain('<img>');
    expect(message).toContain('Img block');
  });

  test('a failing render returns null and logs a warning naming the block', async () => {
    const warn = jest.fn();
    const node = await run(Html, {
      // An unparseable CSS length — what a template injecting an empty value
      // produces — which takumi rejects.
      properties: { html: '<div style="width: not-a-length">x</div>' },
      layout: { width: 200 },
      context: { logger: { warn } },
    });
    expect(node).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    const [meta, message] = warn.mock.calls[0];
    expect(meta.blockId).toBe('tile_1');
    expect(meta.err.message).toContain('not-a-length');
    expect(message).toContain("Html block 'tile_1' failed to render and was skipped");
  });

  test('blank html yields no node and never renders', async () => {
    expect(await run(Html, { properties: {} })).toBeNull();
    expect(await run(Html, { properties: { html: '' } })).toBeNull();
  });

  test('markup that measures to nothing yields no node', async () => {
    expect(
      await run(Html, { properties: { html: '<!-- nothing to draw -->' }, layout: { width: 200 } })
    ).toBeNull();
  });

  test('the block style height overrides the measured height', async () => {
    const node = await run(Html, {
      properties: { html: TILE_INLINE },
      style: { height: 120 },
      layout: { width: 200 },
    });
    expect(node.height).toBe(120);
    expect(node.svg).toContain('height="120"');
  });

  test('a css length string style height is read as points', async () => {
    const node = await run(Html, {
      properties: { html: TILE_INLINE },
      style: { height: '90px' },
      layout: { width: 200 },
    });
    expect(node.height).toBe(90);
  });

  test('a style height naming no length falls back to the measured height', async () => {
    const node = await run(Html, {
      properties: { html: TILE_INLINE },
      style: { height: 'auto' },
      layout: { width: 200 },
    });
    expect(node.height).toBeGreaterThan(0);
    expect(node.svg).toContain(`height="${node.height}"`);
  });

  test('falls back to the A4 content width without column geometry', async () => {
    const node = await run(Html, { properties: { html: TILE_INLINE } });
    expect(node.width).toBe(515.28);
  });
});

describe('DangerousHtml', () => {
  test('renders through the same renderer', async () => {
    expect(DangerousHtml).toBe(Html);
    const node = await run(DangerousHtml, {
      type: 'DangerousHtml',
      properties: { html: TILE_INLINE },
      layout: { width: 250 },
    });
    expect(node.kind).toBe('svg');
    expect(node.width).toBe(250);
  });

  test('names its own block type when a render fails', async () => {
    const warn = jest.fn();
    const node = await run(DangerousHtml, {
      type: 'DangerousHtml',
      blockId: 'raw_1',
      properties: { html: '<div style="width: not-a-length">x</div>' },
      layout: { width: 200 },
      context: { logger: { warn } },
    });
    expect(node).toBeNull();
    expect(warn.mock.calls[0][1]).toContain("DangerousHtml block 'raw_1'");
  });
});

test('a block height gives the markup a definite box to fill', async () => {
  // Two tiles of the same declared height must render the same height even when
  // one of their labels wraps, so a row of them lines up.
  const tile = (label) =>
    `<div style="height: 100%; border: 1px solid #f0f0f0; padding: 8px"><span style="font-size: 11px">${label}</span></div>`;
  const short = await run(Html, { properties: { html: tile('OWNERS') }, style: { height: 76 } });
  const wrapping = await run(Html, {
    properties: { html: tile('COMPLETION RATE OVER THE PERIOD') },
    style: { height: 76 },
  });
  expect(short.height).toBe(76);
  expect(wrapping.height).toBe(76);
  // The wrapper is what makes `height: 100%` resolvable, so both tiles draw the
  // same number of border segments at the same size.
  expect(wrapping.svg.length).toBeGreaterThan(0);
  expect(short.svg).toContain('height="76"');
  expect(wrapping.svg).toContain('height="76"');
});

test('a bare block style survives the build as a css-keyed style', async () => {
  // The build files `style: { height: 76 }` under the block's css-key, so a
  // renderer that reads `style.height` sees nothing at all.
  const node = await run(Html, {
    properties: { html: TILE_INLINE },
    style: { block: { height: 90 } },
  });
  expect(node.height).toBe(90);
});
