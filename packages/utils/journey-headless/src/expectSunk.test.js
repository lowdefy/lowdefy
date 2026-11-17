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

import { expect, test } from 'vitest';

import expectSunk from './expectSunk.js';

const rate = {
  connectionId: 'rate_service',
  connectionType: 'AxiosHttp',
  requestType: 'AxiosHttp',
  requestId: 'fetch_rate',
  pageId: null,
  endpointId: 'price_run',
  request: { url: '/rates', params: { currency: 'EUR' } },
};
const mail = {
  connectionId: 'mail',
  connectionType: 'SendGridMail',
  requestType: 'SendGridMailSend',
  requestId: 'send_receipt',
  pageId: null,
  endpointId: 'price_run',
  request: { to: 'a@example.com' },
};

function createSession(sunk) {
  return { sunk };
}

test('expectSunk counts the requests narrowed by connection type, request type and id', async () => {
  const session = createSession([
    rate,
    mail,
    { ...rate, request: { params: { currency: 'USD' } } },
  ]);
  await expectSunk({ params: { connectionType: 'AxiosHttp', count: 2 }, session, timeout: 0 });
  await expectSunk({ params: { requestType: 'SendGridMailSend', count: 1 }, session, timeout: 0 });
  await expectSunk({ params: { requestId: 'other', count: 0 }, session, timeout: 0 });
  await expect(
    expectSunk({ params: { requestId: 'fetch_rate', count: 1 }, session, timeout: 0 })
  ).rejects.toMatchObject({
    message:
      'Expected 1 requests to outside services matching {"requestId":"fetch_rate"} but found 2.',
    expected: 1,
    actual: 2,
  });
});

test('expectSunk matches the last matching request partially', async () => {
  const session = createSession([rate, { ...rate, request: { params: { currency: 'USD' } } }]);
  await expectSunk({
    params: { requestId: 'fetch_rate', match: { params: { currency: 'USD' } } },
    session,
    timeout: 0,
  });
  await expect(
    expectSunk({
      params: { requestId: 'fetch_rate', match: { params: { currency: 'EUR' } } },
      session,
      timeout: 0,
    })
  ).rejects.toThrow(
    'Expected the last of the requests to outside services matching {"requestId":"fetch_rate"} to hold {"params":{"currency":"EUR"}}:'
  );
});

test('expectSunk with neither count nor match needs one request', async () => {
  await expectSunk({ params: {}, session: createSession([mail]), timeout: 0 });
  await expect(
    expectSunk({
      params: { connectionType: 'AxiosHttp' },
      session: createSession([mail]),
      timeout: 0,
    })
  ).rejects.toThrow(
    'Expected requests to outside services matching {"connectionType":"AxiosHttp"} but the journey made none.'
  );
  await expect(
    expectSunk({
      params: { match: { to: 'a@example.com' } },
      session: createSession([]),
      timeout: 0,
    })
  ).rejects.toThrow(
    'Expected the last of the requests to outside services to hold {"to":"a@example.com"} but the journey made none.'
  );
});

test('expectSunk waits for a request sent in the background', async () => {
  const session = createSession([]);
  setTimeout(() => session.sunk.push(rate), 20);
  await expectSunk({ params: { requestId: 'fetch_rate', count: 1 }, session, timeout: 1000 });
});

test('expectSunk needs a data session', async () => {
  await expect(expectSunk({ params: {}, session: null, timeout: 0 })).rejects.toThrow(
    'expect.sunk reads the requests the journey\'s data session recorded, and this journey declares no "data".'
  );
});
