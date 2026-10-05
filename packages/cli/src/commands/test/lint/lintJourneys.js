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
import { parseDataSet } from '@lowdefy/node-utils';

import buildL7Pages from './buildL7Pages.js';
import getL7PageIds from './getL7PageIds.js';
import lintJourney from './lintJourney.js';
import measuredJourney from '../measuredJourney.js';
import readExercised from '../readExercised.js';
import readSnapshotStrings from './readSnapshotStrings.js';
import validateJourney from '../validateJourney.js';

// Each data set the journeys name, read once: { dataSet, snapshotStrings } or
// { error } when its file cannot be read.
async function readDataSets({ context, journeys }) {
  const dataSets = new Map();
  for (const journey of journeys) {
    const name = journey.data;
    if (type.isNone(name) || dataSets.has(name)) continue;
    try {
      const dataSet = await parseDataSet({ configDirectory: context.directories.config, name });
      const snapshotStrings =
        type.isNone(dataSet.snapshotSpec) || type.isNone(dataSet.snapshot)
          ? null
          : readSnapshotStrings({
              configDirectory: context.directories.config,
              name,
              manifest: dataSet.snapshot,
            });
      dataSets.set(name, { dataSet, snapshotStrings });
    } catch (error) {
      dataSets.set(name, { error: error.message });
    }
  }
  return dataSets;
}

// `lowdefy test --lint`: lints the selected journeys and runs nothing. Data
// sets are read from their files, so only L7 needs a dev server, and only
// when some journey runs on a data set with a snapshot: the dev build is
// just-in-time, so its pages are built before their config is read. Prints
// one line per problem and returns whether any was an error.
async function lintJourneys({ context, items }) {
  let errors = 0;
  let warnings = 0;
  function report({ severity, line }) {
    if (severity === 'error') {
      errors += 1;
      context.logger.error(line);
    } else if (severity === 'warning') {
      warnings += 1;
      context.logger.warn(line);
    } else {
      context.logger.info(line);
    }
  }

  const valid = [];
  items.forEach((item) => {
    const name = item.journey?.name ?? item.filePath;
    const validation = type.isNone(item.error)
      ? validateJourney({ journey: item.journey })
      : { valid: false, message: item.error };
    if (!validation.valid) {
      report({
        severity: 'error',
        line: `--  ${name}  invalid journey file: ${validation.message}`,
      });
      return;
    }
    valid.push({
      journey: item.journey,
      exercisedEntry: readExercised({
        directories: context.directories,
        file: path.relative(context.directories.config, item.filePath),
        journey: measuredJourney({ journey: item.journey }),
      }),
    });
  });

  const dataSets = await readDataSets({ context, journeys: valid.map(({ journey }) => journey) });
  const l7PageIds = new Set();
  valid.forEach(({ journey, exercisedEntry }) => {
    if (type.isNone(dataSets.get(journey.data)?.dataSet?.snapshotSpec)) return;
    getL7PageIds({ journey, exercisedEntry }).forEach((pageId) => l7PageIds.add(pageId));
  });
  const pageErrors =
    l7PageIds.size === 0 ? {} : await buildL7Pages({ context, pageIds: [...l7PageIds] });
  const buildDirectory = path.join(context.directories.dev, 'build');

  valid.forEach(({ journey, exercisedEntry }) => {
    const read = dataSets.get(journey.data) ?? {};
    if (!type.isNone(read.error)) {
      report({ severity: 'error', line: `--  ${journey.name}  data set: ${read.error}` });
    }
    lintJourney({
      journey,
      exercisedEntry,
      dataSet: read.dataSet ?? null,
      buildDirectory,
      snapshotStrings: read.snapshotStrings ?? null,
      pageErrors,
    }).forEach((problem) => {
      report({
        severity: problem.severity,
        line: `${problem.rule}  ${journey.name}  ${problem.message}`,
      });
    });
  });
  const summary = `Linted ${items.length} journeys: ${errors} errors, ${warnings} warnings.`;
  if (errors > 0) {
    context.logger.error(summary);
  } else {
    context.logger.info(summary);
  }
  return { failed: errors > 0 };
}

export default lintJourneys;
