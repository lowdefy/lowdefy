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
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

// A manifest entry's `journey:` names a journey file (the same format
// `lowdefy test` runs). Only its steps are used here — the page and user come
// from the manifest entry, so one journey can be replayed for several users.
function readJourneySteps({ configDirectory, journeyPath }) {
  const filePath = path.join(configDirectory, journeyPath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Journey file "${journeyPath}" referenced in tests/snapshots.yaml not found.`);
  }
  let parsed;
  try {
    parsed = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid YAML in journey file "${journeyPath}": ${error.message}`);
  }
  // A journey file may hold a list of journeys; a snapshot replays the first.
  const journey = type.isArray(parsed) ? parsed[0] : parsed;
  if (!type.isObject(journey) || !type.isArray(journey.steps)) {
    throw new Error(`Journey file "${journeyPath}" should contain a journey with a "steps" array.`);
  }
  return journey.steps;
}

export default readJourneySteps;
