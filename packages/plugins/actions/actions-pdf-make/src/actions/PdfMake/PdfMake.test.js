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

import { beforeEach, expect, test, vi } from 'vitest';

const download = vi.fn(() => Promise.resolve());
const pdfMake = {
  addVirtualFileSystem: vi.fn(),
  createPdf: vi.fn(() => ({ download })),
  setFonts: vi.fn(),
  setTableLayouts: vi.fn(),
};

vi.doMock('pdfmake/build/pdfmake.js', () => ({ default: pdfMake }));

const roboto = {
  normal: 'Roboto-Regular.ttf',
  bold: 'Roboto-Medium.ttf',
  italics: 'Roboto-Italic.ttf',
  bolditalics: 'Roboto-MediumItalic.ttf',
};

beforeEach(() => {
  download.mockImplementation(() => Promise.resolve());
});

test('PdfMake registers the bundled Roboto files in the virtual file system once on import', async () => {
  vi.resetModules();
  pdfMake.addVirtualFileSystem.mockClear();
  await import('./PdfMake.js');
  expect(pdfMake.addVirtualFileSystem).toHaveBeenCalledTimes(1);
  expect(Object.keys(pdfMake.addVirtualFileSystem.mock.calls[0][0]).sort()).toEqual([
    'Roboto-Italic.ttf',
    'Roboto-Medium.ttf',
    'Roboto-MediumItalic.ttf',
    'Roboto-Regular.ttf',
  ]);
});

test('PdfMake creates the document and downloads it with the filename', async () => {
  const { default: PdfMake } = await import('./PdfMake.js');
  const docDefinition = { content: ['Hello'] };
  await PdfMake({ params: { docDefinition, filename: 'file.pdf' } });
  expect(pdfMake.createPdf.mock.calls).toEqual([[docDefinition]]);
  expect(download.mock.calls).toEqual([['file.pdf']]);
});

test('PdfMake sets Roboto and resets table layouts when none are given', async () => {
  const { default: PdfMake } = await import('./PdfMake.js');
  await PdfMake({ params: { docDefinition: { content: [] }, filename: 'file.pdf' } });
  expect(pdfMake.setFonts.mock.calls).toEqual([[{ Roboto: roboto }]]);
  expect(pdfMake.setTableLayouts.mock.calls).toEqual([[{}]]);
});

test('PdfMake adds app fonts beside Roboto and lets them replace it', async () => {
  const { default: PdfMake } = await import('./PdfMake.js');
  const custom = { normal: 'https://example.com/custom.ttf' };
  await PdfMake({
    params: { docDefinition: { content: [] }, filename: 'file.pdf', fonts: { Custom: custom } },
  });
  await PdfMake({
    params: { docDefinition: { content: [] }, filename: 'file.pdf', fonts: { Roboto: custom } },
  });
  expect(pdfMake.setFonts.mock.calls).toEqual([
    [{ Roboto: roboto, Custom: custom }],
    [{ Roboto: custom }],
  ]);
});

test('PdfMake sets the table layouts it is given', async () => {
  const { default: PdfMake } = await import('./PdfMake.js');
  const tableLayouts = { thick: { hLineWidth: () => 2 } };
  await PdfMake({ params: { docDefinition: { content: [] }, filename: 'file.pdf', tableLayouts } });
  expect(pdfMake.setTableLayouts.mock.calls).toEqual([[tableLayouts]]);
});

test('PdfMake passes pageBreakBefore the node lists as arrays without changing the app document', async () => {
  const { default: PdfMake } = await import('./PdfMake.js');
  const pageBreakBefore = vi.fn(() => true);
  const docDefinition = { content: [], pageBreakBefore };
  await PdfMake({ params: { docDefinition, filename: 'file.pdf' } });
  const passed = pdfMake.createPdf.mock.calls[0][0];
  expect(docDefinition.pageBreakBefore).toBe(pageBreakBefore);
  const result = passed.pageBreakBefore(
    { id: 'current' },
    {
      getFollowingNodesOnPage: () => [1],
      getNodesOnNextPage: () => [2],
      getPreviousNodesOnPage: () => [3],
    }
  );
  expect(result).toBe(true);
  expect(pageBreakBefore.mock.calls).toEqual([[{ id: 'current' }, [1], [2], [3]]]);
});

test('PdfMake rejects when pdfmake fails to build the document', async () => {
  const { default: PdfMake } = await import('./PdfMake.js');
  download.mockImplementation(() => Promise.reject(new Error('Font not found.')));
  await expect(
    PdfMake({ params: { docDefinition: { content: [] }, filename: 'file.pdf' } })
  ).rejects.toThrow('Font not found.');
});
