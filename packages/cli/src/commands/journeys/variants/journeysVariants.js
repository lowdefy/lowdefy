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

import path from 'path';
import { type } from '@lowdefy/helpers';

import discoverJourneys from '../../test/discoverJourneys.js';
import fetchBuildId from '../../test/fetchBuildId.js';
import fetchVariantInputs from './fetchVariantInputs.js';
import formatJourneyResult from '../../test/formatJourneyResult.js';
import generators, { KINDS } from './generators/index.js';
import readExercised from '../../test/readExercised.js';
import readVariantDataSets from './readVariantDataSets.js';
import resolveJourneyPaths from '../../test/resolveJourneyPaths.js';
import resolveServer from '../../test/resolveServer.js';
import runJourney from '../../test/runJourney.js';
import runRepeated from '../../test/runRepeated.js';
import validateJourney from '../../test/validateJourney.js';
import writeExercised from '../../test/writeExercised.js';
import writeVariantFiles from './writeVariantFiles.js';

const REPLAYS = 3;

function refuse({ context, message }) {
  context.logger.error(message);
  context.sendTelemetry();
  process.exitCode = 1;
}

function parseKinds(value) {
  if (type.isNone(value)) {
    return { kinds: KINDS };
  }
  const kinds = String(value)
    .split(',')
    .map((kind) => kind.trim())
    .filter((kind) => kind !== '');
  const unknown = kinds.filter((kind) => !KINDS.includes(kind));
  if (unknown.length > 0) {
    return {
      error: `--kinds takes ${KINDS.join(', ')}. Received ${JSON.stringify(unknown.join(','))}.`,
    };
  }
  return { kinds };
}

// The one journey to vary: the file's only journey, or the one --name names.
function selectJourney({ context }) {
  const resolved = resolveJourneyPaths({
    paths: [context.options.file],
    base: process.cwd(),
    configDirectory: context.directories.config,
  });
  if (resolved.error) {
    return { error: resolved.error };
  }
  if (resolved.files.length !== 1) {
    return {
      error: `Give one journey file. "${context.options.file}" names ${resolved.files.length}.`,
    };
  }
  const items = discoverJourneys({ context, paths: resolved.files });
  const named = type.isNone(context.options.name)
    ? items
    : items.filter(({ journey }) => journey?.name === context.options.name);
  if (named.length !== 1) {
    const names = items.map(({ journey }) => JSON.stringify(journey?.name)).join(', ');
    return {
      error: type.isNone(context.options.name)
        ? `${context.options.file} holds ${items.length} journeys (${names}): pick one with --name.`
        : `No journey named "${context.options.name}" in ${context.options.file}. It holds ${names}.`,
    };
  }
  const [item] = named;
  const validation = type.isNone(item.error)
    ? validateJourney({ journey: item.journey })
    : { valid: false, message: item.error };
  if (!validation.valid) {
    return { error: `Invalid journey file: ${validation.message}` };
  }
  return { item };
}

// The journey's newest measured path, or a fresh baseline run's.
async function readOrMeasure({ context, item, url }) {
  const entry = readExercised({
    directories: context.directories,
    file: path.relative(context.directories.config, item.filePath),
    journey: item.journey,
  });
  if (!type.isNone(entry)) {
    return { exercised: entry.exercised };
  }
  const result = await runJourney({ item, url });
  if (!result.passed) {
    return { error: `The journey fails (${result.message}): replay it with lowdefy test first.` };
  }
  writeExercised({
    directories: context.directories,
    results: [{ ...result, journey: item.journey, newestPassed: true }],
    buildId: await fetchBuildId({ url }),
  });
  return { exercised: result.exercised };
}

