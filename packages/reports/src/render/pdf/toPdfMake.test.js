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
  // Full-width: one star column per header cell.
  expect(t.widths).toEqual(['*', '*']);
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

// --- not-yet-translated kinds ------------------------------------------------

test('markdown throws a not-yet-translated error', () => {
  expect(() => toPdfMake([markdown({ markdown: '# hi' })])).toThrow(/markdown.*not yet translated/i);
});

test('image throws a not-yet-translated error', () => {
  expect(() => toPdfMake([image({ src: 'x.png' })])).toThrow(/image.*not yet translated/i);
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
      children: [stat({ label: 'Revenue', value: '$1.2M' }), stat({ label: 'Users', value: '3,400' })],
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
  const buffer = await renderPdfBuffer(nodes, { title: 'Quarterly Report', footer: 'Confidential' });
  expect(Buffer.isBuffer(buffer)).toBe(true);
  expect(buffer.length).toBeGreaterThan(1000);
  expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
});
