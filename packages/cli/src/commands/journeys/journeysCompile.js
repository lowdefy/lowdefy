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
import readProductionTrace from './readProductionTrace.js';
import readTraceFiles from './readTraceFiles.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';
import resolveCurrentBuild from './resolveCurrentBuild.js';
import resolveWindow from './resolveWindow.js';

const DEFAULT_OUT = path.join('tests', 'journeys', '_candidates');
const CANDIDATE_SOURCES = ['production', 'dev', 'explorer'];
const MAX_REASONS = 5;

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

function checkSourceOption({ source }) {
  if (source === 'journey') {
    throw new Error(
      'Journey runs are measured coverage, not candidates: "--source journey" cannot be compiled to candidates.'
    );
  }
  if (!type.isNone(source) && !CANDIDATE_SOURCES.includes(source)) {
    throw new Error(
      `--source should be one of ${CANDIDATE_SOURCES.join(', ')}. Received "${source}".`
    );
  }
}

// Production is read from the pulled cache; until the readers for the dev and
// explorer directories are wired in, those traces are compiled from the files
// named on the command line.
function refuseWithoutPaths({ context, source }) {
  if (type.isNone(source)) {
    throw new Error(
      'lowdefy journeys compile needs trace files, or --source to choose recorded traces.'
    );
  }
  throw new Error(
    `Reading ${source} recordings from ${path.join(
      context.directories.traces,
      source
    )} is not available yet: pass the trace files to compile.`
  );
}

// The records to compile and their window: the files given, or for
// `--source production` with no files, the pulled cache over whole UTC days.
function readRecords({ context, traceFiles, source }) {
  const { options } = context;
  if (traceFiles.length === 0 && source === 'production') {
    const { records, unparsable, window } = readProductionTrace({
      directories: context.directories,
      since: options.since,
      from: options.from,
      to: options.to,
    });
    return {
      records,
      unparsable,
      since: Date.parse(`${window.from}T00:00:00.000Z`),
      until: Date.parse(`${window.to}T23:59:59.999Z`),
    };
  }
  if (traceFiles.length === 0) {
    refuseWithoutPaths({ context, source });
  }
  const { records, unparsable } = readTraceFiles({
    paths: traceFiles.map((file) => path.resolve(file)),
  });
  return { records, unparsable };
}

function sourceFromRecords({ records }) {
  const sources = [
    ...new Set(records.map((record) => record?.source).filter((source) => type.isString(source))),
  ].sort();
  if (sources.length === 0) {
    throw new Error('The trace files hold no records with a source to compile.');
  }
  if (sources.length > 1) {
    throw new Error(
      `The trace files hold records from several sources (${sources.join(
        ', '
      )}); choose one with --source.`
    );
  }
  checkSourceOption({ source: sources[0] });
  return sources[0];
}

// The records a compile keeps before segmenting: the chosen source, inside the
// time window. `--build current` with no dev server reads the newest build
// among these, so a record the compile drops never decides the build.
function isSelected({ record, source, since, until }) {
  if (record?.source !== source) return false;
  const time = Date.parse(record.t);
  if (!type.isUndefined(since) && !(time >= since)) return false;
  return type.isUndefined(until) || time <= until;
}

async function resolveBuild({ context, records, build }) {
  if (build !== 'current') return build;
  const { buildId, from } = await resolveCurrentBuild({ context, records });
  if (type.isNone(buildId)) {
    throw new Error(
      'No current build: no dev server for this app answered, and the records name no build.'
    );
  }
  if (from === 'records') {
    context.logger.info(
      `No dev server for this app answered, so --build current is the newest build in the records, ${buildId}.`
    );
  }
  return buildId;
}

function logResult({ context, candidates, segments, dropped, unparsable, outDirectory }) {
  const sessions = new Set(segments.map((segment) => segment.session)).size;
  context.logger.info(
    `Compiled ${sessions} sessions (${segments.length} segments) into ${candidates.length} candidates in ${outDirectory}.`
  );
  context.logger.info(
    `Dropped ${unparsable} unreadable lines, ${dropped.invalid} invalid records and ${dropped.otherVersion} records of another trace version.`
  );
  dropped.reasons.slice(0, MAX_REASONS).forEach((reason) => {
    context.logger.info(`  ${reason}`);
  });
  candidates.forEach((candidate) => {
    const { failures, sessions: count } = candidate.origin;
    context.logger.info(
      `${candidate.status} ${candidate.fileName}: ${count} sessions, ${failures} failures, ${candidate.journey.steps.length} steps.`
    );
  });
}

// `lowdefy journeys compile [traceFiles...]`: recorded interaction traces in,
// one candidate journey per distinct flow out, under
// tests/journeys/_candidates/<source>/, which `lowdefy test` does not run.
async function journeysCompile({ context, params }) {
  const [traceFiles = []] = params;
  const { options } = context;
  checkSourceOption({ source: options.source });
  const read = readRecords({ context, traceFiles, source: options.source });
  const { records, unparsable } = read;
  const source = options.source ?? sourceFromRecords({ records });
  const { since, until } = type.isUndefined(read.since)
    ? resolveWindow({ options, source, now: Date.now() })
    : read;
  const build = await resolveBuild({
    context,
    records: records.filter((record) => isSelected({ record, source, since, until })),
    build: options.build,
  });

  const buildDirectory = resolveBuildDirectory({ context });
  if (type.isUndefined(buildDirectory)) {
    context.logger.warn(
      'No build found, so date and object inputs cannot be told from typed inputs. Run "lowdefy dev" or "lowdefy build" first.'
    );
  }

  const outDirectory = path.resolve(context.directories.config, options.out ?? DEFAULT_OUT, source);
  const { candidates, segments, dropped } = compileTrace({
    records,
    blockMetas: loadBlockMetas({ buildDirectory }),
    existingCandidates: readExistingCandidates({ outDirectory }),
    source,
    filters: { since, until, build, page: options.page },
  });

  fs.mkdirSync(outDirectory, { recursive: true });
  candidates.forEach((candidate) => {
    fs.writeFileSync(path.join(outDirectory, candidate.fileName), candidate.contents);
  });
  logResult({ context, candidates, segments, dropped, unparsable, outDirectory });

  await context.sendTelemetry();
  return { candidates, segments };
}

export default journeysCompile;
