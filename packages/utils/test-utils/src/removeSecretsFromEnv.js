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

// Takes the app's real secrets out of the environment, before any plugin loads: every
// LOWDEFY_SECRET_* value, and CRON_SECRET, which the detached route and a `detached: true`
// CallApi read from the environment directly. An endpoint test must never reach a real
// database or service, so nothing in the test process can read a real secret, whatever the
// shell or a .env file put there. Returns the names it removed.
function removeSecretsFromEnv({ env }) {
  const removed = Object.keys(env).filter(
    (key) => key.startsWith(SECRET_PREFIX) || key === 'CRON_SECRET'
  );
  removed.forEach((key) => {
    delete env[key];
  });
  return removed;
}

export default removeSecretsFromEnv;
