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

import { jest } from '@jest/globals';

jest.unstable_mockModule('./request.js', () => ({
  default: jest.fn(() => Promise.resolve({})),
}));

test('callAPI builds a relative URL from apiBase', async () => {
  const { default: request } = await import('./request.js');
  const { default: createCallAPI } = await import('./createCallAPI.js');
  const callAPI = createCallAPI({ apiBase: '' });
  await callAPI({ payload: { x: 1 }, endpointId: 'ep_1', pageId: 'page_1', blockId: 'b' });
  expect(request).toHaveBeenCalledWith({
    url: '/api/endpoints/ep_1',
    method: 'POST',
    body: { payload: { x: 1 }, pageId: 'page_1', blockId: 'b' },
  });
});

test('callAPI builds an absolute URL when apiBase is a remote origin', async () => {
  const { default: request } = await import('./request.js');
  const { default: createCallAPI } = await import('./createCallAPI.js');
  const callAPI = createCallAPI({ apiBase: 'https://app.acme.com' });
  await callAPI({ payload: {}, endpointId: 'ep_1', pageId: 'page_1', blockId: 'b' });
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({ url: 'https://app.acme.com/api/endpoints/ep_1' })
  );
});
