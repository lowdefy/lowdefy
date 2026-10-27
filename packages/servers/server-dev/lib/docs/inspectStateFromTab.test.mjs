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

import { serializer } from '@lowdefy/helpers';
import { vi, afterEach, expect, test } from 'vitest';

const { listTabs, registerTab, resolveTabRequest, unregisterTab, updateTabPage } = await import(
  './tabChannel.js'
);
const { default: inspectStateFromTab } = await import('./inspectStateFromTab.js');

afterEach(() => {
  listTabs().forEach((tab) => unregisterTab({ id: tab.id }));
});

function connectHomeTab() {
  const send = vi.fn();
  registerTab({ id: 'tab-1', send });
  updateTabPage({ id: 'tab-1', pageId: 'home', pathParams: {}, instanceKey: 'page:home' });
  return send;
}

test('inspectStateFromTab sends inspect-request and returns the tab snapshot', async () => {
  const send = connectHomeTab();

  const promise = inspectStateFromTab({ pageId: 'home' });
  const [event, payload] = send.mock.calls[0];
  expect(event).toEqual('inspect-request');
  resolveTabRequest({
    requestId: payload.requestId,
    result: serializer.serializeToString({ state: { a: 1 } }),
  });

  await expect(promise).resolves.toEqual({ state: { a: 1 } });
});

test('inspectStateFromTab sends eval-request with the expression and returns value, errors and reads', async () => {
  const send = connectHomeTab();

  const promise = inspectStateFromTab({ pageId: 'home', evaluate: true, expression: null });
  const [event, payload] = send.mock.calls[0];
  expect(event).toEqual('eval-request');
  expect(payload.expression).toBeNull();
  resolveTabRequest({
    requestId: payload.requestId,
    result: { value: serializer.serializeToString(null), errors: [], reads: [] },
  });

  await expect(promise).resolves.toEqual({ value: null, errors: [], reads: [] });
});

test('inspectStateFromTab returns the tab error for an expression', async () => {
  const send = connectHomeTab();

  const promise = inspectStateFromTab({
    pageId: 'home',
    evaluate: true,
    expression: { _state: 'a' },
  });
  resolveTabRequest({
    requestId: send.mock.calls[0][1].requestId,
    result: { error: 'Operator failed.' },
  });

  await expect(promise).resolves.toEqual({ error: 'Operator failed.' });
});
