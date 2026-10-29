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

import fs from 'node:fs';
import path from 'node:path';

import createRunSchedule from './createRunSchedule.mjs';
import readProbeFile from './readProbeFile.mjs';
import summarizeRun from './summarizeRun.mjs';

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

// Times both sides' builds with the probe on (createRunSchedule's order).
// build({ side, logFile, probeFile }) runs one build. The probe files and logs
// land under runDirectory. Resolves to { runs, results }, results mapping each
// side's name to its runs' summaries (summarizeRun), warm-ups left out.
async function timeSides({ build, logger, runDirectory, runs, sides }) {
  const probeDirectory = path.join(runDirectory, 'probe');
  fs.mkdirSync(probeDirectory, { recursive: true });
  const results = Object.fromEntries(sides.map((side) => [side.name, []]));
  for (const { side, run, warmUp } of createRunSchedule({ runs, sides })) {
    const name = warmUp ? `${side.name}-warm-up` : `${side.name}-run-${run}`;
    const probeFile = path.join(probeDirectory, `${name}.jsonl`);
    await build({ side, logFile: path.join(runDirectory, 'logs', `${name}.log`), probeFile });
    const summary = summarizeRun({ records: readProbeFile({ probeFile }) });
    const label = warmUp ? 'warm-up' : `run ${run}/${runs}`;
    logger.info(
      `Timed ${side.label} ${label}: config pass ${formatSeconds(summary.passesMs)} ` +
        `(${summary.passCount}), total ${formatSeconds(summary.totalMs)}.`
    );
    if (!warmUp) {
      results[side.name].push(summary);
    }
  }
  return { runs, results };
}

export default timeSides;
