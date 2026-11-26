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

import { expect, test, vi } from 'vitest';

const mockOpenBuildApp = vi.fn();
vi.doMock('./openBuildApp.js', () => ({ default: mockOpenBuildApp }));

const context = { directories: { config: '/app', server: '/app/.lowdefy/server' } };

test("openWorkerBuild returns the app when its build is the run's", async () => {
  const { default: openWorkerBuild } = await import('./openWorkerBuild.js');
  const app = { buildId: 'build-1', close: vi.fn() };
  mockOpenBuildApp.mockResolvedValueOnce({ app });
  await expect(openWorkerBuild({ buildId: 'build-1', context, secrets: {} })).resolves.toEqual({
    app,
  });
  expect(app.close).not.toHaveBeenCalled();
});

test('openWorkerBuild closes and refuses a build rebuilt since the run opened it', async () => {
  const { default: openWorkerBuild } = await import('./openWorkerBuild.js');
  const app = { buildId: 'build-2', close: vi.fn() };
  mockOpenBuildApp.mockResolvedValueOnce({ app });
  await expect(openWorkerBuild({ buildId: 'build-1', context, secrets: {} })).resolves.toEqual({
    refused: 'The build was rebuilt during the run.',
  });
  expect(app.close).toHaveBeenCalledTimes(1);
});

test('openWorkerBuild passes on a refused open', async () => {
  const { default: openWorkerBuild } = await import('./openWorkerBuild.js');
  mockOpenBuildApp.mockResolvedValueOnce({ refused: 'No build.' });
  await expect(openWorkerBuild({ buildId: 'build-1', context, secrets: {} })).resolves.toEqual({
    refused: 'No build.',
  });
});
