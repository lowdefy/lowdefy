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

const mockOpenPage = jest.fn();
jest.unstable_mockModule('./getBrowser.js', () => ({ openPage: mockOpenPage }));

const { default: createJourneyActors } = await import('./createJourneyActors.js');

beforeEach(() => {
  mockOpenPage.mockReset();
  mockOpenPage.mockImplementation(async ({ user }) => ({
    context: { close: jest.fn(async () => {}) },
    page: {},
    user,
  }));
});

const users = {
  main: { id: 'u_main', roles: ['member'] },
  outsider: { id: 'u_9', roles: ['admin'], organizationId: 'org_b' },
};

function create(overrides) {
  return createJourneyActors({
    browser: {},
    origin: 'http://localhost:3227',
    basePath: '',
    pageId: 'tickets',
    user: { id: 'u_1', roles: ['admin'] },
    dataCookie: 'session1',
    users,
    mainActor: 'main',
    ...overrides,
  });
}

test('switchTo opens an actor named after a data set user as that user, with the data cookie', async () => {
  const actors = create();
  await actors.switchTo('outsider');
  expect(mockOpenPage).toHaveBeenCalledWith(
    expect.objectContaining({ user: users.outsider, dataCookie: 'session1' })
  );
});

test('switchTo opens the main actor and any other name as the journey user', async () => {
  const actors = create();
  await actors.switchTo('main');
  await actors.switchTo('reviewer');
  expect(mockOpenPage.mock.calls.map(([options]) => options.user)).toEqual([
    { id: 'u_1', roles: ['admin'] },
    { id: 'u_1', roles: ['admin'] },
  ]);
  expect(mockOpenPage.mock.calls.every(([options]) => options.dataCookie === 'session1')).toBe(
    true
  );
});

test('switchTo opens every actor as the journey user without data set users', async () => {
  const actors = create({ users: undefined, dataCookie: undefined });
  await actors.switchTo('outsider');
  expect(mockOpenPage).toHaveBeenCalledWith(
    expect.objectContaining({ user: { id: 'u_1', roles: ['admin'] }, dataCookie: undefined })
  );
});
