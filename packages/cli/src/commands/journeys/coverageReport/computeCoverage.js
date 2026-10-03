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

import { getStepKey, isBackedBy, journeySequence, stepIdentity } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

const REACHED_NOTE =
  'Reached, not asserted: a journey reaches the failing interaction. Asserted failure coverage needs journey recordings.';

function compareText(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function entryKey({ page, identity }) {
  return `${page} ${identity}`;
}

function measure({ covered, total, uncovered }) {
  return {
    covered,
    total,
    share: total === 0 ? 0 : Math.round((covered / total) * 100) / 100,
    uncovered: uncovered.sort((a, b) => b.count - a.count || compareText(a.key, b.key)),
  };
}

// The block a raw block id names once list indices are normalised, as step
// identities compare it.
function normaliseBlockId({ blockId }) {
  return JSON.parse(stepIdentity({ step: { click: { blockId } } }))[1];
}

function measureInteraction({ segments, journeyKeys }) {
  const counts = new Map();
  segments.forEach((segment) => {
    segment.sequence.forEach((entry) => {
      const key = entryKey(entry);
      if (!counts.has(key))
        counts.set(key, { key, page: entry.page, identity: entry.identity, count: 0 });
      counts.get(key).count += 1;
    });
  });
  const entries = [...counts.values()];
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const covered = entries
    .filter((entry) => journeyKeys.has(entry.key))
    .reduce((sum, entry) => sum + entry.count, 0);
  return measure({
    covered,
    total,
    uncovered: entries.filter((entry) => !journeyKeys.has(entry.key)),
  });
}

function measureFlow({ segments, journeys }) {
  const uncoveredByHash = new Map();
  let covered = 0;
  segments.forEach((segment) => {
    const backed = journeys.some((journey) =>
      isBackedBy({
        journeySequence: journey.sequence,
        segmentSequence: segment.sequence,
        pageId: journey.pageId,
      })
    );
    if (backed) {
      covered += 1;
      return;
    }
    if (!uncoveredByHash.has(segment.hash)) {
      uncoveredByHash.set(segment.hash, {
        key: segment.hash,
        hash: segment.hash,
        page: segment.page_id,
        count: 0,
        sequence: segment.sequence,
      });
    }
    uncoveredByHash.get(segment.hash).count += 1;
  });
  return measure({ covered, total: segments.length, uncovered: [...uncoveredByHash.values()] });
}

// Static coverage can only say a journey reaches a failure: it does the
// interaction that failed (the failing segment ends at it), visits the page an
// unpaired failure ran on, or, for an app failure, loads the app at all.
function isFailureReached({ path, segments, journeys, journeyKeys }) {
  if (journeys.length === 0) return false;
  if (path.page === 'app') return true;
  const failing = segments.filter(
    (segment) =>
      segment.failure_path?.page === path.page &&
      segment.failure_path?.block_id === path.block_id &&
      segment.failure_path?.event === path.event
  );
  if (failing.some((segment) => segment.failure_path.interaction === true)) {
    return failing.some((segment) => {
      const last = segment.sequence[segment.sequence.length - 1];
      return !type.isUndefined(last) && journeyKeys.has(entryKey(last));
    });
  }
  return journeys.some(
    (journey) =>
      journey.pageId === path.page || journey.sequence.some((entry) => entry.page === path.page)
  );
}

function measureFailure({ profile, segments, journeys, journeyKeys }) {
  const uncovered = [];
  let covered = 0;
  profile.failurePaths.forEach((path) => {
    if (isFailureReached({ path, segments, journeys, journeyKeys })) {
      covered += 1;
      return;
    }
    uncovered.push({ ...path, count: path.persons });
  });
  return {
    mode: 'reached',
    note: REACHED_NOTE,
    ...measure({ covered, total: profile.failurePaths.length, uncovered }),
  };
}

// Clicks with the page each one runs on and whether an `expect` follows it.
function readClicks({ journey }) {
  const clicks = [];
  journey.steps.forEach((step, index) => {
    if (getStepKey(step) !== 'click') return;
    const sequence = journeySequence({
      pageId: journey.pageId,
      steps: journey.steps.slice(0, index + 1),
    });
    const page = sequence[sequence.length - 1]?.page ?? journey.pageId;
    const [, blockId, , text] = JSON.parse(stepIdentity({ step }));
    const next = journey.steps[index + 1];
    clicks.push({
      page,
      blockId,
      text,
      asserted: !type.isUndefined(next) && getStepKey(next) === 'expect',
    });
  });
  return clicks;
}

function measureFrustration({ profile, journeys }) {
  const clicks = journeys.flatMap((journey) => readClicks({ journey: journey.journey }));
  const uncovered = [];
  let covered = 0;
  profile.frustration.forEach((pair) => {
    const blockId = type.isNone(pair.block_id)
      ? null
      : normaliseBlockId({ blockId: pair.block_id });
    const hit = clicks.some(
      (click) =>
        click.asserted &&
        click.page === pair.page &&
        (type.isNone(blockId) ? click.text === pair.text : click.blockId === blockId)
    );
    if (hit) {
      covered += 1;
      return;
    }
    uncovered.push({ ...pair, count: pair.rage + pair.dead });
  });
  return measure({ covered, total: profile.frustration.length, uncovered });
}

// The role set a journey runs as: its inline user's roles, or signed out
// when it has no user. `user: none` signs in through the app, so its roles
// are not known statically. Named data-set users replace this when data sets
// ship.
function journeyRoles({ journey }) {
  if (type.isNone(journey.user)) return [];
  if (!type.isObject(journey.user)) return undefined;
  return [...(journey.user.roles ?? [])].sort();
}

function measureRole({ profile, journeys }) {
  const uncovered = [];
  let covered = 0;
  profile.roleMatrix.forEach((pair) => {
    const roles = JSON.stringify(pair.roles);
    const hit = journeys.some((journey) => {
      const visits =
        journey.pageId === pair.page || journey.sequence.some((entry) => entry.page === pair.page);
      const runsAs = journeyRoles({ journey: journey.journey });
      return visits && !type.isUndefined(runsAs) && JSON.stringify(runsAs) === roles;
    });
    if (hit) {
      covered += 1;
      return;
    }
    uncovered.push({ key: `${pair.page} ${roles}`, ...pair, count: pair.sessions });
  });
  return measure({ covered, total: profile.roleMatrix.length, uncovered });
}

// Which real use no committed journey covers yet, measured five ways over the
// production window, each with its uncovered list ranked by use (count, then
// key). `journeys` are [{ file, name, pageId, sequence, journey }].
function computeCoverage({ journeys, segments, profile }) {
  const journeyKeys = new Set(journeys.flatMap((journey) => journey.sequence.map(entryKey)));
  return {
    interaction: measureInteraction({ segments, journeyKeys }),
    flow: measureFlow({ segments, journeys }),
    failure: measureFailure({ profile, segments, journeys, journeyKeys }),
    frustration: measureFrustration({ profile, journeys }),
    role: measureRole({ profile, journeys }),
  };
}

export default computeCoverage;
