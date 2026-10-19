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

import getExercisedPath from './getExercisedPath.js';
import hashJourney from './hashJourney.js';

// The newest measured path of one journey, or null when none was recorded or
// the journey has changed since (its hash no longer matches). `file` is the
// journey file relative to the config directory.
function readExercised({ directories, file, journey }) {
  const filePath = getExercisedPath({ directories });
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entry = content.journeys?.[`${file}#${journey.name}`];
  if (!entry || entry.hash !== hashJourney(journey)) {
    return null;
  }
  return entry;
}

export default readExercised;
