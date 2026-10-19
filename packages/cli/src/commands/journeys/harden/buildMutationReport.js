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

function journeyOf({ baselines, key }) {
  return baselines.find((baseline) => baseline.key === key);
}

// The report `lowdefy journeys harden` writes to .lowdefy/test/mutation.json
// and prints with --json. `killed` and `total` are the suite's score,
// `journeys` each journey's, which `journeys evidence --refresh` copies into
// its evidence; `file` is relative to the config directory.
function buildMutationReport({ score, baselines, buildId, rebuilds, sampled, operators, now }) {
  return {
    version: 1,
    generated: now.toISOString(),
    buildId,
    rebuilds,
    killed: score.killed,
    total: score.total,
    sampled,
    operators,
    mutants: score.mutants.map((mutant) => ({
      id: mutant.id,
      operator: mutant.operator,
      artifact: mutant.artifact,
      source: mutant.source,
      config: mutant.config,
      describe: mutant.describe,
      copies: mutant.copies,
      status: mutant.status,
      ranBy: mutant.ranBy.map((verdict) => {
        const { file, name } = journeyOf({ baselines, key: verdict.journey });
        return {
          file,
          name,
          verdict: verdict.verdict,
          failure: verdict.failure ?? null,
          misses: verdict.misses ?? [],
        };
      }),
    })),
    journeys: score.journeys.map(({ file, name, killed, total, unique }) => ({
      file,
      name,
      killed,
      total,
      unique,
    })),
  };
}

export default buildMutationReport;
