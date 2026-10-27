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

import getThreadEndpoints from './getThreadEndpoints.js';

test('getThreadEndpoints names every ai-assistant endpoint of the module entry', () => {
  expect(getThreadEndpoints({ module: 'ai-assistant', scope: 'acme' })).toEqual({
    deleteThread: 'ai-assistant/delete-thread',
    getActiveThread: 'ai-assistant/get-active-thread',
    getThread: 'ai-assistant/get-thread',
    listThreads: 'ai-assistant/list-threads',
    saveThread: 'ai-assistant/save-thread',
    titleThread: 'ai-assistant/title-thread',
  });
});

test('getThreadEndpoints takes named endpoints over the module, and null for neither', () => {
  expect(
    getThreadEndpoints({ endpoints: { listThreads: 'my-threads', saveThread: 'keep-thread' } })
  ).toEqual({
    deleteThread: null,
    getActiveThread: null,
    getThread: null,
    listThreads: 'my-threads',
    saveThread: 'keep-thread',
    titleThread: null,
  });
  expect(
    getThreadEndpoints({ module: 'chat', endpoints: { getThread: 'load-thread' } }).getThread
  ).toEqual('load-thread');
});

test('getThreadEndpoints drops titles with generateTitles false', () => {
  expect(getThreadEndpoints({ module: 'chat', generateTitles: false }).titleThread).toBeNull();
});

test('getThreadEndpoints is null when the chat keeps no threads', () => {
  expect(getThreadEndpoints(undefined)).toBeNull();
  expect(getThreadEndpoints(null)).toBeNull();
});
