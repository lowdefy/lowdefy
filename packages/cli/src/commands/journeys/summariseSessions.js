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

import { compileTrace } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import { sequenceKey } from './readTestRunKeys.js';

function distinct(values) {
  return [...new Set(values.filter((value) => type.isString(value) && value !== ''))].sort();
}

// The pages a session moved through, in order, from its pageviews (or the
// pages its records ran on when it has none), with repeats in a row merged.
function pageSequence(records) {
  const pageviews = records.filter((record) => record.kind === 'pageview');
  const pages = (pageviews.length > 0 ? pageviews : records).map((record) => record.page_id);
  return pages.filter((page, index) => type.isString(page) && page !== pages[index - 1]);
}

function findFirstFailure(records) {
  for (const record of records) {
    const events = [record.event, ...(record.also ?? [])];
    const failed = events.find((event) => type.isObject(event) && event.success === false);
    if (!type.isUndefined(failed)) {
      return {
        block_id: failed.block_id,
        action_type: failed.error?.action_type ?? null,
        invalid_blocks: failed.invalid_blocks ?? [],
      };
    }
  }
  return null;
}

// One summary per recorded dev session, newest first: when it ran, against
// which builds, the pages it moved through, its attempts (the segments the
// compiler cuts) and how many ended in a failed event, and how many of its
// interactions the newest test run also drove (null when there is none).
// `routeTable` is the build's routes (loadRouteTable).
function summariseSessions({ records, routeTable, testKeys, hasTestRun }) {
  const bySession = new Map();
  records.forEach((record) => {
    if (!type.isString(record?.session)) return;
    if (!bySession.has(record.session)) bySession.set(record.session, []);
    bySession.get(record.session).push(record);
  });
  const sessions = [...bySession.entries()].map(([id, sessionRecords]) => {
    const sorted = [...sessionRecords].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    const { segments } = compileTrace({ records: sorted, routeTable, source: 'dev' });
    const sequence = segments.flatMap((segment) => segment.sequence);
    return {
      id,
      start: sorted[0].t,
      end: sorted[sorted.length - 1].t,
      builds: distinct(sorted.map((record) => record.build)),
      pages: pageSequence(sorted),
      attempts: segments.length,
      failed: segments.filter((segment) => !type.isUndefined(segment.failure)).length,
      firstFailure: findFirstFailure(sorted),
      covered: hasTestRun
        ? sequence.filter((step) => testKeys.has(sequenceKey(step))).length
        : null,
      total: sequence.length,
    };
  });
  return sessions.sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
}

export default summariseSessions;
