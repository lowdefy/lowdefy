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

const TOP_FLOWS_PER_PAGE = 20;

function round2(value) {
  return Math.round(value * 100) / 100;
}

function compareText(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function distinctCount(values) {
  return new Set(values.filter((value) => !type.isNone(value))).size;
}

function groupBy({ items, keyOf }) {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return groups;
}

// Clusters by sequence hash, as the compiler clusters candidates, so a flow
// here carries the counts its candidate's origin does. `share` is of the
// segments entering on the same page.
function rankFlows({ segments }) {
  const entering = groupBy({ items: segments, keyOf: (segment) => segment.page_id });
  const flows = [...groupBy({ items: segments, keyOf: (segment) => segment.hash }).entries()].map(
    ([hash, members]) => {
      const page = members[0].page_id;
      return {
        hash,
        page,
        sessions: members.length,
        persons: distinctCount(members.flatMap((segment) => segment.persons)),
        orgs: distinctCount(members.flatMap((segment) => segment.orgs)),
        failures: members.filter((segment) => !type.isUndefined(segment.failure)).length,
        share: round2(members.length / entering.get(page).length),
        sequence: members[0].sequence,
      };
    }
  );
  const byPage = groupBy({ items: flows, keyOf: (flow) => flow.page });
  return [...byPage.keys()].sort(compareText).flatMap((page) =>
    byPage
      .get(page)
      .sort(
        (a, b) => b.sessions - a.sessions || b.persons - a.persons || compareText(a.hash, b.hash)
      )
      .slice(0, TOP_FLOWS_PER_PAGE)
  );
}

function failureKey({ path }) {
  const event =
    path.page === 'app' ? `app.${path.event}` : `${path.page}.${path.block_id}.${path.event}`;
  return path.invalid_blocks.length === 0 ? event : `${event} [${path.invalid_blocks.join(', ')}]`;
}

function rankFailurePaths({ segments }) {
  const failing = segments.filter((segment) => !type.isUndefined(segment.failure_path));
  const groups = groupBy({
    items: failing,
    keyOf: (segment) => failureKey({ path: segment.failure_path }),
  });
  return [...groups.entries()]
    .map(([key, members]) => ({
      key,
      page: members[0].failure_path.page,
      block_id: members[0].failure_path.block_id,
      event: members[0].failure_path.event,
      invalid_blocks: members[0].failure_path.invalid_blocks,
      persons: distinctCount(members.flatMap((segment) => segment.persons)),
      sessions: distinctCount(members.map((segment) => segment.session)),
    }))
    .sort((a, b) => b.persons - a.persons || b.sessions - a.sessions || compareText(a.key, b.key));
}

function rankFrustration({ segments }) {
  const groups = new Map();
  segments.forEach((segment) => {
    (segment.frustrations ?? []).forEach((entry) => {
      const block = entry.block_id ?? entry.text;
      const key = `${entry.page}.${block}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          page: entry.page,
          block_id: entry.block_id,
          text: entry.text,
          rage: 0,
          dead: 0,
        });
      }
      groups.get(key)[entry.kind] += 1;
    });
  });
  return [...groups.values()].sort(
    (a, b) => b.rage + b.dead - (a.rage + a.dead) || compareText(a.key, b.key)
  );
}

// Signed-out (no roles before identify) reads as the empty role set.
function roleSetOf({ segment }) {
  return [...(segment.roles ?? [])].sort();
}

function buildRoleMatrix({ segments }) {
  const groups = new Map();
  segments.forEach((segment) => {
    const roles = roleSetOf({ segment });
    (segment.pages ?? [segment.page_id]).forEach((page) => {
      const key = JSON.stringify([page, roles]);
      if (!groups.has(key)) groups.set(key, { page, roles, members: [] });
      groups.get(key).members.push(segment);
    });
  });
  return [...groups.values()]
    .map(({ page, roles, members }) => ({
      page,
      roles,
      sessions: distinctCount(members.map((segment) => segment.session)),
      persons: distinctCount(members.flatMap((segment) => segment.persons)),
    }))
    .sort(
      (a, b) =>
        compareText(a.page, b.page) ||
        b.sessions - a.sessions ||
        compareText(JSON.stringify(a.roles), JSON.stringify(b.roles))
    );
}

// The page each tab session started on: the page of its earliest segment.
function countEntryPoints({ segments }) {
  const firstBySession = new Map();
  segments.forEach((segment) => {
    const first = firstBySession.get(segment.session);
    if (type.isUndefined(first) || segment.first_seen < first.first_seen) {
      firstBySession.set(segment.session, segment);
    }
  });
  const counts = new Map();
  firstBySession.forEach((segment) => {
    counts.set(segment.page_id, (counts.get(segment.page_id) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([page, sessions]) => ({ page, sessions }))
    .sort((a, b) => b.sessions - a.sessions || compareText(a.page, b.page));
}

// What production use looks like, computed once from the segments
// compileTrace returns: ranked flows per entry page, failure paths, frustrated
// blocks, the role sets seen per page, and the pages tab sessions start on.
// Coverage writes it to coverage.json, which the explorer and variants read,
// so production is profiled in one place. Every list is sorted, ties broken
// by key, so the same segments give the same profile.
function profileProduction({ segments }) {
  return {
    flows: rankFlows({ segments }),
    failurePaths: rankFailurePaths({ segments }),
    frustration: rankFrustration({ segments }),
    roleMatrix: buildRoleMatrix({ segments }),
    entryPoints: countEntryPoints({ segments }),
  };
}

export default profileProduction;
