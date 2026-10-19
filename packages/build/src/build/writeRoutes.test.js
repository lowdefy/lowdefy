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

import writeRoutes from './writeRoutes.js';
import testContext from '../test-utils/testContext.js';

test('writeRoutes writes each route with its page auth', async () => {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  context.routes = [
    { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}', segments: [], configKey: 'a' },
    { pageId: 'home', path: 'home', segments: [], configKey: 'b' },
  ];
  const components = {
    pages: [
      { pageId: 'ticket', auth: { public: false, roles: ['support'] } },
      { pageId: 'home', auth: { public: true } },
    ],
  };
  await writeRoutes({ components, context });
  expect(writeBuildArtifact).toHaveBeenCalledTimes(1);
  const [filePath, content] = writeBuildArtifact.mock.calls[0];
  expect(filePath).toEqual('routes.json');
  expect(JSON.parse(content)).toEqual([
    {
      pageId: 'ticket',
      path: 'tickets/{space}/{ticket_id}',
      auth: { public: false, roles: ['support'] },
    },
    { pageId: 'home', path: 'home', auth: { public: true } },
  ]);
});
