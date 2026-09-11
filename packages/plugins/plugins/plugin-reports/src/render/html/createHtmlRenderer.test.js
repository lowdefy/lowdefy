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

// Renders the markup patterns Html blocks carry through the real takumi
// engine: inline-styled flex tiles, <style> classes with CSS variables, Tailwind
// utility classes against compiled CSS, bare block-flow markup, the deprecated
// <font> tag, and a height box.

import { fonts } from '../../fonts/fonts.js';
import createHtmlRenderer from './createHtmlRenderer.js';

// A hand-written stand-in for the report-styles artifact (build/reports/
// styles.css): the shape Tailwind v4 emits — @property, @layer, theme
// variables, oklch() colours, calc()/rem lengths — for the utilities below.
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

const renderHtml = createHtmlRenderer({ fonts });
const renderStyled = createHtmlRenderer({ fonts, stylesheets: REPORT_STYLES });

test('an inline-styled flex tile renders an SVG at the given width', async () => {
  const { svg } = await renderHtml({ html: TILE_INLINE, width: 250 });
  expect(svg.startsWith('<svg')).toBe(true);
  expect(svg).toContain('width="250"');
  // The tile's own background is painted, so the flex box laid out as a box.
  expect(svg).toContain('#dff0d8');
});

test('the height is measured from the content and matches the rendered SVG', async () => {
  const short = await renderHtml({
    html: '<div style="display:flex"><span>One line</span></div>',
    width: 200,
  });
  const tall = await renderHtml({ html: TILE_INLINE, width: 200 });
  expect(short.height).toBeGreaterThan(0);
  expect(tall.height).toBeGreaterThan(short.height);
  expect(tall.svg).toContain(`height="${tall.height}"`);
});

test('a <style> block applies its classes and resolves CSS variables', async () => {
  const { svg } = await renderHtml({ html: TILE_STYLE_TAG, width: 250 });
  // var(--tile-bg) resolved to the inline custom property, not the fallback.
  expect(svg).toContain('#dff0d8');
  expect(svg).not.toContain('#eeeeee');
  // .label { color: #888 } reached the text.
  expect(svg).toContain('fill="#888"');
});

test('Tailwind utility classes render styled when the report CSS is in the stack', async () => {
  const { svg, height } = await renderStyled({ html: TILE_TAILWIND, width: 250 });
  // bg-slate-100's oklch() theme variable, resolved to sRGB.
  expect(svg).toContain('#f1f5f9');
  expect(svg).toContain('fill="#64748b"');
  expect(height).toBeGreaterThan(50);
});

test('the same tile is unstyled without the report CSS', async () => {
  const { svg, height } = await renderHtml({ html: TILE_TAILWIND, width: 250 });
  expect(svg).not.toContain('#f1f5f9');
  expect(height).toBeLessThan(50);
});

test('bare block-flow markup renders with heading defaults', async () => {
  const { svg, height } = await renderHtml({
    html: '<h3>Section title</h3><p>Body copy that wraps over lines.</p>',
    width: 200,
  });
  // A heading plus a wrapped paragraph stacks well past one line.
  expect(height).toBeGreaterThan(50);
  expect(svg).toMatch(/<(path|use)/);
});

test('a <font> tag renders', async () => {
  const { svg, height } = await renderHtml({
    html: '<div><font size="4">-12.4%</font></div>',
    width: 200,
  });
  expect(height).toBeGreaterThan(0);
  expect(svg).toMatch(/<(path|use)/);
});

test('an unparseable CSS length rejects with the engine error', async () => {
  // What a template injecting an empty value produces, which takumi rejects.
  await expect(
    renderHtml({ html: '<div style="width: not-a-length">x</div>', width: 200 })
  ).rejects.toThrow('not-a-length');
});

test('markup that draws nothing measures to zero height', async () => {
  const { height } = await renderHtml({ html: '<!-- nothing to draw -->', width: 200 });
  expect(height).toBe(0);
});

test('a given height sizes the canvas and is returned unchanged', async () => {
  const { svg, height } = await renderHtml({ html: TILE_INLINE, width: 200, height: 120 });
  expect(height).toBe(120);
  expect(svg).toContain('height="120"');
});

test('a given height gives the markup a definite box to fill', async () => {
  // Two tiles of the same declared height must render the same height even when
  // one of their labels wraps, so a row of them lines up.
  const tile = (label) =>
    `<div style="height: 100%; border: 1px solid #f0f0f0; padding: 8px"><span style="font-size: 11px">${label}</span></div>`;
  const short = await renderHtml({ html: tile('OWNERS'), width: 200, height: 76 });
  const wrapping = await renderHtml({
    html: tile('COMPLETION RATE OVER THE PERIOD'),
    width: 200,
    height: 76,
  });
  expect(short.height).toBe(76);
  expect(wrapping.height).toBe(76);
  expect(short.svg).toContain('height="76"');
  expect(wrapping.svg).toContain('height="76"');
});
