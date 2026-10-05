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

import personaJourney from './personaJourney.js';
import validateJourney from './validateJourney.js';

// A journey whose `user` is a list runs once per user: one item each, its
// journey the persona run (personaJourney), `persona` the user and
// `personaOf` the journey as written. Any other item is returned as it is,
// an invalid list included, so the runner refuses it once as an invalid file.
function expandPersonas({ item }) {
  if (!type.isNone(item.error) || !type.isArray(item.journey?.user)) {
    return [item];
  }
  if (!validateJourney({ journey: item.journey }).valid) {
    return [item];
  }
  return item.journey.user.map((user) => ({
    filePath: item.filePath,
    journey: personaJourney({ journey: item.journey, user }),
    persona: user,
    personaOf: item.journey,
  }));
}

export default expandPersonas;
