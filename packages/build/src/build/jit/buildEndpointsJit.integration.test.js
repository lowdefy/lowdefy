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

// The dev server rebuilds the endpoints an edit feeds alone, without a config
// build (buildEndpointsJit). These tests run the real shallowBuild, edit files
// on disk, rebuild the endpoints alone and compare with a config build of the
// same edit: the artifact, its errors and warnings and where they point.

import { vi, beforeEach, afterEach, describe, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializer } from '@lowdefy/helpers';
import { resolveConfigLocation } from '@lowdefy/errors';

const mockComputeAppMeta = (source = {}) => ({
  slug: source.slug ?? null,
  name: source.name ?? null,
  version: source.version ?? null,
  description: source.description ?? null,
  license: source.license ?? null,
  lowdefyVersion: source.lowdefy ?? null,
  gitSha: 'test-git-sha',
});
vi.doMock('../buildApp.js', () => ({
  computeAppMeta: mockComputeAppMeta,
  default: ({ components, context }) => {
    components.app = components.app ?? {};
    components.app.html = components.app.html ?? {};
    components.app.html.appendBody = components.app.html.appendBody ?? '';
    components.app.html.appendHead = components.app.html.appendHead ?? '';
    components.appMeta = context?.appMeta ?? mockComputeAppMeta(components);
    return components;
  },
}));
vi.doMock('../full/updateServerPackageJson.js', () => ({
  default: vi.fn(async () => {}),
}));
vi.doMock('../copyPublicFolder.js', () => ({
  default: vi.fn(async () => {}),
}));
vi.doMock('../copyAgentFileSystems.js', () => ({
  default: vi.fn(async () => {}),
}));

