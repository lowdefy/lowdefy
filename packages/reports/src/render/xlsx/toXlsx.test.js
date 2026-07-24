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

import { cell, heading, row, stack, table } from '../../ir/nodes.js';
import toXlsx from './toXlsx.js';

// Load a produced buffer back into a fresh workbook for round-trip assertions.
async function readBack(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

test('one worksheet per table, in document order, named by sheetName hint', async () => {
  const buffer = await toXlsx([
    table({
      sheetName: 'Regional Sales',
      header: [cell('Region'), cell('Total')],
      rows: [[cell('North'), cell(100)]],
    }),
    table({
      sheetName: 'Products',
      header: [cell('SKU')],
      rows: [[cell('A-1')]],
    }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Regional Sales', 'Products']);
});

test('a table without a sheetName hint falls back to a default name', async () => {
  const buffer = await toXlsx([
    table({ header: [cell('A')], rows: [[cell(1)]] }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Sheet']);
});

test('table collection descends into row and stack containers in document order', async () => {
  const buffer = await toXlsx([
    row({
      children: [
        table({ sheetName: 'First', header: [cell('A')], rows: [] }),
        stack({
          children: [table({ sheetName: 'Second', header: [cell('B')], rows: [] })],
        }),
      ],
      widths: [0.5, 0.5],
    }),
    table({ sheetName: 'Third', header: [cell('C')], rows: [] }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['First', 'Second', 'Third']);
});

test('name collisions get numeric suffixes', async () => {
  const buffer = await toXlsx([
    table({ sheetName: 'Sales', header: [cell('A')], rows: [] }),
    table({ sheetName: 'Sales', header: [cell('A')], rows: [] }),
    table({ sheetName: 'Sales', header: [cell('A')], rows: [] }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Sales', 'Sales (2)', 'Sales (3)']);
});

test('an illegal-charset hint is sanitized defensively', async () => {
  const buffer = await toXlsx([
    table({ sheetName: 'a[b]c:d*e?f/g\\h', header: [cell('A')], rows: [] }),
  ]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['abcdefgh']);
});

test('a hint longer than 31 characters is truncated', async () => {
  const long = 'x'.repeat(40);
  const buffer = await toXlsx([table({ sheetName: long, header: [cell('A')], rows: [] })]);

  const workbook = await readBack(buffer);
  expect(workbook.worksheets[0].name).toBe('x'.repeat(31));
});

test('the header row is written bold', async () => {
  const buffer = await toXlsx([
    table({ sheetName: 'S', header: [cell('Region'), cell('Total')], rows: [[cell('N'), cell(1)]] }),
  ]);

  const workbook = await readBack(buffer);
  const sheet = workbook.getWorksheet('S');
  const headerRow = sheet.getRow(1);
  expect(headerRow.getCell(1).value).toBe('Region');
  expect(headerRow.getCell(1).font.bold).toBe(true);
  // Data rows are not bold.
  expect(sheet.getRow(2).getCell(1).font?.bold ?? false).toBe(false);
});

test('a numeric value round-trips as a number cell', async () => {
  const buffer = await toXlsx([
    table({ sheetName: 'S', header: [cell('Amount')], rows: [[cell(1234.5)]] }),
  ]);

  const workbook = await readBack(buffer);
  const value = workbook.getWorksheet('S').getRow(2).getCell(1).value;
  expect(typeof value).toBe('number');
  expect(value).toBe(1234.5);
});

test('a date value round-trips as a date cell', async () => {
  const date = new Date('2026-03-15T00:00:00.000Z');
  const buffer = await toXlsx([
    table({ sheetName: 'S', header: [cell('When')], rows: [[cell(date)]] }),
  ]);

  const workbook = await readBack(buffer);
  const value = workbook.getWorksheet('S').getRow(2).getCell(1).value;
  expect(value instanceof Date).toBe(true);
  expect(value.getTime()).toBe(date.getTime());
});

test('strings and booleans keep their type', async () => {
  const buffer = await toXlsx([
    table({ sheetName: 'S', header: [cell('Name'), cell('Active')], rows: [[cell('Ann'), cell(true)]] }),
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
    table({
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

test('zero tables throws a ConfigError rather than emitting an empty workbook', async () => {
  await expect(toXlsx([heading({ text: 'No tables here', level: 1 })])).rejects.toThrow(
    ConfigError
  );
  await expect(toXlsx([])).rejects.toThrow('no tables to export');
});

test('returns a Buffer of a valid xlsx workbook', async () => {
  const buffer = await toXlsx([table({ sheetName: 'S', header: [cell('A')], rows: [] })]);
  expect(Buffer.isBuffer(buffer)).toBe(true);
  // The xlsx container is a zip; it starts with the PK signature.
  expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
});
