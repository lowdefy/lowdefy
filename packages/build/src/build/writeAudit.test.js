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

import writeAudit from './writeAudit.js';

test('writeAudit writes empty object when audit is undefined', async () => {
  const writeBuildArtifact = jest.fn();
  await writeAudit({ components: {}, context: { writeBuildArtifact } });
  expect(writeBuildArtifact).toHaveBeenCalledTimes(1);
  expect(writeBuildArtifact.mock.calls[0][0]).toBe('audit.json');
  const written = JSON.parse(writeBuildArtifact.mock.calls[0][1]);
  expect(written).toEqual({});
});

test('writeAudit serializes audit config to audit.json artifact', async () => {
  const writeBuildArtifact = jest.fn();
  const audit = {
    connectionId: 'audit_db',
    events: ['request'],
    requestType: 'MongoDBInsertMany',
    severity: 'medium',
  };
  await writeAudit({ components: { audit }, context: { writeBuildArtifact } });
  const written = JSON.parse(writeBuildArtifact.mock.calls[0][1]);
  expect(written.connectionId).toBe('audit_db');
  expect(written.events).toEqual(['request']);
  expect(written.requestType).toBe('MongoDBInsertMany');
});
