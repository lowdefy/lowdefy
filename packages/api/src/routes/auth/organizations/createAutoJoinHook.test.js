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

import createAutoJoinHook from './createAutoJoinHook.js';

test('autoJoinHook adds the new user to the pinned org with the built-in member role', async () => {
  const addMember = jest.fn(async () => ({ id: 'member_1' }));
  const auth = {
    $context: Promise.resolve({
      adapter: {
        findOne: jest.fn(async () => ({ id: 'org_pinned', slug: 'default' })),
        create: jest.fn(),
      },
    }),
    api: { addMember },
  };
  const hook = createAutoJoinHook({
    getAuth: () => auth,
    organizations: { policy: 'pinned', org: 'default', signup: 'open' },
  });

  await hook({ id: 'user_1', email: 'a@b.c' });

  expect(addMember).toHaveBeenCalledWith({
    body: {
      userId: 'user_1',
      organizationId: 'org_pinned',
      role: 'member',
    },
  });
});
