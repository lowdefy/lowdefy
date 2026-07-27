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

import { ConfigError } from '@lowdefy/errors';
import {
  cell,
  divider,
  heading,
  image,
  markdown,
  row,
  spacer,
  stack,
  stat,
  svg,
  table,
  text,
} from '../../ir/nodes.js';
import { toPdfMake, renderPdfBuffer } from './toPdfMake.js';

// --- heading -----------------------------------------------------------------

test('heading translates to bold styled text sized by level', () => {
  const { content } = toPdfMake([
    heading({ text: 'Title', level: 1 }),
    heading({ text: 'Sub', level: 3 }),
  ]);
  expect(content[0]).toMatchObject({ text: 'Title', bold: true, fontSize: 22 });
  expect(content[1]).toMatchObject({ text: 'Sub', bold: true, fontSize: 14 });
});

// --- text --------------------------------------------------------------------

test('text translates to a paragraph, with no colour when untinted', () => {
  const { content } = toPdfMake([text({ text: 'Hello' })]);
  expect(content[0]).toMatchObject({ text: 'Hello' });
  expect(content[0].color).toBeUndefined();
});

test('text tint maps to a colour', () => {
  const { content } = toPdfMake([text({ text: 'Careful', tint: 'warning' })]);
  expect(content[0]).toMatchObject({ text: 'Careful', color: '#d46b08' });
});

// --- svg ---------------------------------------------------------------------

test('svg translates to a sized svg node wrapped unbreakable', () => {
  const { content } = toPdfMake([svg({ svg: '<svg/>', width: 200, height: 120 })]);
  expect(content[0]).toMatchObject({
    svg: '<svg/>',
    width: 200,
    height: 120,
    unbreakable: true,
  });
});

// --- rows and orphan control -------------------------------------------------

test('row widths map fractions to percentages, auto to auto, fill to a star column', () => {
  const node = row({
    children: [text({ text: 'a' }), text({ text: 'b' }), text({ text: 'c' })],
    widths: [0.25, 'auto', 'fill'],
  });
  const { content } = toPdfMake([node]);
  expect(content[0].columns.map((column) => column.width)).toEqual(['25%', 'auto', '*']);
});

test('a divider and heading travel with the chart they introduce', () => {
  const { content } = toPdfMake([
    divider(),
    heading({ text: 'Revenue by month', level: 4 }),
    svg({ svg: '<svg></svg>', width: 500, height: 320 }),
  ]);
  // One unbreakable group, so the chart cannot leave its heading behind.
  expect(content).toHaveLength(1);
  expect(content[0].unbreakable).toBe(true);
  expect(content[0].stack).toHaveLength(3);
  expect(content[0].stack[1].text).toBe('Revenue by month');
});

test('a heading before flowing content is not grouped', () => {
  // Text and tables break across pages, so they never strand a heading.
  const { content } = toPdfMake([heading({ text: 'H', level: 2 }), text({ text: 'prose' })]);
  expect(content).toHaveLength(2);
  expect(content[0].stack).toBeUndefined();
});

test('a heading before a stat row travels with it', () => {
  const { content } = toPdfMake([
    heading({ text: 'H', level: 2 }),
    row({ children: [stat({ label: 'a', value: '1' })], widths: [1] }),
  ]);
  expect(content).toHaveLength(1);
  expect(content[0].unbreakable).toBe(true);
});

test('a heading is left alone when its content is taller than a page', () => {
  const { content } = toPdfMake([
    heading({ text: 'H', level: 2 }),
    svg({ svg: '<svg></svg>', width: 500, height: 900 }),
  ]);
  // Grouping an over-tall chart would make a block pdfmake cannot place.
  expect(content).toHaveLength(2);
});

test('a page break asked for on the heading moves to the group', () => {
  const { content } = toPdfMake([
    { ...heading({ text: 'H', level: 2 }), pageBreakBefore: true },
    svg({ svg: '<svg></svg>', width: 500, height: 300 }),
  ]);
  expect(content[0].pageBreak).toBe('before');
  expect(content[0].stack[0].pageBreak).toBeUndefined();
});

// --- grid --------------------------------------------------------------------

test('a grid is named in the document, not printed, and never becomes a table', () => {
  const node = {
    kind: 'grid',
    sheetName: 'Feedback',
    header: [cell('Author')],
    rows: [[cell('a')], [cell('b')]],
  };
  const { content } = toPdfMake([node]);
  expect(content).toHaveLength(1);
  expect(content[0].table).toBeUndefined();
  expect(content[0]).toMatchObject({
    text: "'Feedback' — 2 rows, included in the Excel export.",
    italics: true,
  });
});

