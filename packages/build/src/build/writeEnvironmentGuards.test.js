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

import writeEnvironmentGuards from './writeEnvironmentGuards.js';
import testContext from '../test-utils/testContext.js';

test("writeEnvironmentGuards writes environmentGuards.json with environmentGuards 'all'", async () => {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  context.environmentGuards = 'all';
  const environmentGuards = { staging: { secrets: { MONGODB_URI: 'staging' }, env: {} } };
  await writeEnvironmentGuards({ components: { environmentGuards }, context });
  expect(writeBuildArtifact).toHaveBeenCalledTimes(1);
  const [name, content] = writeBuildArtifact.mock.calls[0];
  expect(name).toEqual('environmentGuards.json');
  expect(JSON.parse(content)).toEqual(environmentGuards);
});

test("writeEnvironmentGuards writes {} with environmentGuards 'all' and no environments", async () => {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  context.environmentGuards = 'all';
  await writeEnvironmentGuards({ components: { environmentGuards: {} }, context });
  expect(JSON.parse(writeBuildArtifact.mock.calls[0][1])).toEqual({});
});

test('writeEnvironmentGuards writes nothing without the option', async () => {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  await writeEnvironmentGuards({ components: {}, context });
  expect(writeBuildArtifact).not.toHaveBeenCalled();
});
