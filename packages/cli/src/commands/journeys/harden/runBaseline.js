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

import readsMail from './readsMail.js';
import runJourney from '../../test/runJourney.js';

// Runs every selected journey once, unmutated, as `lowdefy test` does. A
// journey that fails is left out of the harden run and listed: its path is
// not a baseline any mutant can be measured against.
async function runBaseline({ items, url, configDirectory }) {
  const baselines = [];
  const failed = [];
  for (const item of items) {
    const result = await runJourney({ item, url });
    const file = path.relative(configDirectory, item.filePath);
    const name = result.name;
    if (!result.passed) {
      failed.push({ file, name, message: result.message });
      continue;
    }
    baselines.push({
      key: `${file}#${name}`,
      file,
      name,
      item,
      exercised: result.exercised,
      durationMs: result.durationMs,
      readsMail: readsMail(item.journey),
    });
  }
  return { baselines, failed };
}

export default runBaseline;
