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

import lintJourney from './lintJourney.js';
import readExercised from '../readExercised.js';
import validateJourney from '../validateJourney.js';

// `lowdefy test --lint`: lints the selected journeys and runs nothing, so it
// needs no server and opens no browser. Prints one line per problem and
// returns whether any was an error.
function lintJourneys({ context, items }) {
  let errors = 0;
  let warnings = 0;
  items.forEach((item) => {
    const name = item.journey?.name ?? item.filePath;
    const validation = type.isNone(item.error)
      ? validateJourney({ journey: item.journey })
      : { valid: false, message: item.error };
    if (!validation.valid) {
      errors += 1;
      context.logger.error(`--  ${name}  invalid journey file: ${validation.message}`);
      return;
    }
    const exercisedEntry = readExercised({
      directories: context.directories,
      file: path.relative(context.directories.config, item.filePath),
      journey: item.journey,
    });
    lintJourney({ journey: item.journey, exercisedEntry }).forEach((problem) => {
      const line = `${problem.rule}  ${name}  ${problem.message}`;
      if (problem.severity === 'error') {
        errors += 1;
        context.logger.error(line);
      } else {
        warnings += 1;
        context.logger.warn(line);
      }
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