const { default: shallowBuild } = await import('./shallowBuild.js');
const { default: buildEndpointsJit } = await import('./buildEndpointsJit.js');
const { default: attributeEndpointWarnings } = await import('./attributeEndpointWarnings.js');
const { default: findEndpointsReadingFiles } = await import('./findEndpointsReadingFiles.js');
const { default: serializeBuildException } = await import('../../utils/serializeBuildException.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

const typesMap = {
  ...snapshotTypesMap,
  notifications: {
    ...snapshotTypesMap.notifications,
    NotificationEmail: { package: '@lowdefy/email-templates' },
  },
};

const logger = {
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  succeed: () => {},
};

const files = {
  'lowdefy.yaml': `lowdefy: local
name: Endpoint build test

modules:
  - id: inviter
    source: 'file:modules/inviter'

notifications:
  - id: hello
    type: NotificationEmail
    properties:
      subject: Hello
      message: Hi there

global:
  shared:
    _ref: shared/both.yaml

api:
  _build.array.concat:
    - - _ref: api/one.yaml
      - _ref: api/two.yaml
    - _ref: api/list.yaml
    - - _ref: api/both.yaml

pages:
  - _ref: pages/home.yaml
`,
  'api/one.yaml': `id: one
type: Api
routine:
  - id: render
    type: RenderNotification
    properties:
      notificationId: hello
      data: {}
  - ':return':
      _ref: api/shared/answer.yaml
`,
  'api/two.yaml': `id: two
type: Api
routine:
  - ':return':
      _ref: api/shared/answer.yaml
`,
  'api/list.yaml': `- id: three
  type: Api
  routine:
    - ':return': three
- id: four
  type: Api
  routine:
    - ':return': four
`,
  'api/both.yaml': `id: both
type: Api
routine:
  - ':return':
      _ref: shared/both.yaml
`,
  'api/shared/answer.yaml': `value: 42
`,
  'shared/both.yaml': `colour: blue
`,
  'pages/home.yaml': `id: home
type: Box
`,
  'modules/inviter/module.lowdefy.yaml': `name: Inviter

api:
  - _ref: api/send-invite.yaml
`,
  'modules/inviter/api/send-invite.yaml': `id: send-invite
type: Api
routine:
  - ':return': sent
`,
};

let root;
let configDir;

function writeFile(rel, content) {
  const full = path.join(configDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function readArtifact(buildDir, name) {
  return serializer.deserialize(JSON.parse(fs.readFileSync(path.join(buildDir, name), 'utf8')));
}

// An artifact with its config keys taken out: the two builds key nodes apart.
function readPlainArtifact(buildDir, name) {
  return JSON.parse(fs.readFileSync(path.join(buildDir, name), 'utf8'), (key, value) =>
    key === '~k' ? undefined : value
  );
}

async function configBuild(name) {
  const buildDir = path.join(root, name, 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  const result = await shallowBuild({
    customTypesMap: typesMap,
    directories: { config: configDir, build: buildDir, server: path.join(root, name) },
    logger,
    stage: 'dev',
  }).catch((error) => ({ error }));
  if (result.error) {
    return {
      buildDir,
      errors: (result.error.errors ?? [result.error]).map(serializeBuildException),
      warnings: (result.error.warnings ?? []).map(serializeBuildException),
    };
  }
  const warnings = result.context.warnings.map(serializeBuildException);
  attributeEndpointWarnings({
    endpointRegistry: result.endpointRegistry,
    keyMap: result.context.keyMap,
    warnings: result.context.warnings,
  });
  return { buildDir, result, warnings };
}

function endpointBuild({ build, endpointIds }) {
  return buildEndpointsJit({
    endpointIds,
    endpointRegistry: build.result.endpointRegistry,
    context: build.result.context,
    directories: { build: build.buildDir },
  });
}

function locations(warnings) {
  return warnings
    .map((warning) => ({ message: warning.message, source: warning.source }))
    .sort((a, b) => `${a.source}${a.message}`.localeCompare(`${b.source}${b.message}`));
}

function readersOf(build, file) {
  return findEndpointsReadingFiles({
    endpointRegistry: build.result.endpointRegistry,
    files: [file],
  });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-endpoint-build-'));
  configDir = path.join(root, 'config');
  for (const [rel, content] of Object.entries(files)) {
    writeFile(rel, content);
  }
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('the files each endpoint reads', () => {
  test('an endpoint file is read by its endpoint, a shared file by each endpoint that refs it', async () => {
    const build = await configBuild('dev');
    expect(readersOf(build, 'api/one.yaml')).toEqual(['one']);
    expect(readersOf(build, 'api/shared/answer.yaml').sort()).toEqual(['one', 'two']);
    expect(readersOf(build, 'api/list.yaml').sort()).toEqual(['four', 'three']);
    expect(readersOf(build, path.join(configDir, 'modules/inviter/api/send-invite.yaml'))).toEqual([
      'inviter/send-invite',
    ]);
  });

  test('a file the rest of the config reads rebuilds the config', async () => {
    const build = await configBuild('dev');
    expect(readersOf(build, 'lowdefy.yaml')).toBeNull();
    expect(readersOf(build, 'shared/both.yaml')).toBeNull();
    expect(readersOf(build, 'pages/home.yaml')).toBeNull();
    expect(
      readersOf(build, path.join(configDir, 'modules/inviter/module.lowdefy.yaml'))
    ).toBeNull();
  });
});

describe('an endpoint rebuilt alone', () => {
  test('writes the artifact a config build writes', async () => {
    const build = await configBuild('dev');
    writeFile('api/shared/answer.yaml', 'value: 43\n');
    const rebuilt = await endpointBuild({ build, endpointIds: ['one', 'two'] });
    expect(rebuilt.fallback).toBeUndefined();
    expect(rebuilt.endpointIds.sort()).toEqual(['one', 'two']);

    const full = await configBuild('full');
    for (const endpointId of ['one', 'two']) {
      expect(readPlainArtifact(build.buildDir, `api/${endpointId}.json`)).toEqual(
        readPlainArtifact(full.buildDir, `api/${endpointId}.json`)
      );
    }
    expect(readArtifact(build.buildDir, 'api/one.json').routine[1][':return']).toEqual({
      value: 43,
    });
  });

  test('rebuilds every endpoint of a file that holds several', async () => {
    const build = await configBuild('dev');
    writeFile(
      'api/list.yaml',
      files['api/list.yaml'].replace("':return': four", "':return': FOUR")
    );
    const rebuilt = await endpointBuild({ build, endpointIds: ['four'] });
    expect(rebuilt.endpointIds.sort()).toEqual(['four', 'three']);
    expect(readArtifact(build.buildDir, 'api/four.json').routine[0][':return']).toEqual('FOUR');
  });

  test('rebuilds a module endpoint', async () => {
    const build = await configBuild('dev');
    writeFile(
      'modules/inviter/api/send-invite.yaml',
      files['modules/inviter/api/send-invite.yaml'].replace('sent', 'queued')
    );
    const rebuilt = await endpointBuild({ build, endpointIds: ['inviter/send-invite'] });
    expect(rebuilt.fallback).toBeUndefined();
    const full = await configBuild('full');
    expect(readPlainArtifact(build.buildDir, 'api/inviter/send-invite.json')).toEqual(
      readPlainArtifact(full.buildDir, 'api/inviter/send-invite.json')
    );
  });

  test('lists the warnings a config build lists, at the same places', async () => {
    const build = await configBuild('dev');
    writeFile(
      'api/one.yaml',
      files['api/one.yaml'].replace('type: Api\n', 'type: Api\nmisspelt: true\n')
    );
    const rebuilt = await endpointBuild({ build, endpointIds: ['one'] });
    expect(rebuilt.fallback).toBeUndefined();
    const full = await configBuild('full');
    expect(locations(rebuilt.warnings)).toEqual(locations(full.warnings));
    expect(rebuilt.warnings.some((warning) => warning.source?.endsWith('api/one.yaml:1'))).toBe(
      true
    );

    // The warning goes once the edit is undone.
    writeFile('api/one.yaml', files['api/one.yaml']);
    const undone = await endpointBuild({ build, endpointIds: ['one'] });
    expect(locations(undone.warnings)).toEqual(locations(build.warnings));
  });

  test('writes the key and ref map entries its artifact names', async () => {
    const build = await configBuild('dev');
    writeFile(
      'api/two.yaml',
      files['api/two.yaml'].replace('routine:', 'description: Two\nroutine:')
    );
    // A description is read by MCP tools, so a changed one falls back.
    expect((await endpointBuild({ build, endpointIds: ['two'] })).fallback).toMatch('description');
    writeFile(
      'api/two.yaml',
      files['api/two.yaml'].replace("  - ':return':", "  - ':return': early\n  - ':return':")
    );
    const rebuilt = await endpointBuild({ build, endpointIds: ['two'] });
    expect(rebuilt.fallback).toBeUndefined();
    const artifact = readArtifact(build.buildDir, 'api/two.json');
    const mapsFiles = fs.readdirSync(path.join(build.buildDir, 'jitMaps'));
    expect(mapsFiles).toEqual(['endpoints-1-1.json']);
    const maps = readArtifact(build.buildDir, 'jitMaps/endpoints-1-1.json');
    const keyMap = { ...readArtifact(build.buildDir, 'keyMap.json'), ...maps.keyMap };
    const refMap = { ...readArtifact(build.buildDir, 'refMap.json'), ...maps.refMap };
    expect(
      resolveConfigLocation({
        configKey: artifact.routine[1]['~k'],
        keyMap,
        refMap,
        configDirectory: configDir,
      })
    ).toMatchObject({ source: expect.stringMatching(/api\/two\.yaml:5$/) });
    expect(
      resolveConfigLocation({
        configKey: artifact.routine[1][':return']['~k'],
        keyMap,
        refMap,
        configDirectory: configDir,
      })
    ).toMatchObject({ source: expect.stringMatching(/api\/shared\/answer\.yaml:1$/) });
  });
});

describe('falls back to a config build', () => {
  test.each([
    [
      'an endpoint id changes',
      'api/two.yaml',
      (content) => content.replace('id: two', 'id: twice'),
      'two',
      'holds changed',
    ],
    [
      'an endpoint type changes',
      'api/two.yaml',
      (content) => content.replace('type: Api', 'type: InternalApi'),
      'two',
      'type',
    ],
    [
      'an endpoint is added to a file',
      'api/list.yaml',
      (content) => `${content}- id: five\n  type: Api\n  routine:\n    - ':return': five\n`,
      'three',
      'holds changed',
    ],
    [
      'a build error',
      'api/one.yaml',
      (content) => content.replace('notificationId: hello', 'notificationId: nope'),
      'one',
      'errors',
    ],
    [
      'a type the app did not use',
      'api/two.yaml',
      (content) => content.replace("  - ':return':", "  - ':log': hi\n  - ':return':"),
      'two',
      'controls ":log"',
    ],
    ['a file that does not parse', 'api/two.yaml', () => 'id: [two', 'two', 'failed'],
    [
      'an unset environment variable',
      'api/two.yaml',
      (content) =>
        content.replace('_ref: api/shared/answer.yaml', '_build.env: LDF_TEST_UNSET_VARIABLE'),
      'two',
      'environment variable',
    ],
  ])('when %s', async (_name, file, edit, endpointId, reason) => {
    const build = await configBuild('dev');
    writeFile(file, edit(files[file]));
    const before = fs.readFileSync(path.join(build.buildDir, `api/${endpointId}.json`), 'utf8');
    const rebuilt = await endpointBuild({ build, endpointIds: [endpointId] });
    expect(rebuilt.fallback).toEqual(expect.stringContaining(reason));
    // Nothing is written: the config build writes the endpoint.
    expect(fs.readFileSync(path.join(build.buildDir, `api/${endpointId}.json`), 'utf8')).toEqual(
      before
    );
  });

  test('an endpoint with no file of its own', async () => {
    writeFile(
      'lowdefy.yaml',
      files['lowdefy.yaml'].replace(
        '    - - _ref: api/both.yaml\n',
        "    - - _ref: api/both.yaml\n      - id: inline\n        type: Api\n        routine:\n          - ':return': inline\n"
      )
    );
    const build = await configBuild('dev');
    expect(readersOf(build, 'lowdefy.yaml')).toBeNull();
    expect((await endpointBuild({ build, endpointIds: ['inline'] })).fallback).toMatch(
      'no source file'
    );
  });
});

describe('review cases', () => {
  test('a list that holds an inline endpoint and a ref to another rebuilds the config', async () => {
    writeFile(
      'lowdefy.yaml',
      files['lowdefy.yaml'].replace('    - _ref: api/list.yaml\n', '    - _ref: api/mixed.yaml\n')
    );
    writeFile(
      'api/mixed.yaml',
      "- id: three\n  type: Api\n  routine:\n    - ':return': three\n- _ref: api/four.yaml\n"
    );
    writeFile('api/four.yaml', "id: four\ntype: Api\nroutine:\n  - ':return': four\n");
    const build = await configBuild('dev');
    expect(readersOf(build, 'api/mixed.yaml')).toBeNull();
    expect(readersOf(build, 'api/four.yaml')).toEqual(['four']);
  });

  test('an undefined operator the config build warned about rebuilds the config', async () => {
    writeFile(
      'api/two.yaml',
      files['api/two.yaml'].replace('_ref: api/shared/answer.yaml', '_payloda: x')
    );
    const build = await configBuild('dev');
    expect(build.warnings.some((warning) => warning.message.includes('"_payloda"'))).toBe(true);
    writeFile(
      'api/two.yaml',
      `${fs.readFileSync(path.join(configDir, 'api/two.yaml'), 'utf8')}# edit\n`
    );
    expect((await endpointBuild({ build, endpointIds: ['two'] })).fallback).toMatch(
      'undefined type'
    );
  });

  test('~ignoreBuildChecks on the _ref that holds an endpoint rebuilds the config', async () => {
    writeFile(
      'lowdefy.yaml',
      files['lowdefy.yaml'].replace(
        '    - - _ref: api/one.yaml\n',
        "    - - _ref:\n          path: api/one.yaml\n          '~ignoreBuildChecks': true\n"
      )
    );
    const build = await configBuild('dev');
    expect((await endpointBuild({ build, endpointIds: ['one'] })).fallback).toMatch(
      'no source file'
    );
  });

  test('a warning in a file two endpoints share is listed once, as a config build lists it', async () => {
    writeFile('api/shared/answer.yaml', 'value: 42\nmisspelt:\n  _step: missing\n');
    const build = await configBuild('dev');
    writeFile('api/two.yaml', `${files['api/two.yaml']}# edit\n`);
    const rebuilt = await endpointBuild({ build, endpointIds: ['two'] });
    expect(rebuilt.fallback).toBeUndefined();
    const full = await configBuild('full');
    expect(full.warnings.filter((warning) => warning.source?.includes('answer.yaml'))).toHaveLength(1);
    expect(locations(rebuilt.warnings)).toEqual(locations(full.warnings));
  });

  test('one file named two ways is read by both endpoints', async () => {
    writeFile(
      'api/two.yaml',
      files['api/two.yaml'].replace(
        '_ref: api/shared/answer.yaml',
        '_ref: ./api/shared/answer.yaml'
      )
    );
    const build = await configBuild('dev');
    expect(readersOf(build, 'api/shared/answer.yaml').sort()).toEqual(['one', 'two']);
  });

  test('reordering the endpoints in a file rebuilds the config', async () => {
    const build = await configBuild('dev');
    const [three, four] = files['api/list.yaml'].split(/(?=^- id: four)/m);
    writeFile('api/list.yaml', `${four}${three}`);
    expect((await endpointBuild({ build, endpointIds: ['three'] })).fallback).toMatch(
      'holds changed'
    );
  });

  test('a second endpoint build keys on, and a config build after it starts afresh', async () => {
    const build = await configBuild('dev');
    writeFile('api/two.yaml', `${files['api/two.yaml']}# one\n`);
    expect((await endpointBuild({ build, endpointIds: ['two'] })).fallback).toBeUndefined();
    writeFile('api/two.yaml', `${files['api/two.yaml']}# two\n`);
    expect((await endpointBuild({ build, endpointIds: ['two'] })).fallback).toBeUndefined();
    expect(fs.readdirSync(path.join(build.buildDir, 'jitMaps')).sort()).toEqual([
      'endpoints-1-1.json',
      'endpoints-2-1.json',
    ]);
    const first = readArtifact(build.buildDir, 'jitMaps/endpoints-1-1.json');
    const second = readArtifact(build.buildDir, 'jitMaps/endpoints-2-1.json');
    expect(Object.keys(first.keyMap).filter((key) => Object.hasOwn(second.keyMap, key))).toEqual(
      []
    );

    const next = await configBuild('dev');
    expect(next.result.endpointRegistry.builds).toBe(0);
    writeFile('api/two.yaml', files['api/two.yaml']);
    expect((await endpointBuild({ build: next, endpointIds: ['two'] })).fallback).toBeUndefined();
  });
});
