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

import L1 from './L1.js';
import L2 from './L2.js';
import L3 from './L3.js';
import L4 from './L4.js';
import L5 from './L5.js';
import L6 from './L6.js';

const RULES = { L1, L2, L3, L4, L5, L6 };

// Every problem one journey has, as { rule, severity, stepIndex?, message }.
// `exercisedEntry` is the journey's newest measured run (readExercised), or
// null when it has none. `dataSet` is its data set (parseDataSet), or null.
function lintJourney({ journey, exercisedEntry, dataSet = null, rules = RULES }) {
  return Object.entries(rules).flatMap(([rule, check]) =>
    check({ journey, exercisedEntry, dataSet }).map((problem) => ({ rule, ...problem }))
  );
}

export default lintJourney;
