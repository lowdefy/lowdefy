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

import discoverJourneys from '../test/discoverJourneys.js';
import validateJourney from '../test/validateJourney.js';

// The committed journeys evidence and coverage read, with each one's place
// in its file and its path relative to the config directory. A file that does not parse, or a journey that does not validate,
// is reported and left alone.
function readCommittedJourneys({ context }) {
  const journeys = [];
  const skipped = [];
  const indexByFile = new Map();
  discoverJourneys({ context }).forEach((item) => {
    const journeyIndex = indexByFile.get(item.filePath) ?? 0;
    indexByFile.set(item.filePath, journeyIndex + 1);
    const file = path.relative(context.directories.config, item.filePath);
    if (!type.isNone(item.error)) {
      skipped.push(`${file}: ${item.error}`);
      return;
    }
    const validation = validateJourney({ journey: item.journey });
    if (!validation.valid) {
      skipped.push(`${file}: ${validation.message}`);
      return;
    }
    journeys.push({ filePath: item.filePath, file, journeyIndex, journey: item.journey });
  });
  return { journeys, skipped };
}

export default readCommittedJourneys;
