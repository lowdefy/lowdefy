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

const TEST_SECRET_PREFIX = 'LOWDEFY_TEST_SECRET_';

// The test values a `lowdefy test --build` run was given for the app's secrets, by
// name: every LOWDEFY_TEST_SECRET_<NAME> in the command's environment. The app's real secrets,
// LOWDEFY_SECRET_*, are never read, so a shell, CI job or .env file that holds them cannot leak
// them into a test run. A secret with no value here reads its stand-in.
function readTestSecrets({ env }) {
  return Object.fromEntries(
    Object.keys(env)
      .filter((key) => key.startsWith(TEST_SECRET_PREFIX))
      .map((key) => [key.slice(TEST_SECRET_PREFIX.length), env[key]])
  );
}

export default readTestSecrets;
