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

import collectReportOptions from './collectReportOptions.js';

test('returns an empty object when no block carries a report key', () => {
  const pageConfig = {
    blockId: 'page1',
    slots: { content: { blocks: [{ blockId: 'a', type: 'Box' }] } },
  };
  expect(collectReportOptions(pageConfig)).toEqual({});
});

test('collects report options keyed by blockId across nested slots', () => {
  const pageConfig = {
    blockId: 'page1',
    report: { size: 'A4' },
    slots: {
      content: {
        blocks: [
          { blockId: 'grid', type: 'AgGridAlpine', report: { sheetName: 'Sales', exclude: false } },
          {
            blockId: 'card',
            type: 'Card',
            slots: {
              content: {
                blocks: [{ blockId: 'inner', type: 'Box', report: { pageBreakBefore: true } }],
              },
            },
          },
        ],
      },
      header: {
        blocks: [{ blockId: 'secret', type: 'Html', report: { exclude: true } }],
      },
    },
  };

  expect(collectReportOptions(pageConfig)).toEqual({
    page1: { size: 'A4' },
    grid: { sheetName: 'Sales', exclude: false },
    inner: { pageBreakBefore: true },
    secret: { exclude: true },
  });
});

test('ignores a non-object report key and tolerates missing slots', () => {
  const pageConfig = {
    blockId: 'page1',
    report: 'nonsense',
    slots: { content: { blocks: [{ blockId: 'a', type: 'Box' }, null, undefined] } },
  };
  expect(collectReportOptions(pageConfig)).toEqual({});
});
