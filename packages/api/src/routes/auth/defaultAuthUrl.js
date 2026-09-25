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

import getCurrentEnvironment from '../../context/getCurrentEnvironment.js';

// Auth.js reads its base URL from AUTH_URL (NEXTAUTH_URL is aliased to it at startup). Default it to
// the current environment's url so a deployment declared in config.environments needs no separate
// AUTH_URL / NEXTAUTH_URL.
function defaultAuthUrl({ config }) {
  if (process.env.AUTH_URL || process.env.NEXTAUTH_URL) return;
  const url = getCurrentEnvironment({ config })?.url;
  if (url) {
    process.env.AUTH_URL = url;
  }
}

export default defaultAuthUrl;
