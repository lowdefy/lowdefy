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

import ExcelJS from 'exceljs';
import { ConfigError } from '@lowdefy/errors';

import { cell, grid, heading, row, stack, table } from '../../ir/nodes.js';
import toXlsx from './toXlsx.js';

// Load a produced buffer back into a fresh workbook for round-trip assertions.
async function readBack(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

test('one worksheet per grid, in document order, named by sheetName hint', async () => {
  const buffer = await toXlsx([
    grid({
      sheetName: 'Regional Sales',
      header: [cell('Region'), cell('Total')],
      rows: [[cell('North'), cell(100)]],
    }),
    grid({
      sheetName: 'Products',
      header: [cell('SKU')],
      rows: [[cell('A-1')]],
    }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Regional Sales', 'Products']);
});

test('a grid without a sheetName hint falls back to a default name', async () => {
  const buffer = await toXlsx([grid({ header: [cell('A')], rows: [[cell(1)]] })]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Sheet']);
});

test('grid collection descends into row and stack containers in document order', async () => {
  const buffer = await toXlsx([
    row({
      children: [
        grid({ sheetName: 'First', header: [cell('A')], rows: [] }),
        stack({
          children: [grid({ sheetName: 'Second', header: [cell('B')], rows: [] })],
        }),
      ],
      widths: [0.5, 0.5],
    }),
    grid({ sheetName: 'Third', header: [cell('C')], rows: [] }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['First', 'Second', 'Third']);
});

test('name collisions get numeric suffixes', async () => {
  const buffer = await toXlsx([
    grid({ sheetName: 'Sales', header: [cell('A')], rows: [] }),
    grid({ sheetName: 'Sales', header: [cell('A')], rows: [] }),
    grid({ sheetName: 'Sales', header: [cell('A')], rows: [] }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Sales', 'Sales (2)', 'Sales (3)']);
});

test('an illegal-charset hint is sanitized defensively', async () => {
  const buffer = await toXlsx([
    grid({ sheetName: 'a[b]c:d*e?f/g\\h', header: [cell('A')], rows: [] }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['abcdefgh']);
});

test('a hint longer than 31 characters is truncated', async () => {
  const long = 'x'.repeat(40);
  const buffer = await toXlsx([grid({ sheetName: long, header: [cell('A')], rows: [] })]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets[0].name).toBe('x'.repeat(31));
});

test('the header row is written bold', async () => {
  const buffer = await toXlsx([
    grid({
      sheetName: 'S',
      header: [cell('Region'), cell('Total')],
      rows: [[cell('N'), cell(1)]],
    }),
  ]);

  const workbook = await readBack(buffer);
  const sheet = workbook.getWorksheet('S');
  const headerRow = sheet.getRow(1);
  expect(headerRow.getCell(1).value).toBe('Region');
  expect(headerRow.getCell(1).font.bold).toBe(true);
  // Data rows are not bold.
  expect(sheet.getRow(2).getCell(1).font?.bold ?? false).toBe(false);
});

// A monthly pivot's column labels are dates, but they are labels: as date cells
// the header row loses the text a reader filters and sorts by.
test('a header that reads like a date stays text', async () => {
  const buffer = await toXlsx([
    grid({
      sheetName: 'S',
      header: [cell('Region'), cell('2026-01-01'), cell('2026-02-01')],
      rows: [[cell('North'), cell(1), cell(2)]],
    }),
  ]);

  const workbook = await readBack(buffer);
  const headerRow = workbook.getWorksheet('S').getRow(1);
  expect(headerRow.getCell(2).value).toBe('2026-01-01');
  expect(headerRow.getCell(2).numFmt).toBeUndefined();
  expect(headerRow.getCell(3).value).toBe('2026-02-01');
  // The same string in a data row is still a real date cell.
  const dataBuffer = await toXlsx([
    grid({ sheetName: 'S', header: [cell('When')], rows: [[cell('2026-01-01')]] }),
  ]);
  const dataCell = (await readBack(dataBuffer)).getWorksheet('S').getRow(2).getCell(1);
  expect(dataCell.value instanceof Date).toBe(true);
  expect(dataCell.numFmt).toBe('yyyy-mm-dd');
});

test('a numeric value round-trips as a number cell', async () => {
  const buffer = await toXlsx([
    grid({ sheetName: 'S', header: [cell('Amount')], rows: [[cell(1234.5)]] }),
  ]);

  const workbook = await readBack(buffer);
  const value = workbook.getWorksheet('S').getRow(2).getCell(1).value;
  expect(typeof value).toBe('number');
  expect(value).toBe(1234.5);
});

test('a date value round-trips as a date cell', async () => {
  const date = new Date('2026-03-15T00:00:00.000Z');
  const buffer = await toXlsx([
    grid({ sheetName: 'S', header: [cell('When')], rows: [[cell(date)]] }),
  ]);

  const workbook = await readBack(buffer);
  const value = workbook.getWorksheet('S').getRow(2).getCell(1).value;
  expect(value instanceof Date).toBe(true);
  expect(value.getTime()).toBe(date.getTime());
});

test('strings and booleans keep their type', async () => {
  const buffer = await toXlsx([
    grid({
      sheetName: 'S',
      header: [cell('Name'), cell('Active')],
      rows: [[cell('Ann'), cell(true)]],
    }),
  ]);

  const workbook = await readBack(buffer);
  const dataRow = workbook.getWorksheet('S').getRow(2);
  expect(typeof dataRow.getCell(1).value).toBe('string');
  expect(dataRow.getCell(1).value).toBe('Ann');
  expect(typeof dataRow.getCell(2).value).toBe('boolean');
  expect(dataRow.getCell(2).value).toBe(true);
});

test('the raw typed value is written, never the formatted display string', async () => {
  const buffer = await toXlsx([
    grid({
      sheetName: 'S',
      header: [cell('Rate')],
      rows: [[cell(0.125, '12.5%')]],
    }),
  ]);

  const workbook = await readBack(buffer);
  const value = workbook.getWorksheet('S').getRow(2).getCell(1).value;
  expect(value).toBe(0.125);
  expect(typeof value).toBe('number');
});

test('zero grids throws a ConfigError rather than emitting an empty workbook', async () => {
  await expect(toXlsx([heading({ text: 'No tables here', level: 1 })])).rejects.toThrow(
    ConfigError
  );
  await expect(toXlsx([])).rejects.toThrow('no grids to export');
});

test('returns a Buffer of a valid xlsx workbook', async () => {
  const buffer = await toXlsx([grid({ sheetName: 'S', header: [cell('A')], rows: [] })]);
  expect(Buffer.isBuffer(buffer)).toBe(true);
  // The xlsx container is a zip; it starts with the PK signature.
  expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
});

describe('ISO date strings become real date cells', () => {
  // JSON requests deliver dates as strings; a text cell cannot be filtered,
  // sorted by month, or fed to a formula.
  async function cellOf(value) {
    const buffer = await toXlsx([
      grid({ sheetName: 'S', header: [cell('When')], rows: [[cell(value)]] }),
    ]);
    const workbook = await readBack(buffer);
    return workbook.getWorksheet('S').getRow(2).getCell(1);
  }

  test('an ISO datetime converts, keeping its instant and a readable format', async () => {
    const target = await cellOf('2026-07-01T13:45:00.000Z');
    expect(target.value instanceof Date).toBe(true);
    expect(target.value.toISOString()).toBe('2026-07-01T13:45:00.000Z');
    expect(target.numFmt).toBe('yyyy-mm-dd hh:mm');
  });

  test('a date-only string converts without a time of day', async () => {
    const target = await cellOf('2026-07-01');
    expect(target.value.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(target.numFmt).toBe('yyyy-mm-dd');
  });

  test('a datetime naming no zone keeps the clock time it states', async () => {
    // Read as local time this would shift by the server's offset, showing an
    // hour the source never mentioned.
    const target = await cellOf('2026-07-01T13:45');
    expect(target.value.toISOString()).toBe('2026-07-01T13:45:00.000Z');
  });

  test('an offset is resolved to the instant it names', async () => {
    const target = await cellOf('2026-07-01T13:45:00+02:00');
    expect(target.value.toISOString()).toBe('2026-07-01T11:45:00.000Z');
  });

  test('a Date at midnight gets the date format, one with a time the datetime format', async () => {
    expect((await cellOf(new Date('2026-03-15T00:00:00.000Z'))).numFmt).toBe('yyyy-mm-dd');
    expect((await cellOf(new Date('2026-03-15T09:30:00.000Z'))).numFmt).toBe('yyyy-mm-dd hh:mm');
  });

  test.each([
    ['12/07/2026', 'ambiguous by locale'],
    ['1-2', 'a product code JS would read as January 2001'],
    ['2026-02-31', 'a day JS would silently roll into March'],
    ['2026-13-01', 'not a real month'],
    ['July 1, 2026', 'prose'],
    ['20260701', 'no separators'],
  ])('%s stays text (%s)', async (value) => {
    const target = await cellOf(value);
    expect(typeof target.value).toBe('string');
    expect(target.value).toBe(value);
    expect(target.numFmt).toBeUndefined();
  });

  test('numbers, booleans and nulls are untouched', async () => {
    expect(typeof (await cellOf(1234.5)).value).toBe('number');
    expect(typeof (await cellOf(true)).value).toBe('boolean');
    expect((await cellOf(null)).value).toBeNull();
  });
});
