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

import { isReserved, setKey } from '@lowdefy/helpers';

const SECRET_ENV_PREFIX = 'LOWDEFY_SECRET_';

// `_secret` strips these before it reads, so naming one in config never resolves.
const FILTERED_SECRET_NAMES = ['OPENID_CLIENT_SECRET', 'JWT_SECRET'];

// The same secrets object the server builds at boot (getSecretsFromEnv), minus
// the two names `_secret` filters out, so the check reads exactly what the
// operator would read. The CLI's dotenv.config() has already merged the app's
// .env into process.env by the time a build or check runs, so process.env is
// the whole environment - there is no second source to consult.
//
// A reserved name is skipped rather than thrown on: the server refuses to boot
// with one, and that is the message the developer needs, not a check failure
// about a secret that is unreadable either way.
function readSecretsFromEnv() {
  const secrets = {};
  Object.keys(process.env).forEach((key) => {
    if (!key.startsWith(SECRET_ENV_PREFIX)) return;
    const name = key.replace(SECRET_ENV_PREFIX, '');
    if (isReserved(name)) return;
    if (FILTERED_SECRET_NAMES.includes(name)) return;
    setKey(secrets, name, process.env[key]);
  });
  return secrets;
}

export { FILTERED_SECRET_NAMES, SECRET_ENV_PREFIX };

export default readSecretsFromEnv;
