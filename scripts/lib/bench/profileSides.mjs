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

import createPackageResolver from './createPackageResolver.mjs';
import readProbeFile from './readProbeFile.mjs';
import readProcessProfiles from './readProcessProfiles.mjs';
import summarizeCpuProfiles from './summarizeCpuProfiles.mjs';
import summarizeRun from './summarizeRun.mjs';

// One more build per side with CPU profiles on, the probe naming the config
// passes. Every Node process's profile stays under
// runDirectory/profiles/<side>/; the config passes' main threads are
// summarised (summarizeCpuProfiles). build({ side, cpuProfileDirectory,
// logFile, probeFile }) runs one build. Resolves to a map from each side's
// name to { passCount, files, durationMs, packages, buildFiles, runtime }.
async function profileSides({ build, logger, runDirectory, sides }) {
  const packageOf = createPackageResolver();
  const summaries = {};
  for (const side of sides) {
    const cpuProfileDirectory = path.join(runDirectory, 'profiles', side.name);
    const probeFile = path.join(runDirectory, 'probe', `${side.name}-profile.jsonl`);
    fs.mkdirSync(cpuProfileDirectory, { recursive: true });
    fs.mkdirSync(path.dirname(probeFile), { recursive: true });
    await build({
      side,
      cpuProfileDirectory,
      logFile: path.join(runDirectory, 'logs', `${side.name}-profile.log`),
      probeFile,
    });
    const run = summarizeRun({ records: readProbeFile({ probeFile }) });
    const profiles = readProcessProfiles({
      directory: cpuProfileDirectory,
      pids: run.passes.map((pass) => pass.pid),
    });
    if (profiles.length !== run.passCount) {
      throw new Error(
        `Expected ${run.passCount} config pass profiles in ${cpuProfileDirectory}, found ${profiles.length}.`
      );
    }
    summaries[side.name] = {
      passCount: run.passCount,
      files: profiles.map(({ file }) => file),
      ...summarizeCpuProfiles({ packageOf, profiles: profiles.map(({ profile }) => profile) }),
    };
    logger.info(`Profiled ${side.label}: ${profiles.length} config pass profile(s).`);
  }
  return summaries;
}

export default profileSides;