// Runs each kind's generators. A generator returns its variants, or
// { skipped } with a note, or { variants, skipped: [notes] } when it wrote
// some and skipped others.
function generate({ context, kinds, journey, exercised, inputs }) {
  const variants = [];
  kinds.forEach((kind) => {
    generators[kind].forEach((generator) => {
      const generated = generator({ journey, exercised, ...inputs });
      if (type.isArray(generated)) {
        variants.push(...generated);
        return;
      }
      variants.push(...(generated.variants ?? []));
      const notes = type.isArray(generated.skipped) ? generated.skipped : [generated.skipped];
      notes.forEach((note) => context.logger.info(`SKIPPED  ${kind}: ${note}`));
    });
  });
  return variants;
}

function reportFile({ context, file }) {
  const relative = path.relative(context.directories.config, file.path);
  switch (file.status) {
    case 'kept':
      context.logger.warn(
        `KEPT     ${relative}: edited since it was generated; delete it to regenerate`
      );
      return;
    case 'conflict':
      if (type.isNull(file.owner.source)) {
        context.logger.warn(
          `CONFLICT ${relative}: holds a file with no generated header; move it or rename the journey`
        );
        return;
      }
      context.logger.warn(
        `CONFLICT ${relative}: holds a variant of "${file.owner.name}" from ${file.owner.source}; rename one of the journeys`
      );
      return;
    case 'removed':
      context.logger.info(`REMOVED  ${relative}: no longer generated`);
      return;
    case 'stale':
      context.logger.warn(
        `KEPT     ${relative}: no longer generated, but edited since; delete it if it is not needed`
      );
      return;
    default:
      context.logger.info(`WROTE    ${relative}`);
  }
}

async function replay({ context, written, url }) {
  const suite = { run: runJourney };
  for (const file of written) {
    const relative = path.relative(context.directories.config, file.path);
    if (file.placeholder) {
      context.logger.warn(
        `NOT RUN  ${relative}: write the value its from: shape placeholder needs, then lowdefy test --repeat 3 ${relative}`
      );
      continue;
    }
    const [item] = discoverJourneys({ context, paths: [file.path] });
    const result = await runRepeated({ suite, context, item, url, repeat: REPLAYS });
    const log = result.passed ? context.logger.info : context.logger.error;
    formatJourneyResult({ result }).forEach((line) => log(line));
  }
  context.logger.info(
    'PASS: a candidate to keep. FAIL: a finding, a bug or behaviour to assert as expected. FLAKY: fix the cause.'
  );
}

// lowdefy journeys variants <file>: writes edge-case candidates of one
// journey (other roles, another organization, empty and large data, bad
// input, a reload mid-flow, a double click) deterministically to
// tests/journeys/_candidates/variants/<source>/, and replays each three times unless
// --no-run. It never changes the original journey.
async function journeysVariants({ context }) {
  const { kinds, error: kindsError } = parseKinds(context.options.kinds);
  if (kindsError) {
    refuse({ context, message: kindsError });
    return;
  }
  const { item, error } = selectJourney({ context });
  if (error) {
    refuse({ context, message: error });
    return;
  }
  let dataSets;
  try {
    dataSets = await readVariantDataSets({ context, journey: item.journey });
  } catch (dataSetError) {
    refuse({ context, message: dataSetError.message });
    return;
  }
  const server = await resolveServer({ context });
  try {
    const measured = await readOrMeasure({ context, item, url: server.url });
    if (measured.error) {
      refuse({ context, message: measured.error });
      return;
    }
    const inputs = await fetchVariantInputs({
      url: server.url,
      journey: item.journey,
      exercised: measured.exercised,
    });
    const variants = generate({
      context,
      kinds,
      journey: item.journey,
      exercised: measured.exercised,
      inputs: { ...inputs, ...dataSets },
    });
    const files = writeVariantFiles({
      directories: context.directories,
      filePath: item.filePath,
      journey: item.journey,
      variants,
      kinds,
    });
    files.forEach((file) => reportFile({ context, file }));
    if (context.options.run !== false) {
      const candidates = files.filter(({ status }) => status === 'written' || status === 'kept');
      await replay({ context, written: candidates, url: server.url });
    }
  } finally {
    await server.stop();
  }
  context.sendTelemetry();
}

export default journeysVariants;
