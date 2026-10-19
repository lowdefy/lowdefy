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

import createRequestSignal from './createRequestSignal.js';

test('createRequestSignal aborts with an AbortError when the client closes the connection', () => {
  const client = new AbortController();
  const signal = createRequestSignal({ clientSignal: client.signal });
  expect(signal.aborted).toBe(false);
  // The Node adapter aborts the incoming request with a plain string.
  client.abort('Client connection prematurely closed.');
  expect(signal.aborted).toBe(true);
  expect(signal.reason).toBeInstanceOf(DOMException);
  expect(signal.reason.name).toBe('AbortError');
  expect(signal.reason.message).toBe(
    'The client closed the connection before the response was sent.'
  );
});

test('createRequestSignal is aborted at once when the client had already closed', () => {
  const client = new AbortController();
  client.abort('Client connection prematurely closed.');
  const signal = createRequestSignal({ clientSignal: client.signal });
  expect(signal.aborted).toBe(true);
  expect(signal.reason.name).toBe('AbortError');
});

test('createRequestSignal aborts with the timeout reason when the request timeout fires', () => {
  const client = new AbortController();
  const timeout = new AbortController();
  const signal = createRequestSignal({
    clientSignal: client.signal,
    timeoutSignal: timeout.signal,
  });
  const reason = new DOMException('The request timeout of 30000ms was exceeded.', 'TimeoutError');
  timeout.abort(reason);
  expect(signal.aborted).toBe(true);
  expect(signal.reason).toBe(reason);
  // A client that leaves after the timeout does not change the reason.
  client.abort('Client connection prematurely closed.');
  expect(signal.reason).toBe(reason);
});
