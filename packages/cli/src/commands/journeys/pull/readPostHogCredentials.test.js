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

import readPostHogCredentials from './readPostHogCredentials.js';

const KEY = 'phx_secret_key_never_logged_123';

describe('readPostHogCredentials', () => {
  const env = {
    POSTHOG_PROJECT_ID: '300001',
    POSTHOG_API_HOST: 'https://eu.posthog.com/',
    POSTHOG_PERSONAL_API_KEY: KEY,
  };

  test('readPostHogCredentials reads the three bare variable names', () => {
    expect(readPostHogCredentials({ env })).toEqual({
      projectId: '300001',
      apiHost: 'https://eu.posthog.com',
      apiKey: KEY,
    });
  });

  test.each(['POSTHOG_PROJECT_ID', 'POSTHOG_API_HOST', 'POSTHOG_PERSONAL_API_KEY'])(
    'readPostHogCredentials fails naming %s when it is missing',
    (name) => {
      const partial = { ...env };
      delete partial[name];
      expect(() => readPostHogCredentials({ env: partial })).toThrow(name);
    }
  );

  test('readPostHogCredentials says the personal key needs the Query Read scope', () => {
    expect(() => readPostHogCredentials({ env: { ...env, POSTHOG_PERSONAL_API_KEY: '' } })).toThrow(
      'Query Read'
    );
  });

  test('readPostHogCredentials refuses an http:// host', () => {
    expect(() =>
      readPostHogCredentials({ env: { ...env, POSTHOG_API_HOST: 'http://eu.posthog.com' } })
    ).toThrow('https://');
  });

  test('readPostHogCredentials never puts the key in an error message', () => {
    let message;
    try {
      readPostHogCredentials({ env: { ...env, POSTHOG_API_HOST: 'not a url' } });
    } catch (error) {
      message = error.message;
    }
    expect(message).toBeDefined();
    expect(message).not.toContain(KEY);
  });
});
