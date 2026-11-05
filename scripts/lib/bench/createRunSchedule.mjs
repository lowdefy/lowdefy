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

// The order of the timed builds: one warm-up per side, discarded, then `runs`
// builds per side, alternating, so a change in machine load falls on both
// sides alike. Each entry is { side, run, warmUp }, run counting from 1.
function createRunSchedule({ runs, sides }) {
  const schedule = sides.map((side) => ({ side, run: 0, warmUp: true }));
  for (let run = 1; run <= runs; run += 1) {
    sides.forEach((side) => schedule.push({ side, run, warmUp: false }));
  }
  return schedule;
}

export default createRunSchedule;