test('a one-row grid reads as a single row', () => {
  const node = { kind: 'grid', sheetName: 'Sales', header: [cell('A')], rows: [[cell(1)]] };
  expect(toPdfMake([node]).content[0].text).toContain('1 row,');
});

// --- table -------------------------------------------------------------------

test('table renders formatted ?? value per cell with a repeated header row', () => {
  const node = table({
    header: [cell('Region'), cell('Revenue')],
    rows: [
      [cell('West'), cell(1250, '$1,250')],
      [cell('East'), cell(0)],
    ],
  });
  const { content } = toPdfMake([node]);
  const { table: t, layout } = content[0];
  expect(t.headerRows).toBe(1);
  // Explicit points, not star columns: A4 content width less pdfmake's 8pt of
  // cell padding per column, divided evenly.
  expect(t.widths).toEqual([(515.28 - 16) / 2, (515.28 - 16) / 2]);
  expect(layout).toBeDefined();
  // Header cells are bold.
  expect(t.body[0]).toEqual([
    { text: 'Region', bold: true, fillColor: '#f5f5f5' },
    { text: 'Revenue', bold: true, fillColor: '#f5f5f5' },
  ]);
  // formatted wins over value; raw value used when no formatted string.
  expect(t.body[1]).toEqual([{ text: 'West' }, { text: '$1,250' }]);
  expect(t.body[2]).toEqual([{ text: 'East' }, { text: '0' }]);
});

test('a long unbreakable token does not widen the table past the page', () => {
  // A star column is never narrower than its widest unbreakable token, so an
  // email or id would push the table off the page. Fixed widths wrap instead.
  const node = table({
    header: [cell('Author'), cell('Comment')],
    rows: [[cell('Maynard.Hodkiewicz@roberta.com'), cell('a comment')]],
  });
  const { content } = toPdfMake([node]);
  const total = content[0].table.widths.reduce((sum, width) => sum + width, 0);
  expect(total).toBeLessThanOrEqual(515.28);
  expect(content[0].table.widths.every((width) => typeof width === 'number')).toBe(true);
});

test('a table inside a row sizes to its column, not the page', () => {
  const node = row({
    children: [table({ header: [cell('A'), cell('B')], rows: [] }), text({ text: 'beside it' })],
    widths: [0.5, 0.5],
  });
  const { content } = toPdfMake([node]);
  const nested = content[0].columns[0].table.widths;
  const total = nested.reduce((sum, width) => sum + width, 0);
  expect(total).toBeLessThanOrEqual(515.28 / 2);
});

test('table renders null/undefined cell values as blank', () => {
  const node = table({ header: [cell('A')], rows: [[cell(null)]] });
  const { content } = toPdfMake([node]);
  expect(content[0].table.body[1]).toEqual([{ text: '' }]);
});

// --- stat --------------------------------------------------------------------

test('stat translates to an unbreakable label + value stack', () => {
  const { content } = toPdfMake([stat({ label: 'Total', value: '1,024' })]);
  expect(content[0].unbreakable).toBe(true);
  expect(content[0].stack[0]).toMatchObject({ text: 'Total' });
  expect(content[0].stack[1]).toMatchObject({ text: '1,024', bold: true });
});

// --- row ---------------------------------------------------------------------

test('row translates to columns with percentage widths from the fraction array', () => {
  const node = row({
    children: [stat({ label: 'A', value: '1' }), stat({ label: 'B', value: '2' })],
    widths: [0.5, 0.25],
  });
  const { content } = toPdfMake([node]);
  expect(content[0].columns).toHaveLength(2);
  expect(content[0].columns[0].width).toBe('50%');
  expect(content[0].columns[1].width).toBe('25%');
  // Each column carries its translated child.
  expect(content[0].columns[0].stack[0]).toMatchObject({ text: 'A' });
});

test('a spacer inside a row becomes an empty gap column at its width', () => {
  const node = row({
    children: [spacer({ width: 0.25 }), text({ text: 'body' })],
    widths: [0.25, 0.75],
  });
  const { content } = toPdfMake([node]);
  expect(content[0].columns[0]).toEqual({ text: '', width: '25%' });
  expect(content[0].columns[1]).toMatchObject({ text: 'body', width: '75%' });
});

// --- stack -------------------------------------------------------------------

test('stack translates children into a pdfmake stack', () => {
  const node = stack({
    children: [heading({ text: 'H', level: 2 }), text({ text: 'p' })],
  });
  const { content } = toPdfMake([node]);
  expect(content[0].stack).toHaveLength(2);
  expect(content[0].stack[0]).toMatchObject({ text: 'H', fontSize: 17 });
  expect(content[0].stack[1]).toMatchObject({ text: 'p' });
});

