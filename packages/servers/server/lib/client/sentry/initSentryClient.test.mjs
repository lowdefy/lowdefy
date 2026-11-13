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

import { vi, expect, test } from 'vitest';

const init = vi.fn();

vi.doMock('@sentry/browser', () => ({
  init,
  replayIntegration: () => ({ name: 'Replay' }),
  feedbackIntegration: () => ({ name: 'Feedback' }),
}));
vi.spyOn(console, 'log').mockImplementation(() => {});

const { default: initSentryClient } = await import('./initSentryClient.js');

test('initSentryClient pins what the browser SDK collects and keeps stack traces off captured messages', () => {
  initSentryClient({ sentryDsn: 'https://public@o0.ingest.sentry.io/1', sentryConfig: {} });
  expect(init).toHaveBeenCalledTimes(1);
  const [options] = init.mock.calls[0];
  expect(options.dataCollection).toEqual({
    userInfo: false,
    cookies: false,
    httpHeaders: {
      deny: ['forwarded', '-ip', 'remote-', 'via', '-user', 'referer', 'referrer'],
    },
    httpBodies: [],
    urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  });
  expect(options.attachStacktrace).toBe(false);
  expect(options.integrations).toEqual([{ name: 'Replay' }]);
});
