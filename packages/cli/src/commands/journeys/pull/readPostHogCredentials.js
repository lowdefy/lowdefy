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

const VARIABLES = [
  {
    name: 'POSTHOG_PROJECT_ID',
    key: 'projectId',
    purpose: 'the id of the PostHog project the app sends its analytics to',
  },
  {
    name: 'POSTHOG_API_HOST',
    key: 'apiHost',
    purpose: 'the PostHog API host of that project, for example https://eu.posthog.com',
  },
  {
    name: 'POSTHOG_PERSONAL_API_KEY',
    key: 'apiKey',
    purpose:
      'your own PostHog personal API key, scoped to the project with the Query Read scope. It is never synced: export it in your shell or put it in the app .env file',
  },
];

// The pull reads the bare variable names the app's environment already
// carries (after startUp has loaded .env). There is no default host: guessing
// the wrong region answers 401s that look like a bad key.
function readPostHogCredentials({ env }) {
  const credentials = {};
  VARIABLES.forEach(({ name, key, purpose }) => {
    const value = env[name];
    if (!type.isString(value) || value.trim() === '') {
      throw new Error(`${name} is not set. It is ${purpose}.`);
    }
    credentials[key] = value.trim();
  });
  let url;
  try {
    url = new URL(credentials.apiHost);
  } catch {
    throw new Error(
      `POSTHOG_API_HOST should be an https:// URL such as https://eu.posthog.com. Received "${credentials.apiHost}".`
    );
  }
  if (url.protocol !== 'https:') {
    throw new Error(
      `POSTHOG_API_HOST should be an https:// URL such as https://eu.posthog.com. Received "${credentials.apiHost}".`
    );
  }
  credentials.apiHost = credentials.apiHost.replace(/\/+$/, '');
  return credentials;
}

export default readPostHogCredentials;
