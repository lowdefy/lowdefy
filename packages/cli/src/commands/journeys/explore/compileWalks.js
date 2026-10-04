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

import fs from 'fs';
import path from 'path';
import { compileTrace, readRecordings } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import filterSnapshotExpectations from './filterSnapshotExpectations.js';
import loadBlockMetas from '../loadBlockMetas.js';

const CANDIDATES_DIRECTORY = path.join('tests', 'journeys', '_candidates', 'explorer');
const INTERACTIONS = ['click', 'fill', 'select', 'open'];

function readExistingCandidates({ outDirectory }) {
  if (!fs.existsSync(outDirectory)) return {};
  return Object.fromEntries(
    fs
      .readdirSync(outDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
      .map((entry) => [entry.name, fs.readFileSync(path.join(outDirectory, entry.name), 'utf8')])
  );
}

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

function touchesChange({ journey, scope }) {
  const changed = changedBlocks({ scope, pageId: journey.pageId });
  return journey.steps.some((step) => changed.has(stepBlockId(step)));
}

function writeCandidates({ outDirectory, candidates }) {
  fs.mkdirSync(outDirectory, { recursive: true });
  return candidates.map((candidate) => {
    const filePath = path.join(outDirectory, candidate.fileName);
    fs.writeFileSync(filePath, candidate.contents);
    return filePath;
  });
}

// Compiles the run's recorded walks into candidate journeys, only through the
// journey compiler: the run's records (one trace file) split by run.journey
// into walks with a confirmed error finding and the rest, each partition
// compiled into its own directory, tests/journeys/_candidates/explorer/
// findings/ and tests/journeys/_candidates/explorer/. A coverage candidate is
// kept only when it interacts with a block the page's diff lists as added or
// changed. On a snapshot data set, expectations holding snapshot values are
// dropped. Each origin gains explorer: { run, pr, walks, finding? }.
// Returns { finding: [paths], coverage: [paths], droppedExpectations }.
function compileWalks({
  configDirectory,
  run,
  pr,
  scope,
  buildDirectory,
  findingsByWalk,
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
  let droppedExpectations = 0;

  function compilePartition({ partition, outDirectory, isFinding }) {
    const { candidates } = compileTrace({
      records: partition,
      blockMetas,
      existingCandidates: readExistingCandidates({ outDirectory }),
      source: 'explorer',
      prepareCandidate: ({ journey, origin, comments, sessions }) => {
        if (!isFinding && !touchesChange({ journey, scope })) return null;
        const walks = [...new Set(sessions.map((session) => walkBySession.get(session)))]
          .filter((walk) => type.isString(walk))
          .sort();
        let prepared = { journey, comments };
        if (snapshot) {
          const filtered = filterSnapshotExpectations({
            journey,
            comments,
            knownTextFor: ({ typed }) => knownTextFor({ pageIds: [journey.pageId], typed }),
          });
          droppedExpectations += filtered.dropped;
          prepared = filtered;
        }
        const explorer = { run, pr: pr?.number ?? null, walks };
        const finding = walks.map((walk) => findingsByWalk.get(walk)).find((entry) => entry);
        if (!type.isUndefined(finding)) {
          explorer.finding = {
            kind: finding.kind,
            message: finding.message,
            source: finding.source,
          };
        }
        return { ...prepared, origin: { ...origin, explorer } };
      },
    });
    return writeCandidates({ outDirectory, candidates });
  }

  const isFindingRecord = (record) => findingsByWalk.has(record.run?.journey);
  return {
    finding: compilePartition({
      partition: records.filter(isFindingRecord),
      outDirectory: path.join(configDirectory, CANDIDATES_DIRECTORY, 'findings'),
      isFinding: true,
    }),
    coverage: compilePartition({
      partition: records.filter((record) => !isFindingRecord(record)),
      outDirectory: path.join(configDirectory, CANDIDATES_DIRECTORY),
      isFinding: false,
    }),
    droppedExpectations,
  };
}

export default compileWalks;
