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

import discoverJourneys from './discoverJourneys.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let configDirectory;
let context;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-journeys-'));
  context = {
    directories: {
      config: configDirectory,
      journeys: path.join(configDirectory, 'tests', 'journeys'),
    },
  };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeJourneyFile(fileName, content) {
  const filePath = path.join(configDirectory, 'tests', 'journeys', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return filePath;
}

test('discoverJourneys returns an empty array when tests/journeys does not exist', () => {
  expect(discoverJourneys({ context })).toEqual([]);
});

test('discoverJourneys returns an empty array when tests/journeys is empty', () => {
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys'), { recursive: true });
  expect(discoverJourneys({ context })).toEqual([]);
});

test('discoverJourneys normalises a single-object file to one journey', () => {
  const filePath = writeJourneyFile(
    'form.yaml',
    `name: submits the form
pageId: form
steps:
  - click: submit
`
  );
  expect(discoverJourneys({ context })).toEqual([
    {
      filePath,
      journeyIndex: 0,
      journey: { name: 'submits the form', pageId: 'form', steps: [{ click: 'submit' }] },
    },
  ]);
});

test('discoverJourneys expands an array file to one entry per journey with the same filePath', () => {
  const filePath = writeJourneyFile(
    'controls.yaml',
    `- name: first
  pageId: controls
  steps:
    - click: a
- name: second
  pageId: controls
  steps:
    - click: b
`
  );
  const journeys = discoverJourneys({ context });
  expect(journeys.map((item) => item.journey.name)).toEqual(['first', 'second']);
  expect(journeys.map((item) => item.journeyIndex)).toEqual([0, 1]);
  expect(journeys.every((item) => item.filePath === filePath)).toBe(true);
});

test('discoverJourneys sorts files by name and ignores non-yaml files', () => {
  writeJourneyFile('b-second.yaml', 'name: b\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('a-first.yml', 'name: a\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('c-third.yaml', 'name: c\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('README.md', '# not a journey');
  expect(discoverJourneys({ context }).map((item) => item.journey.name)).toEqual(['a', 'b', 'c']);
});

test('discoverJourneys reports a file with invalid YAML as an entry with an error instead of throwing', () => {
  const filePath = writeJourneyFile('broken.yaml', 'name: [unclosed\npageId: p\n');
  writeJourneyFile('ok.yaml', 'name: ok\npageId: p\nsteps: [{ click: x }]\n');
  const journeys = discoverJourneys({ context });
  expect(journeys).toHaveLength(2);
  expect(journeys[0].filePath).toEqual(filePath);
  expect(journeys[0].journey).toBeUndefined();
  expect(journeys[0].error).toMatch(/^Invalid YAML: /);
  expect(journeys[1].journey.name).toEqual('ok');
});

test('discoverJourneys reads the journeys directory and not tests/journeys when another is set', () => {
  writeJourneyFile('default.yaml', 'name: default\npageId: p\nsteps: [{ click: x }]\n');
  const directory = path.join(configDirectory, 'tests', 'auth-journeys');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'sign-up.yaml'),
    'name: sign up\npageId: p\nsteps: [{ click: x }]\n'
  );
  context.directories.journeys = directory;
  expect(discoverJourneys({ context })).toEqual([
    {
      filePath: path.join(directory, 'sign-up.yaml'),
      journeyIndex: 0,
      journey: { name: 'sign up', pageId: 'p', steps: [{ click: 'x' }] },
    },
  ]);
});

test('discoverJourneys reads sub-folders of tests/journeys and skips every folder starting with "_"', () => {
  writeJourneyFile('top.yaml', 'name: top\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('review/approve.yaml', 'name: approve\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('review/deep/reject.yml', 'name: reject\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('_candidates/dev/mined.yaml', 'name: mined\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('review/_drafts/draft.yaml', 'name: draft\npageId: p\nsteps: [{ click: x }]\n');
  expect(discoverJourneys({ context }).map((item) => item.journey.name)).toEqual([
    'approve',
    'reject',
    'top',
  ]);
});

function writeConfigFile(relativePath, content) {
  const filePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return filePath;
}

test('discoverJourneys resolves _ref from the config root in a step, a step list, cases and a stub', () => {
  writeConfigFile('tests/shared/open.yaml', 'goto: form\n');
  writeConfigFile('tests/shared/steps.yaml', '- click: submit\n- expect: { visible: done }\n');
  writeConfigFile('tests/shared/cases.json', JSON.stringify([{ name: 'one', value: 1 }]));
  writeConfigFile(
    'tests/shared/stubs/pdf.yml',
    'connectionType: AxiosHttp\nrequestType: AxiosHttp\nanswer: { data: pdf }\n'
  );
  const filePath = writeJourneyFile(
    'refs.yaml',
    `- name: one step
  pageId: form
  steps:
    - _ref: tests/shared/open.yaml
- name: step list
  pageId: form
  cases:
    _ref: tests/shared/cases.json
  stubs:
    - _ref: { path: tests/shared/stubs/pdf.yml }
  steps:
    _ref: tests/shared/steps.yaml
`
  );
  expect(discoverJourneys({ context })).toEqual([
    {
      filePath,
      journeyIndex: 0,
      journey: { name: 'one step', pageId: 'form', steps: [{ goto: 'form' }] },
    },
    {
      filePath,
      journeyIndex: 1,
      journey: {
        name: 'step list',
        pageId: 'form',
        cases: [{ name: 'one', value: 1 }],
        stubs: [{ connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: { data: 'pdf' } }],
        steps: [{ click: 'submit' }, { expect: { visible: 'done' } }],
      },
    },
  ]);
});

test('discoverJourneys resolves a _ref in a referred file from the config root too', () => {
  writeConfigFile('tests/shared/steps.yaml', '- _ref: tests/shared/deeper/click.yaml\n');
  writeConfigFile('tests/shared/deeper/click.yaml', 'click: submit\n');
  writeJourneyFile(
    'nested.yaml',
    'name: nested\npageId: form\nsteps:\n  _ref: tests/shared/steps.yaml\n'
  );
  expect(discoverJourneys({ context })[0].journey.steps).toEqual([{ click: 'submit' }]);
});

test('discoverJourneys reads one shared file twice in a journey without calling it a loop', () => {
  writeConfigFile('tests/shared/click.yaml', 'click: submit\n');
  writeJourneyFile(
    'twice.yaml',
    'name: twice\npageId: form\nsteps:\n  - _ref: tests/shared/click.yaml\n  - _ref: tests/shared/click.yaml\n'
  );
  expect(discoverJourneys({ context })[0].journey.steps).toEqual([
    { click: 'submit' },
    { click: 'submit' },
  ]);
});

test('discoverJourneys fails a file whose refs make a loop, naming the loop', () => {
  writeConfigFile('tests/shared/a.yaml', '_ref: tests/shared/b.yaml\n');
  writeConfigFile('tests/shared/b.yaml', '- _ref: tests/shared/a.yaml\n');
  const filePath = writeJourneyFile(
    'loop.yaml',
    'name: loops\npageId: form\nsteps:\n  _ref: tests/shared/a.yaml\n'
  );
  expect(discoverJourneys({ context })).toEqual([
    {
      filePath,
      journeyIndex: 0,
      journey: undefined,
      error:
        '_ref "tests/shared/a.yaml" makes a loop: tests/journeys/loop.yaml -> tests/shared/a.yaml -> tests/shared/b.yaml -> tests/shared/a.yaml.',
    },
  ]);
});

test('discoverJourneys fails a file that refers back to itself', () => {
  const filePath = writeJourneyFile(
    'self.yaml',
    'name: self\npageId: form\nsteps:\n  _ref: tests/journeys/self.yaml\n'
  );
  expect(discoverJourneys({ context })[0]).toMatchObject({
    filePath,
    journey: undefined,
    error: expect.stringContaining(
      'makes a loop: tests/journeys/self.yaml -> tests/journeys/self.yaml'
    ),
  });
});

test.each([
  [
    'vars',
    '{ path: tests/shared/steps.yaml, vars: { a: 1 } }',
    '_ref "tests/shared/steps.yaml" in a journey file takes only a path, not "vars"',
  ],
  [
    'a resolver',
    '{ path: tests/shared/steps.yaml, resolver: resolvers/steps.js }',
    'not "resolver"',
  ],
  [
    'a transformer',
    '{ path: tests/shared/steps.yaml, transformer: transformers/steps.js }',
    'not "transformer"',
  ],
  [
    'a nunjucks template',
    'tests/shared/steps.yaml.njk',
    '_ref "tests/shared/steps.yaml.njk": a journey file refers only to .yaml, .yml or .json files',
  ],
  [
    'a resolver with no path',
    '{ resolver: resolvers/steps.js }',
    'takes a path, as "_ref: <path>"',
  ],
  [
    'a key beside the ref',
    'tests/shared/steps.yaml\n  extra: 1',
    'has other keys beside it (extra)',
  ],
])('discoverJourneys refuses a _ref with %s as an error item', (_, ref, message) => {
  writeConfigFile('tests/shared/steps.yaml', '- click: submit\n');
  writeConfigFile('tests/shared/steps.yaml.njk', '- click: submit\n');
  const filePath = writeJourneyFile(
    'refused.yaml',
    `name: refused\npageId: form\nsteps:\n  _ref: ${ref}\n`
  );
  const [item] = discoverJourneys({ context });
  expect(item).toMatchObject({ filePath, journeyIndex: 0, journey: undefined });
  expect(item.error).toContain(message);
});

test('discoverJourneys makes a _ref to a missing file an error item naming the path', () => {
  const filePath = writeJourneyFile(
    'missing.yaml',
    'name: missing\npageId: form\nsteps:\n  _ref: tests/shared/nothing.yaml\n'
  );
  const [item] = discoverJourneys({ context });
  expect(item).toMatchObject({ filePath, journeyIndex: 0, journey: undefined });
  expect(item.error).toBe(
    `_ref "tests/shared/nothing.yaml": no file at ${path.join(
      configDirectory,
      'tests',
      'shared',
      'nothing.yaml'
    )}. Paths in _ref are from the config root.`
  );
});

test('discoverJourneys makes a referred file that does not parse an error item', () => {
  writeConfigFile('tests/shared/bad.json', '{ nope');
  writeJourneyFile('bad.yaml', 'name: bad\npageId: form\nsteps:\n  _ref: tests/shared/bad.json\n');
  expect(discoverJourneys({ context })[0].error).toMatch(
    /^_ref "tests\/shared\/bad.json" does not parse: /
  );
});
