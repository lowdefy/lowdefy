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
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import listJourneyFiles from './listJourneyFiles.js';

function readJourneyFile({ filePath }) {
  let parsed;
  try {
    parsed = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [{ filePath, journey: undefined, error: `Invalid YAML: ${error.message}` }];
  }
  if (type.isArray(parsed)) {
    return parsed.map((journey) => ({ filePath, journey }));
  }
  return [{ filePath, journey: parsed }];
}

// With `paths` (journey files already resolved by resolveJourneyPaths), the
// named files are read; otherwise every file under tests/journeys, sub-folders
// included, except those in a folder whose name starts with "_".
function discoverJourneys({ context, paths }) {
  if (!type.isUndefined(paths)) {
    return paths.flatMap((filePath) => readJourneyFile({ filePath }));
  }
  const directory = context.directories.journeys;
  if (!fs.existsSync(directory)) {
    return [];
  }
  return listJourneyFiles({ directory, skipUnderscored: true }).flatMap((filePath) =>
    readJourneyFile({ filePath })
  );
}

export default discoverJourneys;
