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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { compileTrace, readRecordings } from '@lowdefy/node-utils';
import renderCandidate from '@lowdefy/node-utils/journeyCompiler/renderCandidate.js';
import { type } from '@lowdefy/helpers';

import explorerCandidatesDirectory from './explorerCandidatesDirectory.js';
import filterSnapshotExpectations from './filterSnapshotExpectations.js';
import loadBlockMetas from '../loadBlockMetas.js';
import loadRouteTable from '../loadRouteTable.js';

const INTERACTIONS = ['click', 'fill', 'select', 'open'];
const EFFECT_STEP = { expect: { effect: true } };

function stepBlockId(step) {
  const kind = INTERACTIONS.find((key) => !type.isUndefined(step[key]));
  if (type.isUndefined(kind)) return null;
  const target = step[kind];
  return type.isString(target) ? target : target?.blockId ?? null;
}

function changedBlocks({ scope, pageId }) {
  const page = scope.pages.find((entry) => entry.pageId === pageId);
  return new Set(
    (page?.blocks ?? [])
      .filter((block) => block.change === 'added' || block.change === 'changed')
      .map((block) => block.blockId)
  );
}

// A head-only run (a charter with no PR, scope.base null) has no diff, so
// every block on a target page is in scope.
function touchesChange({ journey, scope }) {
  if (type.isNone(scope.base)) return true;
  const changed = changedBlocks({ scope, pageId: journey.pageId });
  return journey.steps.some((step) => changed.has(stepBlockId(step)));
}

// The findings a failing journey can prove: app errors (at a step or at
// open), role refusals and dead clicks. An environment finding is the data
// set's store, not the app.
function isProvable(finding) {
  return finding.severity === 'error' || finding.kind === 'dead-click';
}

function isOpenFinding(finding) {
  return type.isNone(finding.step);
}

// Each provable finding key with the walk that hit it first, in walk order.
function firstWalkByKey({ logs }) {
  const byKey = new Map();
  logs.forEach((log) => {
    log.findings.filter(isProvable).forEach((finding) => {
      if (!byKey.has(finding.key)) byKey.set(finding.key, { finding, log });
    });
  });
  return byKey;
}

// Two keys can compile to the same steps (two errors of one click), so each
// finding candidate's file name carries its key.
function findingFileName({ base, key }) {
  const keyHash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 8);
  return `${base}-${keyHash}.yaml`;
}

function safePageId(pageId) {
  return pageId.replace(/[^A-Za-z0-9_-]/g, '-');
}

// The journey header the proof and the regression test start from: the
// walk's data set, fresh for every run, and its data set user. Without a
// data set user the compiler's user (the walk's roles) stays.
function withWalkHeader({ journey, dataName, log }) {
  const { name, pageId, urlQuery, user, steps } = journey;
  const header = { name, pageId };
  if (!type.isUndefined(urlQuery)) header.urlQuery = urlQuery;
  if (!type.isNone(dataName)) header.data = dataName;
  const walkUser = type.isNone(log.user) ? user : log.user;
  if (!type.isUndefined(walkUser)) header.user = walkUser;
  return { ...header, steps };
}

// The interaction the dead click's walk step sent, by its log entry.
function deadClickBlockId({ log, finding }) {
  const step = log.steps.find((entry) => entry.index === finding.step);
  return type.isUndefined(step?.step?.click) ? null : stepBlockId(step.step);
}

// The dead click's records end where the walk's next step started (the run's
// end when it was the last step), so the compiled journey ends on that click.
function deadClickUntil({ log, finding }) {
  const next = log.steps.find((entry) => entry.index === finding.step + 1);
  if (type.isUndefined(next?.startedAt)) return undefined;
  return Date.parse(next.startedAt) - 1;
}

function endsOnClick({ journey, blockId }) {
  const last = journey.steps[journey.steps.length - 1];
  return !type.isUndefined(last?.click) && stepBlockId(last) === blockId;
}

function endsOnEffect(journey) {
  return journey.steps[journey.steps.length - 1]?.expect?.effect === true;
}

function writeFile({ outDirectory, fileName, contents }) {
  fs.mkdirSync(outDirectory, { recursive: true });
  const filePath = path.join(outDirectory, fileName);
  fs.writeFileSync(filePath, contents);
  return filePath;
}

