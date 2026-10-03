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

import segmentSession from './segmentSession.js';
import traceRecord from './traceRecord.js';

function pageview({ at, url, ...rest }) {
  return traceRecord({ at, kind: 'pageview', url, ...rest });
}

function kinds(segments) {
  return segments.map((segment) => segment.map((record) => record.kind));
}

test('segmentSession cuts a segment after 5 minutes idle', () => {
  const segments = segmentSession({
    records: [
      pageview({ at: 0, url: '/tickets' }),
      traceRecord({ at: 10, block: 'new' }),
      traceRecord({ at: 311, block: 'new' }),
    ],
  });
  expect(kinds(segments)).toEqual([['pageview', 'click'], ['click']]);
});

test('segmentSession keeps records exactly 5 minutes apart in one segment', () => {
  const segments = segmentSession({
    records: [traceRecord({ at: 0, block: 'a' }), traceRecord({ at: 300, block: 'b' })],
  });
  expect(segments).toHaveLength(1);
});

test('segmentSession cuts a segment at a pageview the segment did not cause', () => {
  const segments = segmentSession({
    records: [
      pageview({ at: 0, url: '/tickets' }),
      traceRecord({ at: 5, kind: 'change', block: 'title', value: 'x' }),
      pageview({ at: 30, url: '/tickets' }),
      traceRecord({ at: 35, block: 'save' }),
    ],
  });
  expect(kinds(segments)).toEqual([
    ['pageview', 'change'],
    ['pageview', 'click'],
  ]);
  expect(segments[1][0].caused).toBeUndefined();
});

test('segmentSession keeps a pageview a click caused through url_after, marked caused', () => {
  const click = traceRecord({
    at: 10,
    block: 'open_orders',
    event: { name: 'onClick', block_id: 'open_orders', success: true, url_after: '/orders?id=o-1' },
  });
  const view = pageview({ at: 30, url: '/orders?id=o-1', page: 'orders' });
  const segments = segmentSession({ records: [pageview({ at: 0, url: '/tickets' }), click, view] });
  expect(segments).toHaveLength(1);
  expect(segments[0][2]).toEqual({ ...view, caused: true });
  expect(view.caused).toBeUndefined();
});

test('segmentSession treats a production click with no event key as the cause of a pageview within 5 s', () => {
  const records = (viewAt) => [
    pageview({ at: 0, url: '/tickets', source: 'production' }),
    traceRecord({ at: 10, block: 'open', source: 'production' }),
    pageview({ at: viewAt, url: '/orders', page: 'orders', source: 'production' }),
  ];
  expect(segmentSession({ records: records(15) })).toHaveLength(1);
  expect(segmentSession({ records: records(16) })).toHaveLength(2);
});

test('segmentSession treats a dev click with event null as the cause of a pageview within 5 s', () => {
  const records = (viewAt) => [
    pageview({ at: 0, url: '/tickets' }),
    traceRecord({ at: 10, block: 'anchor', event: null }),
    pageview({ at: viewAt, url: '/orders', page: 'orders' }),
  ];
  expect(segmentSession({ records: records(15) })[0][2].caused).toBe(true);
  expect(segmentSession({ records: records(16) })).toHaveLength(2);
});

test('segmentSession times a dev click whose url_after still shows the old URL', () => {
  const records = (viewAt) => [
    pageview({ at: 0, url: '/tickets' }),
    traceRecord({
      at: 10,
      block: 'link',
      event: { name: 'onClick', block_id: 'link', success: true, url_after: '/tickets' },
    }),
    pageview({ at: viewAt, url: '/orders', page: 'orders' }),
  ];
  expect(segmentSession({ records: records(14) })).toHaveLength(1);
  expect(segmentSession({ records: records(16) })).toHaveLength(2);
});

test('segmentSession treats the pageview after a back as caused', () => {
  const segments = segmentSession({
    records: [
      pageview({ at: 0, url: '/orders', page: 'orders' }),
      traceRecord({ at: 10, kind: 'back' }),
      pageview({ at: 40, url: '/tickets' }),
    ],
  });
  expect(segments).toHaveLength(1);
  expect(segments[0][2].caused).toBe(true);
});

test('segmentSession looks past engine and pageleave records for the cause', () => {
  const segments = segmentSession({
    records: [
      pageview({ at: 0, url: '/tickets', source: 'production' }),
      traceRecord({ at: 10, block: 'open', source: 'production' }),
      traceRecord({ at: 10.5, kind: 'pageleave', source: 'production' }),
      pageview({ at: 11, url: '/orders', page: 'orders', source: 'production' }),
    ],
  });
  expect(segments).toHaveLength(1);
});
