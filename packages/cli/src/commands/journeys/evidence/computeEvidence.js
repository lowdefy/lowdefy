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

import { isBackedBy, journeySequence } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import measuredJourney from '../../test/measuredJourney.js';
import isCountedFlow from './isCountedFlow.js';
import mergeMonths from './mergeMonths.js';
import parseFlowLines from './parseFlowLines.js';
import reconcileFlows from './reconcileFlows.js';

// The subkeys a journey file commits. Dev recordings are a rolling count that
// differs by machine, so `dev` is counted for the summary only and an existing
// `dev` is removed on refresh.
const SUBKEYS = ['production', 'explorer', 'mutation'];

function distinctCount(values) {
  return new Set(values.filter((value) => !type.isNone(value))).size;
}

function backingSegments({ pageId, sequence, segments }) {
  return segments.filter((segment) =>
    isBackedBy({
      journeySequence: sequence,
      segmentSequence: segment.sequence,
      pageId,
    })
  );
}

function segmentMonth({ segment }) {
  return new Date(segment.first_seen).toISOString().slice(0, 7);
}

// The segments of each month read, by the UTC month each one started in, so a
// segment that crosses midnight at a month boundary counts once, whole.
// Segments that started in a month not read (the neighbouring days read for
// context) are dropped. Every month read has an entry, empty or not.
function bucketByMonth({ months, segments }) {
  const byMonth = new Map(months.map((month) => [month, []]));
  segments.forEach((segment) => {
    byMonth.get(segmentMonth({ segment }))?.push(segment);
  });
  return byMonth;
}

// One month entry per month read, written even when nothing backed the flow,
// so a month pulled and unused reads differently from one never pulled. The
// flow's lines were written by the config text rule (flowLines), so a
// journey's non-config click text is matched as no text.
function countMonths({ entry, segmentsByMonth, dayCounts }) {
  const sequence = parseFlowLines({ flow: entry.flow });
  return [...segmentsByMonth.entries()].map(([month, segments]) => {
    const backing = backingSegments({ pageId: entry.pageId, sequence, segments });
    return {
      month,
      days: dayCounts[month],
      sessions: backing.length,
      persons: distinctCount(backing.flatMap((segment) => segment.persons)),
      orgs: distinctCount(backing.flatMap((segment) => segment.orgs)),
      failures: backing.filter((segment) => !type.isUndefined(segment.failure)).length,
    };
  });
}

function countFlow({ entry, segmentsByMonth, dayCounts, recount = false }) {
  return mergeMonths({
    committed: entry.months,
    counted: countMonths({ entry, segmentsByMonth, dayCounts }),
    recount,
  });
}

// Dev segments hold the developer's own text: they are read by the same rule
// as the journeys they back, so non-config text on both sides reads as none.
function readDevSequences({ segments, routeTable, isConfigText }) {
  return segments.map((segment) => ({
    ...segment,
    sequence: journeySequence({
      pageId: segment.page_id,
      steps: segment.steps,
      routeTable,
      isConfigText,
    }),
  }));
}

function productionEvidence({
  journey,
  segmentsByMonth,
  dayCounts,
  today,
  routeTable,
  isConfigText,
}) {
  const { live, deprecated, recount } = reconcileFlows({
    journey,
    today,
    routeTable,
    isConfigText,
  });
  const production = {
    sequence: live.sequence,
    pageId: live.pageId,
    flow: live.flow,
    months: countFlow({ entry: live, segmentsByMonth, dayCounts, recount }),
  };
  if (deprecated.length > 0) {
    production.deprecated = deprecated.map((entry) => {
      if (!isCountedFlow({ entry })) return entry;
      return { ...entry, months: countFlow({ entry, segmentsByMonth, dayCounts }) };
    });
  }
  return production;
}

function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// What each committed journey's evidence becomes. A subkey is computed only
// from a source this machine has; one whose source is absent keeps its
// committed value, so a laptop without a mutation report does not erase a
// colleague's scores, and no subkey is invented. `refreshed` moves only when
// some subkey changed or a committed `dev` is removed, so a no-op refresh
// changes no file. `devRecordings` is the local dev count, for the summary,
// never written.
//
// - journeys: [{ filePath, journeyIndex, journey }]
// - sources: { production?: { dayCounts, months, segments }, dev?: { segments },
//   mutation?: readMutationReport's result }
//   `production.dayCounts` is { 'YYYY-MM': final days cached }, `months` the
//   months read (selectMonthsToRead) and `segments` their compiled segments.
//   `devRecordings` counts the dev segments that back the journey. A
//   mutation report sets `mutation` for the journeys it names only.
// - routeTable: the build's routes the segments' sequences were read with,
//   which journeys and dev segments are read with too.
// - isConfigText: the app's config text rule; journey click text, and dev
//   segment text, count only when it is config text, and the sequence id and
//   flow lines read journeys the same way.
function computeEvidence({ journeys, sources, routeTable, today, isConfigText }) {
  const segmentsByMonth = type.isNone(sources.production)
    ? undefined
    : bucketByMonth(sources.production);
  const devSegments = type.isNone(sources.dev)
    ? null
    : readDevSequences({ segments: sources.dev.segments, routeTable, isConfigText });
  return journeys.map(({ filePath, file, journeyIndex, journey }) => {
    const before = journey.evidence;
    const computed = {};
    let devRecordings;
    if (!type.isNone(sources.production)) {
      computed.production = productionEvidence({
        journey,
        segmentsByMonth,
        dayCounts: sources.production.dayCounts,
        today,
        routeTable,
        isConfigText,
      });
    }
    if (!type.isNone(devSegments)) {
      devRecordings = backingSegments({
        pageId: journey.pageId,
        sequence: journeySequence({
          pageId: journey.pageId,
          steps: journey.steps,
          routeTable,
          isConfigText,
        }),
        segments: devSegments,
      }).length;
    }
    const mutation = sources.mutation?.byJourney.get(
      `${file}#${measuredJourney({ journey }).name}`
    );
    if (!type.isUndefined(mutation)) {
      computed.mutation = mutation;
    }
    const after = {};
    SUBKEYS.forEach((key) => {
      const value = key in computed ? computed[key] : before?.[key];
      if (!type.isUndefined(value)) after[key] = value;
    });
    const changed =
      SUBKEYS.some((key) => !isEqual(before?.[key], after[key])) || !type.isUndefined(before?.dev);
    if (changed) {
      after.refreshed = today;
    } else if (!type.isUndefined(before?.refreshed)) {
      after.refreshed = before.refreshed;
    }
    return {
      filePath,
      file,
      journeyIndex,
      name: journey.name,
      pageId: journey.pageId,
      before,
      after,
      changed,
      devRecordings,
    };
  });
}

export default computeEvidence;