// Compiles the run's recorded walks into candidate journeys under the run's
// own directory, tests/journeys/_candidates/explorer/<run>/, never reading
// or rewriting another run's. Records of a walk with a provable finding
// (an app error, a role refusal, a dead click) compile into findings/: one
// candidate per finding key, from the first walk that hit it, carrying the
// walk's data set and data set user so a run of it starts on a fresh copy of
// the data the walk failed on. If the walk's records split into segments, the
// finding is in the last one, and only that one is compiled. The explorer
// adds one assertion by a fixed rule and nothing else: a dead click is cut
// where the walk's next step started and ends in expect: { effect: true }
// (no candidate unless the compiled journey ends on a click on the dead
// block), and a finding at open, which the compiler makes no steps from, is
// written directly as the one step expect: { visible: <pageId> }. The other
// walks compile into the run directory as coverage candidates, kept only when
// they interact with a block the page's diff lists as added or changed, or
// always on a head-only run. On a snapshot data set, expectations holding
// snapshot values are dropped. Each origin gains explorer: { run, pr, walks,
// finding? }, finding being { key, kind, message, source }. Returns
// { finding: [{ key, path }], coverage: [paths], droppedExpectations }: a
// finding with no candidate is left out of finding, and proveFindings reports
// it as no-candidate.
function compileWalks({
  configDirectory,
  run,
  pr,
  scope,
  buildDirectory,
  logs,
  dataName,
  snapshot,
  knownTextFor,
}) {
  const records = readRecordings({ configDirectory, source: 'explorer', run });
  const walkBySession = new Map(
    records
      .filter((record) => type.isString(record.session) && type.isString(record.run?.journey))
      .map((record) => [record.session, record.run.journey])
  );
  const blockMetas = loadBlockMetas({ buildDirectory });
  const routeTable = loadRouteTable({ buildDirectory });
  const runDirectory = path.join(explorerCandidatesDirectory({ configDirectory }), run);
  const findingsDirectory = path.join(runDirectory, 'findings');
  let droppedExpectations = 0;

  function filterSnapshot({ journey, comments }) {
    if (!snapshot) return { journey, comments, dropped: 0 };
    return filterSnapshotExpectations({
      journey,
      comments,
      knownTextFor: ({ typed }) => knownTextFor({ pageIds: [journey.pageId], typed }),
    });
  }

  function explorerOrigin({ walks, finding }) {
    const explorer = { run, pr: pr?.number ?? null, walks };
    if (!type.isUndefined(finding)) {
      explorer.finding = {
        key: finding.key,
        kind: finding.kind,
        message: finding.message,
        source: finding.source ?? null,
      };
    }
    return explorer;
  }

  function writeOpenCandidate({ finding, log }) {
    const journey = withWalkHeader({
      journey: {
        name: `${log.pageId} explorer ${finding.kind} at open`,
        pageId: log.pageId,
        steps: [{ expect: { visible: log.pageId } }],
      },
      dataName,
      log,
    });
    const origin = { source: 'explorer', explorer: explorerOrigin({ walks: [log.walk], finding }) };
    return writeFile({
      outDirectory: findingsDirectory,
      fileName: findingFileName({ base: `${safePageId(log.pageId)}-open`, key: finding.key }),
      contents: renderCandidate({ comments: new Map(), journey, origin }),
    });
  }

  // One finding key's candidate, compiled from its walk's records alone.
  // Returns the file written, or null when the compile produced none.
  function writeStepCandidate({ finding, log }) {
    const deadBlockId = finding.kind === 'dead-click' ? deadClickBlockId({ log, finding }) : null;
    const until = finding.kind === 'dead-click' ? deadClickUntil({ log, finding }) : undefined;
    const droppedByHash = new Map();
    const { candidates, segments } = compileTrace({
      records: records.filter((record) => record.run?.journey === log.walk),
      blockMetas,
      routeTable,
      source: 'explorer',
      filters: { until },
      prepareCandidate: ({ journey, origin, comments }) => {
        const filtered = filterSnapshot({ journey, comments });
        const withHeader = withWalkHeader({ journey: filtered.journey, dataName, log });
        const endsOnDeadClick =
          deadBlockId !== null && endsOnClick({ journey: withHeader, blockId: deadBlockId });
        droppedByHash.set(origin.sequence_hash, filtered.dropped);
        return {
          journey: endsOnDeadClick
            ? { ...withHeader, steps: [...withHeader.steps, EFFECT_STEP] }
            : withHeader,
          comments: filtered.comments,
          origin: { ...origin, explorer: explorerOrigin({ walks: [log.walk], finding }) },
        };
      },
    });
    const last = segments.reduce(
      (latest, segment) =>
        latest === null || segment.last_seen >= latest.last_seen ? segment : latest,
      null
    );
    const candidate = candidates.find((entry) => entry.hash === last?.hash);
    if (type.isUndefined(candidate)) return null;
    if (finding.kind === 'dead-click' && !endsOnEffect(candidate.journey)) return null;
    droppedExpectations += droppedByHash.get(candidate.hash) ?? 0;
    return writeFile({
      outDirectory: findingsDirectory,
      fileName: findingFileName({
        base: candidate.fileName.replace(/\.yaml$/, ''),
        key: finding.key,
      }),
      contents: candidate.contents,
    });
  }

  const findingCandidates = [];
  firstWalkByKey({ logs }).forEach(({ finding, log }, key) => {
    const filePath = isOpenFinding(finding)
      ? writeOpenCandidate({ finding, log })
      : writeStepCandidate({ finding, log });
    if (filePath === null) return;
    findingCandidates.push({ key, path: filePath });
  });

  const findingWalks = new Set(
    logs.filter((log) => log.findings.some(isProvable)).map((log) => log.walk)
  );
  const { candidates: coverageCandidates } = compileTrace({
    records: records.filter((record) => !findingWalks.has(record.run?.journey)),
    blockMetas,
    routeTable,
    source: 'explorer',
    prepareCandidate: ({ journey, origin, comments, sessions }) => {
      if (!touchesChange({ journey, scope })) return null;
      const walks = [...new Set(sessions.map((session) => walkBySession.get(session)))]
        .filter((walk) => type.isString(walk))
        .sort();
      const filtered = filterSnapshot({ journey, comments });
      droppedExpectations += filtered.dropped;
      return {
        journey: filtered.journey,
        comments: filtered.comments,
        origin: { ...origin, explorer: explorerOrigin({ walks }) },
      };
    },
  });
  const coverage = coverageCandidates.map((candidate) =>
    writeFile({
      outDirectory: runDirectory,
      fileName: candidate.fileName,
      contents: candidate.contents,
    })
  );

  return { finding: findingCandidates, coverage, droppedExpectations };
}

export default compileWalks;
