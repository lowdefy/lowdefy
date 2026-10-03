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

import YAML from 'yaml';

import compileTrace from '../journeyCompiler/compileTrace.js';
import journeySequence from '../journeyCompiler/journeySequence.js';
import traceRecord from '../journeyCompiler/traceRecord.js';
import { blockMetas, traceRecords } from '../journeyCompiler/testTrace.js';
import isBackedBy from './isBackedBy.js';

function entry(page, verb, blockId, text = null) {
  return { page, identity: JSON.stringify([verb, blockId, null, text]) };
}

const segmentSequence = [
  entry('home', 'click', 'open_tickets'),
  entry('tickets', 'fill', 'search'),
  entry('tickets', 'click', 'filter'),
  entry('tickets', 'click', 'assign'),
  entry('tickets', 'click', 'save'),
];

test('isBackedBy backs an in-order subsequence with gaps', () => {
  expect(
    isBackedBy({
      journeySequence: [entry('tickets', 'fill', 'search'), entry('tickets', 'click', 'save')],
      segmentSequence,
      pageId: 'tickets',
    })
  ).toBe(true);
});

test('isBackedBy does not back the same steps in the wrong order', () => {
  expect(
    isBackedBy({
      journeySequence: [entry('tickets', 'click', 'save'), entry('tickets', 'fill', 'search')],
      segmentSequence,
      pageId: 'tickets',
    })
  ).toBe(false);
});

test('isBackedBy starts the match at the segment first entry on the journey page', () => {
  expect(
    isBackedBy({
      journeySequence: [entry('home', 'click', 'open_tickets')],
      segmentSequence,
      pageId: 'tickets',
    })
  ).toBe(false);
  expect(
    isBackedBy({
      journeySequence: [entry('tickets', 'click', 'save')],
      segmentSequence,
      pageId: 'orders',
    })
  ).toBe(false);
});

test('isBackedBy counts a segment that does the journey twice once', () => {
  const journey = [entry('tickets', 'click', 'save')];
  const twice = [...segmentSequence, entry('tickets', 'click', 'save')];
  const segments = [{ sequence: twice }, { sequence: segmentSequence }, { sequence: [] }];
  const backing = segments.filter((segment) =>
    isBackedBy({ journeySequence: journey, segmentSequence: segment.sequence, pageId: 'tickets' })
  );
  expect(backing).toHaveLength(2);
});

test('isBackedBy matches list-indexed blocks across rows', () => {
  const journey = journeySequence({
    pageId: 'reviews',
    steps: [{ click: { blockId: 'groups.0.rows.1.review_button', text: 'Review' } }],
  });
  const segment = journeySequence({
    pageId: 'reviews',
    steps: [{ click: { blockId: 'groups.2.rows.0.review_button', text: 'Review' } }],
  });
  expect(journey[0].identity).toBe('["click","groups.$.rows.$.review_button",null,"Review"]');
  expect(
    isBackedBy({ journeySequence: journey, segmentSequence: segment, pageId: 'reviews' })
  ).toBe(true);
});

test('isBackedBy reads a hand-written journey that follows a Link without expect url as staying on its page', () => {
  const journey = journeySequence({
    pageId: 'home',
    steps: [{ click: 'open_tickets' }, { click: 'save' }],
  });
  expect(journey.map((item) => item.page)).toEqual(['home', 'home']);
  // Production saw the save on the tickets page, so the journey is not credited.
  expect(isBackedBy({ journeySequence: journey, segmentSequence, pageId: 'home' })).toBe(false);
});

test('isBackedBy backs every compiled candidate by the segments it was compiled from', () => {
  const production = [
    traceRecord({ at: 0, session: 'p-1', kind: 'pageview', url: '/tickets', source: 'production' }),
    traceRecord({ at: 1, session: 'p-1', kind: 'change', block: 'title', source: 'production' }),
    traceRecord({ at: 2, session: 'p-1', block: 'save', source: 'production' }),
    traceRecord({ at: 3, session: 'p-1', kind: 'pageview', url: '/ticket', source: 'production' }),
    traceRecord({
      at: 4,
      session: 'p-1',
      block: 'groups.3.rows.1.edit',
      page: 'ticket',
      source: 'production',
    }),
  ];
  const corpora = [
    { records: traceRecords, source: 'dev' },
    { records: production, source: 'production' },
  ];
  corpora.forEach(({ records, source }) => {
    const { candidates, segments } = compileTrace({ records, blockMetas, source });
    expect(segments.length).toBeGreaterThan(0);
    segments.forEach((segment) => {
      const candidate = candidates.find((item) => item.hash === segment.hash);
      const journey = YAML.parse(candidate.contents);
      expect(
        isBackedBy({
          journeySequence: journeySequence({ pageId: journey.pageId, steps: journey.steps }),
          segmentSequence: segment.sequence,
          pageId: journey.pageId,
        })
      ).toBe(true);
    });
  });
});
