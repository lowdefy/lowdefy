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

// Regression: pages written inline in lowdefy.yaml are built only by the dev
// skeleton build (buildShallowPages) - buildPageJit serves them from that
// artifact without re-validating. The skeleton build must run the same page
// reference checks as the full build over them, or a Link to a page that does
// not exist warns in `lowdefy build` and stays silent in `lowdefy dev`.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.AUTH_SECRET = 'test-secret-for-integration-test';

jest.unstable_mockModule('../buildApp.js', () => ({
  default: ({ components }) => {
    components.app = components.app ?? {};
    components.app.html = components.app.html ?? {};
    components.app.html.appendBody = components.app.html.appendBody ?? '';
    components.app.html.appendHead = components.app.html.appendHead ?? '';
    components.appMeta = {
      slug: components.slug ?? null,
      name: components.name ?? null,
      version: components.version ?? null,
      description: components.description ?? null,
      license: components.license ?? null,
      lowdefyVersion: components.lowdefy ?? null,
      gitSha: 'test-git-sha',
    };
    return components;
  },
}));
jest.unstable_mockModule('../full/updateServerPackageJson.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyPublicFolder.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyAgentFileSystems.js', () => ({
  default: jest.fn(async () => {}),
}));

const { default: shallowBuild } = await import('./shallowBuild.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

// The dev server's types map includes the CallAPI action plugin.
const typesMap = {
  ...snapshotTypesMap,
  actions: {
    ...snapshotTypesMap.actions,
    CallAPI: { package: '@lowdefy/actions-core' },
  },
};

const logger = {
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  succeed: () => {},
};

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-inline-refs-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

async function runShallowBuild({ files }) {
  const configDir = path.join(root, 'config');
  const serverDir = path.join(root, '.lowdefy', 'server');
  const buildDir = path.join(serverDir, 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  Object.entries(files).forEach(([fileName, content]) => {
    const filePath = path.join(configDir, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  });
  const result = await shallowBuild({
    customTypesMap: typesMap,
    directories: { config: configDir, build: buildDir, server: serverDir },
    logger,
    stage: 'dev',
  });
  return result.context.warnings.map((warning) => warning.message);
}

const refPageYaml = `id: other
type: Box
`;

test('skeleton build warns when an inline page links to a page that does not exist', async () => {
  const messages = await runShallowBuild({
    files: {
      'lowdefy.yaml': `lowdefy: local
name: Inline Link Test
pages:
  - id: inline
    type: Box
    blocks:
      - id: go
        type: Button
        events:
          onClick:
            - id: link
              type: Link
              params: missing_page
  - _ref: other.yaml
`,
      'other.yaml': refPageYaml,
    },
  });

  expect(messages).toContainEqual(
    expect.stringContaining(
      'Page "missing_page" not found. Link on page "inline" references non-existent page.'
    )
  );
});

test('skeleton build accepts inline page links to inline and referenced pages', async () => {
  const messages = await runShallowBuild({
    files: {
      'lowdefy.yaml': `lowdefy: local
name: Inline Link Test
pages:
  - id: inline
    type: Box
    blocks:
      - id: go_other
        type: Button
        events:
          onClick:
            - id: link_ref
              type: Link
              params: other
      - id: go_second
        type: Button
        events:
          onClick:
            - id: link_inline
              type: Link
              params:
                pageId: second
  - id: second
    type: Box
  - _ref: other.yaml
`,
      'other.yaml': refPageYaml,
    },
  });

  expect(messages.filter((message) => message.includes('not found. Link on page'))).toEqual([]);
});

test('skeleton build runs the full build CallAPI and state checks over inline pages', async () => {
  const messages = await runShallowBuild({
    files: {
      'lowdefy.yaml': `lowdefy: local
name: Inline Refs Test
pages:
  - id: inline
    type: Box
    blocks:
      - id: call
        type: Button
        events:
          onClick:
            - id: call_api
              type: CallAPI
              params:
                endpointId: missing_endpoint
      - id: label
        type: Title
        properties:
          content:
            _state: undefined_key
`,
    },
  });

  expect(messages).toContainEqual(
    expect.stringContaining(
      'CallAPI action on page "inline" references non-existent endpoint "missing_endpoint".'
    )
  );
  expect(messages).toContainEqual(
    expect.stringContaining('_state references "undefined_key" on page "inline"')
  );
});
