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

// How long the sampled run should take, from the baselines' measured
// durations: each (mutant, journey) pair takes about its journey's baseline
// time. Pairs spread over the workers, but a journey never runs beside
// itself, so the run is at least its busiest journey's pairs back to back;
// journeys that read mail run alone, after or between the rest.
function estimateRun({ mutants, baselines, workers }) {
  const byKey = new Map(baselines.map((baseline) => [baseline.key, baseline]));
  const perJourney = new Map();
  let parallel = 0;
  let alone = 0;
  let pairs = 0;
  mutants.forEach((mutant) => {
    mutant.journeys.forEach((key) => {
      const { durationMs, readsMail } = byKey.get(key);
      pairs += 1;
      if (readsMail) {
        alone += durationMs;
        return;
      }
      parallel += durationMs;
      perJourney.set(key, (perJourney.get(key) ?? 0) + durationMs);
    });
  });
  const busiest = Math.max(0, ...perJourney.values());
  return { pairs, durationMs: Math.max(parallel / workers, busiest) + alone };
}

export default estimateRun;
