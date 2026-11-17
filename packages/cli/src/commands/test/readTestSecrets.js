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

const SECRET_PREFIX = 'LOWDEFY_SECRET_';

// The test values a `lowdefy test --headless --build` run was given for the app's secrets, by
// name: every LOWDEFY_SECRET_<NAME> in the environment the command was started with. The ones
// the CLI loaded from the app's .env file (dotEnvNames) are left out: they are the app's real
// secrets, which a run on the build never reads, so a run gives the same answer on a
// developer's machine and in CI. A secret with no value here reads its stand-in.
function readTestSecrets({ dotEnvNames, env }) {
  const fromDotEnv = new Set(dotEnvNames);
  return Object.fromEntries(
    Object.keys(env)
      .filter((key) => key.startsWith(SECRET_PREFIX) && !fromDotEnv.has(key))
      .map((key) => [key.slice(SECRET_PREFIX.length), env[key]])
  );
}

export default readTestSecrets;
