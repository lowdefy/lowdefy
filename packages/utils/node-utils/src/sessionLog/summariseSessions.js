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

import { type } from '@lowdefy/helpers';

import foldInteractions from '../journeyCompiler/foldInteractions.js';
import normaliseRecords from '../journeyCompiler/normaliseRecords.js';
import segmentSession from '../journeyCompiler/segmentSession.js';

function distinct(values) {
  return [...new Set(values.filter((value) => type.isString(value) && value !== ''))].sort();
}

// The pages a session moved through, in order, from its pageviews (or the
// pages its records ran on when it has none), with repeats in a row merged.
function pageSequence(records) {
  const pageviews = records.filter((record) => record.kind === 'pageview');
  const pages = (pageviews.length > 0 ? pageviews : records).map((record) => record.page_id);
  return pages.filter((page, index) => page !== pages[index - 1]);
}

function failedEvent(record) {
  return [record.event, ...(record.also ?? [])].find(
    (event) => type.isObject(event) && event.success === false
  );
}

// What a person did, as the log counts lines: a printable character typed into
// a field is part of its change record, not an interaction of its own.
function isInteraction(record) {
  if (record.kind === 'key') return record.key.length > 1;
  return ['click', 'change', 'back'].includes(record.kind);
}

function describeFirstFailure(records) {
  const record = records.find((candidate) => !type.isUndefined(failedEvent(candidate)));
  if (type.isUndefined(record)) return null;
  const event = failedEvent(record);
  return {
    block_id: event.block_id,
    action_type: event.error?.action_type ?? null,
    invalid_blocks: event.invalid_blocks ?? [],
  };
}

// One summary per session in the records, newest first, for choosing which
// session's log to read: when it ran, against which builds, the pages it moved
// through, how many interactions it holds and how many ended in a failed
// event, with the first failure named. Counts are over the records folded as
// the session log folds them.
function summariseSessions({ records }) {
  const { sessions } = normaliseRecords({ records });
  const summaries = sessions.map(({ session, records: sorted }) => {
    const folded = segmentSession({ records: sorted }).flatMap((segment) =>
      foldInteractions({ records: segment })
    );
    return {
      id: session,
      start: sorted[0].t,
      end: sorted[sorted.length - 1].t,
      builds: distinct(sorted.map((record) => record.build)),
      pages: pageSequence(sorted),
      interactions: folded.filter(isInteraction).length,
      failures: folded.filter((record) => !type.isUndefined(failedEvent(record))).length,
      firstFailure: describeFirstFailure(folded),
    };
  });
  return summaries.sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
}

export default summariseSessions;
