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
import { compileTrace } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import loadBlockMetas from './loadBlockMetas.js';
import readBlockTypes from './readBlockTypes.js';
import readTrace from './readTrace.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';

const DEFAULT_OUT = path.join('tests', 'journeys', '_candidates');

function readExistingCandidates({ outDirectory }) {
  if (!fs.existsSync(outDirectory)) return {};
  const existing = {};
  fs.readdirSync(outDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
    .forEach((entry) => {
      existing[entry.name] = fs.readFileSync(path.join(outDirectory, entry.name), 'utf8');
    });
  return existing;
}

// `lowdefy journeys compile <trace.jsonl>`: the recorded corpus in, one
// candidate journey per distinct sequence out. The candidates land in
// tests/journeys/_candidates, which `lowdefy test` does not run - promotion is
// a move plus `lowdefy test --update` (D11).
async function journeysCompile({ context, params }) {
  const [traceFile] = params;
  const { filePath, pageIds, trace } = readTrace({ context, traceFile });
  const buildDirectory = resolveBuildDirectory({ context });
  if (type.isUndefined(buildDirectory)) {
    context.logger.warn(
      'No build found, so a change on an input block cannot be told from any other event and compiles to no step. Run "lowdefy build" first.'
    );
  }

  const outDirectory = path.resolve(context.directories.config, context.options.out ?? DEFAULT_OUT);
  const { candidates, dropped, sessions, triples } = compileTrace({
    blockMetas: loadBlockMetas({ buildDirectory }),
    blockTypes: readBlockTypes({ buildDirectory, pageIds }),
    existingCandidates: readExistingCandidates({ outDirectory }),
    trace,
  });

  fs.mkdirSync(outDirectory, { recursive: true });
  candidates.forEach((candidate) => {
    fs.writeFileSync(path.join(outDirectory, candidate.fileName), candidate.contents);
  });

  context.logger.info(
    `Compiled ${sessions} sessions from ${filePath} into ${candidates.length} candidates in ${outDirectory}.`
  );
  context.logger.info(
    `Dropped ${dropped.bounced} bounced, ${dropped.pending} unresolved async and ${dropped.unparsable} unreadable records.`
  );
  candidates.forEach((candidate) => {
    const { failures, sessions: count } = candidate.origin;
    context.logger.info(
      `${candidate.status} ${candidate.fileName}: ${count} sessions, ${failures} failures, ${candidate.journey.steps.length} steps.`
    );
  });

  await context.sendTelemetry();
  return { candidates, triples };
}

export default journeysCompile;
