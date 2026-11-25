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

import fs from 'node:fs';
import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { writeFileAtomic } from '@lowdefy/node-utils';

import readBuildSecretNames from './readBuildSecretNames.js';

function readKept({ buildId, filePath }) {
  let kept;
  try {
    kept = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return undefined;
  }
  if (kept?.buildId !== buildId || !type.isArray(kept.names)) {
    return undefined;
  }
  return kept.names;
}

// The secret names the build's _secret operators read (readBuildSecretNames), kept by the build's
// buildId in the app's .lowdefy/test, beside the test run's other records: a later run on the same
// build reads them from that file instead of reading every JSON artifact again. Every build stamps
// a new buildId in appMeta.json, so a rebuilt server never takes another build's names. A folder
// that cannot be written only loses the saving.
async function readTestAppSecretNames({ testApp }) {
  const { appMeta, directories } = testApp;
  const buildId = appMeta?.buildId;
  if (!type.isString(buildId)) {
    return readBuildSecretNames({ directories });
  }
  const filePath = path.join(directories.config, '.lowdefy', 'test', 'secretNames.json');
  const kept = readKept({ buildId, filePath });
  if (!type.isUndefined(kept)) {
    return kept;
  }
  const names = readBuildSecretNames({ directories });
  try {
    await writeFileAtomic(filePath, JSON.stringify({ buildId, names }));
  } catch {
    // The names were read; the next run reads them again.
  }
  return names;
}

export default readTestAppSecretNames;