// --- divider -----------------------------------------------------------------

test('divider draws a horizontal line the width of the content area', () => {
  const { content } = toPdfMake([divider()]);
  const line = content[0].canvas[0];
  expect(line.type).toBe('line');
  // A4 portrait: 595.28 - 40 - 40.
  expect(line.x2).toBeCloseTo(515.28, 2);
  expect(line.y1).toBe(0);
  expect(line.y2).toBe(0);
});

test('divider width follows page size and orientation', () => {
  const { content } = toPdfMake([divider()], { size: 'letter', orientation: 'landscape' });
  // Letter landscape width is 792; minus 80 of horizontal margin.
  expect(content[0].canvas[0].x2).toBeCloseTo(712, 2);
});

// --- spacer ------------------------------------------------------------------

test('a standalone spacer is an empty node', () => {
  const { content } = toPdfMake([spacer({ width: 0.5 })]);
  expect(content[0]).toEqual({ text: '', width: '50%' });
});

// --- markdown ----------------------------------------------------------------
// The mdast mapping is covered in markdownToPdfMake.test.js; here we check the
// dispatch: a markdown node becomes one stack of blocks, and markdown that
// renders nothing is skipped like an unresolved image.

test('markdown translates to a stack of mapped blocks', () => {
  const { content } = toPdfMake([markdown({ markdown: '# Title\n\nBody' })]);
  expect(content[0].stack).toEqual([
    { text: 'Title', fontSize: 22, bold: true, margin: [0, 8, 0, 4] },
    { text: 'Body', margin: [0, 0, 0, 6] },
  ]);
});

test('markdown that renders nothing is skipped, and a page break moves to the next node', () => {
  const { content } = toPdfMake([markdown({ markdown: '   ' }), text({ text: 'after' })]);
  expect(content).toHaveLength(1);
  expect(content[0]).toMatchObject({ text: 'after' });
});

test('a markdown rule is sized to the report content width', () => {
  const { content } = toPdfMake([markdown({ markdown: '---' })], { size: 'letter' });
  // Letter portrait width is 612; minus 80 of horizontal margin.
  expect(content[0].stack[0].canvas[0].x2).toBeCloseTo(532, 2);
});

test('the markdown html warning is logged through the options logger', () => {
  const warn = jest.fn();
  toPdfMake([markdown({ markdown: '<div>x</div>\n\nkept' })], {}, { logger: { warn } });
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toEqual({ htmlNodes: 1 });
});

// --- image -------------------------------------------------------------------

// A resolved image carries a base64 `data` URL, attached by the resolveImages
// pre-pass; `toPdfMake` reads it directly.
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==';

test('a resolved image with width and height translates to a sized pdfmake image', () => {
  const { content } = toPdfMake([
    { ...image({ src: 'logo.png', width: 120, height: 80 }), data: PNG_DATA_URL },
  ]);
  expect(content[0]).toMatchObject({
    image: PNG_DATA_URL,
    width: 120,
    height: 80,
    unbreakable: true,
  });
  expect(content[0].maxWidth).toBeUndefined();
});

test('a resolved image without dimensions caps its natural size to the content width', () => {
  const { content } = toPdfMake([{ ...image({ src: 'logo.png' }), data: PNG_DATA_URL }]);
  // A4 portrait content width: 595.28 - 40 - 40.
  expect(content[0]).toMatchObject({ image: PNG_DATA_URL, maxWidth: 515.28 });
  expect(content[0].width).toBeUndefined();
  expect(content[0].height).toBeUndefined();
});

test('an unresolved image (no data) is skipped from the content', () => {
  const { content } = toPdfMake([image({ src: 'missing.png' }), text({ text: 'after' })]);
  expect(content).toHaveLength(1);
  expect(content[0]).toMatchObject({ text: 'after' });
});

// --- unknown kinds -----------------------------------------------------------

test('an unknown IR kind is rejected by validation', () => {
  expect(() => toPdfMake([{ kind: 'bogus' }])).toThrow(ConfigError);
});

// --- page setup --------------------------------------------------------------

test('page setup defaults to A4 portrait', () => {
  const doc = toPdfMake([text({ text: 'x' })]);
  expect(doc.pageSize).toBe('A4');
  expect(doc.pageOrientation).toBe('portrait');
  expect(doc.pageMargins).toEqual([40, 60, 40, 50]);
  expect(doc.defaultStyle.font).toBe('Roboto');
});

test('page setup honours size and orientation', () => {
  const doc = toPdfMake([text({ text: 'x' })], { size: 'letter', orientation: 'landscape' });
  expect(doc.pageSize).toBe('LETTER');
  expect(doc.pageOrientation).toBe('landscape');
});

