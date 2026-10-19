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

// The run of a journey that stands for it where a journey is read once (lint,
// evidence): the journey itself, or for a journey with a list of users its
// first user's persona run, whose name keys its measured path and mutation
// score.
function measuredJourney({ journey }) {
  if (!type.isArray(journey.user)) {
    return journey;
  }
  return personaJourney({ journey, user: journey.user[0] });
}

export default measuredJourney;
