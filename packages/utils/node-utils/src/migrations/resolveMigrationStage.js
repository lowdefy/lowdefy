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

// A stage names a filename (.lowdefy/migrations/<stage>.json) and a GitHub
// environment, so it is kept to the characters both accept without quoting.
const STAGE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

// The stage is the environment whose migration ledger a build, a migrate run
// or a dev server reads (design D13). Resolution order: an explicit --stage,
// STAGE from the environment (which includes .env, read as the build and
// server read it), then `local` for a dev build. A production build resolves
// to null when nothing names the stage: a prod build is made FOR an
// environment and must carry that environment's ledger, so the caller turns
// null into a build error once it knows migrations exist.
function resolveMigrationStage({ stage, env = process.env, buildStage = 'prod' } = {}) {
  const candidates = [stage, env.STAGE];
  for (const candidate of candidates) {
    if (type.isNone(candidate)) continue;
    if (!type.isString(candidate)) {
      throw new Error(`Migration stage must be a string. Received ${JSON.stringify(candidate)}.`);
    }
    const trimmed = candidate.trim();
    if (trimmed === '') continue;
    if (!STAGE_PATTERN.test(trimmed)) {
      throw new Error(
        `Migration stage "${trimmed}" is not a valid stage name. Use letters, digits, "-" and "_" (e.g. dev, sandbox, prod).`
      );
    }
    return trimmed;
  }
  if (buildStage === 'dev') {
    return 'local';
  }
  return null;
}

export default resolveMigrationStage;