test('document title comes from the report title', () => {
  const doc = toPdfMake([text({ text: 'x' })], { title: 'Q3 Report' });
  expect(doc.info.title).toBe('Q3 Report');
});

// --- header / footer ---------------------------------------------------------

test('header defaults to the title and renders it', () => {
  const doc = toPdfMake([text({ text: 'x' })], { title: 'Q3 Report' });
  expect(typeof doc.header).toBe('function');
  expect(doc.header(1, 3)).toMatchObject({ text: 'Q3 Report' });
});

test('an explicit header string overrides the title', () => {
  const doc = toPdfMake([text({ text: 'x' })], { title: 'T', header: 'Custom' });
  expect(doc.header(1, 1).text).toBe('Custom');
});

test('no header is emitted when neither header nor title is set', () => {
  const doc = toPdfMake([text({ text: 'x' })]);
  expect(doc.header).toBeUndefined();
});

test('footer always renders page numbers, timestamp, and optional footer text', () => {
  const now = new Date('2026-07-24T10:00:00.000Z');
  const doc = toPdfMake([text({ text: 'x' })], { footer: 'Confidential' }, { now });
  expect(typeof doc.footer).toBe('function');
  const rendered = doc.footer(2, 5);
  const texts = rendered.columns.map((c) => c.text);
  expect(texts).toContain('Confidential');
  expect(texts).toContain('2 / 5');
  expect(texts).toContain('Generated: 2026-07-24T10:00:00.000Z');
});

test('footer omits configured text but still shows page numbers', () => {
  const doc = toPdfMake([text({ text: 'x' })]);
  const texts = doc.footer(1, 1).columns.map((c) => c.text);
  expect(texts).toContain('1 / 1');
  expect(texts).toContain('');
});

// --- page break --------------------------------------------------------------

test('a node flagged pageBreakBefore gets pageBreak: before', () => {
  const node = { ...heading({ text: 'New section', level: 1 }), pageBreakBefore: true };
  const { content } = toPdfMake([node]);
  expect(content[0].pageBreak).toBe('before');
});

test('nodes without the flag have no pageBreak', () => {
  const { content } = toPdfMake([heading({ text: 'H', level: 1 })]);
  expect(content[0].pageBreak).toBeUndefined();
});

// --- smoke: render to a Buffer ----------------------------------------------

test('renders a mixed document to a non-trivial PDF Buffer', async () => {
  const nodes = [
    heading({ text: 'Quarterly Report', level: 1 }),
    text({ text: 'Summary of the quarter.' }),
    row({
      children: [
        stat({ label: 'Revenue', value: '$1.2M' }),
        stat({ label: 'Users', value: '3,400' }),
      ],
      widths: [0.5, 0.5],
    }),
    divider(),
    svg({
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect width="100" height="60" fill="#4c78a8"/></svg>',
      width: 200,
      height: 120,
    }),
    table({
      header: [cell('Region'), cell('Revenue')],
      rows: [
        [cell('West'), cell(1250, '$1,250')],
        [cell('East'), cell(980, '$980')],
      ],
    }),
  ];
  const buffer = await renderPdfBuffer(nodes, {
    title: 'Quarterly Report',
    footer: 'Confidential',
  });
  expect(Buffer.isBuffer(buffer)).toBe(true);
  expect(buffer.length).toBeGreaterThan(1000);
  expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
});

test('renders a GFM markdown document, embedding its image, to a PDF Buffer', async () => {
  const source = [
    '# Markdown report',
    '',
    'Prose with **bold**, _italic_, `code`, and a [link](https://lowdefy.com).',
    '',
    '- one',
    '  - nested',
    '',
    '> quoted',
    '',
    '```js',
    'const a = 1;',
    '```',
    '',
    '| Region | Total |',
    '| --- | ---: |',
    '| North | 100 |',
    '',
    '---',
    '',
    `![logo](${PNG_DATA_URL})`,
  ].join('\n');

  const buffer = await renderPdfBuffer([markdown({ markdown: source })], { title: 'Markdown' });
  expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1000);
});

test('renderPdfBuffer resolves one image, skips an unresolvable one, and warns', async () => {
  const warnings = [];
  const logger = { warn: (...args) => warnings.push(args) };
  const nodes = [
    text({ text: 'Report with images.' }),
    image({ src: PNG_DATA_URL }), // a data URI resolves
    image({ src: 'data:text/plain;base64,aGVsbG8=' }), // not an image -> skipped
  ];
  const buffer = await renderPdfBuffer(nodes, {}, { logger });
  expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  // The unresolvable image logged exactly one warning.
  expect(warnings).toHaveLength(1);
  expect(warnings[0][1]).toMatch(/not an image/i);
});
