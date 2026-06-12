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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializer } from '@lowdefy/helpers';

import readBuildApiArtifacts from './readBuildApiArtifacts.mjs';

function makeBuildDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-read-api-'));
}

// Mirror writeApi: each endpoint is serialized to build/api/<endpointId>.json.
// Scoped module endpointIds contain a "/", so the file lands in a nested directory.
function writeEndpoint(buildDir, endpoint) {
  const filePath = path.join(buildDir, 'api', `${endpoint.endpointId}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, serializer.serializeToString(endpoint));
}

test('readBuildApiArtifacts returns [] when the api directory does not exist', () => {
  const buildDir = makeBuildDir();
  try {
    expect(readBuildApiArtifacts(buildDir)).toEqual([]);
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
});

test('readBuildApiArtifacts returns [] when the api directory is empty', () => {
  const buildDir = makeBuildDir();
  fs.mkdirSync(path.join(buildDir, 'api'));
  try {
    expect(readBuildApiArtifacts(buildDir)).toEqual([]);
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
});

test('readBuildApiArtifacts reads and deserializes endpoint artifacts with endpointId and type', () => {
  const buildDir = makeBuildDir();
  writeEndpoint(buildDir, { id: 'endpoint:my_api', endpointId: 'my_api', type: 'Api' });
  writeEndpoint(buildDir, {
    id: 'endpoint:internal_api',
    endpointId: 'internal_api',
    type: 'InternalApi',
  });
  try {
    const result = readBuildApiArtifacts(buildDir);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ endpointId: 'my_api', type: 'Api' }),
        expect.objectContaining({ endpointId: 'internal_api', type: 'InternalApi' }),
      ])
    );
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
});

test('readBuildApiArtifacts reads scoped module endpoints from nested subdirectories', () => {
  const buildDir = makeBuildDir();
  // Top-level endpoint at build/api/top_api.json
  writeEndpoint(buildDir, { id: 'endpoint:top_api', endpointId: 'top_api', type: 'Api' });
  // Module endpoint at build/api/inviter/send-invite.json (scoped id contains "/")
  writeEndpoint(buildDir, {
    id: 'endpoint:inviter/send-invite',
    endpointId: 'inviter/send-invite',
    type: 'Api',
  });
  try {
    const result = readBuildApiArtifacts(buildDir);
    expect(result.map((c) => c.endpointId).sort()).toEqual(['inviter/send-invite', 'top_api']);
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
});

test('readBuildApiArtifacts ignores non-json files in the api directory', () => {
  const buildDir = makeBuildDir();
  writeEndpoint(buildDir, { id: 'endpoint:my_api', endpointId: 'my_api', type: 'Api' });
  fs.writeFileSync(path.join(buildDir, 'api', 'notes.txt'), 'ignore me');
  try {
    const result = readBuildApiArtifacts(buildDir);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ endpointId: 'my_api', type: 'Api' }));
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
});
