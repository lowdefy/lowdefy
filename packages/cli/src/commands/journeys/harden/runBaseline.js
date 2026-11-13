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
import { classifyJourney, relativePosixPath } from '@lowdefy/node-utils';

import createProgress from './createProgress.js';
import readsMail from './readsMail.js';
import runJourney from '../../test/runJourney.js';
import validateJourney from '../../test/validateJourney.js';

// Whether a journey can run headless: its steps need no browser (classifyJourney), which reads
// only valid steps. A file that did not parse, or a journey that is not valid, runs in the
// browser, which reports it.
function canRunHeadless(item) {
  if (!type.isObject(item.journey) || !validateJourney({ journey: item.journey }).valid) {
    return false;
  }
  return classifyJourney({ journey: item.journey }).headless;
}

// Runs every selected journey once, unmutated, as `lowdefy test` does. A
// journey that fails is left out of the harden run and listed: its path is
// not a baseline any mutant can be measured against. With `headless`, a
// journey that needs no browser runs headless on the dev server, and so do its
// mutant pairs (baseline.headless); one the runner finds needs a browser after
// all (an action only a browser carries out) runs in the browser, as every
// journey does without `headless`.
async function runBaseline({ items, url, configDirectory, headless = false, log = () => {} }) {
  const baselines = [];
  const failed = [];
  const tick = createProgress({
    total: items.length,
    log,
    format: ({ done, total }) => `Baseline ${done}/${total} journeys (${failed.length} failed)`,
  });
  for (const item of items) {
    let runHeadless = headless && canRunHeadless(item);
    let result = await runJourney({ item, url, headless: runHeadless });
    if (!type.isUndefined(result.browserOnly)) {
      runHeadless = false;
      result = await runJourney({ item, url });
    }
    const file = relativePosixPath({ from: configDirectory, to: item.filePath });
    const name = result.name;
    if (!result.passed) {
      failed.push({ file, name, message: result.message });
      tick();
      continue;
    }
    baselines.push({
      key: `${file}#${name}`,
      file,
      name,
      item,
      exercised: result.exercised,
      durationMs: result.durationMs,
      headless: runHeadless,
      readsMail: readsMail(item.journey),
    });
    tick();
  }
  return { baselines, failed };
}

export default runBaseline;
