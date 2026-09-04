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
import path from 'path';
import { fileURLToPath } from 'url';

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import createParityHarness, { normalize } from './test/createParityHarness.js';
import createTestOperators from './test/createTestOperators.js';

// The corpus is every page artefact the build's success fixtures produce: real
// post-addKeys trees, real `~k`, real operator shapes, including the fixtures
// that exercise runtime components, modules and JIT-built pages.
const successDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../build/src/tests/success'
);

function readCorpus() {
  const pages = [];
  fs.readdirSync(successDirectory)
    .sort()
    .forEach((fixture) => {
      const snapshotPath = path.join(successDirectory, fixture, 'snapshot.json');
      if (!fs.existsSync(snapshotPath)) return;
      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      Object.keys(snapshot)
        .filter((artefact) => artefact.startsWith('pages/'))
        .forEach((artefact) =>
          pages.push({ fixture, artefact, tree: normalize(snapshot[artefact]) })
        );
    });
  return pages;
}

function collectOperatorNames(node, names = new Set()) {
  if (type.isArray(node)) {
    node.forEach((item) => collectOperatorNames(item, names));
    return names;
  }
  if (!type.isObject(node)) return names;
  const keys = Object.keys(node);
  if (keys.length === 1 && keys[0].startsWith('_')) {
    names.add(keys[0].split('.')[0]);
  }
  keys.forEach((key) => collectOperatorNames(node[key], names));
  return names;
}

const corpus = readCorpus();

const operatorNames = [
  ...corpus.reduce((names, page) => collectOperatorNames(page.tree, names), new Set()),
]
  .filter((name) => !name.startsWith('__'))
  .sort();

// Every third operator throws and every fifth raises a ConfigError, so the
// corpus exercises the failing-site contract as well as the happy path.
const operators = createTestOperators({
  names: operatorNames,
  throwing: operatorNames.filter((_, index) => index % 3 === 0),
  configErrors: operatorNames.filter((_, index) => index % 5 === 1),
  reentrant: operatorNames.filter((_, index) => index % 7 === 2),
});

// Runtime components and archetypes clone `~k` onto every instance, so one key
// can name two structurally different sites on one page. The emitter refuses to
// key those; V-57 cannot ship until expansion issues fresh keys.
const duplicateKeyPages = [];
const parityCases = [];

corpus.forEach((page) => {
  const { tree } = page;
  let module;
  try {
    module = createParityHarness({ env: 'web', operators }).emit(tree).module;
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    duplicateKeyPages.push({ ...page, message: error.message });
    return;
  }
  Object.keys(module.closures).forEach((key) => {
    parityCases.push({ ...page, key, tree, closure: module.closures[key] });
  });
});

test('the corpus is the full set of build page artefacts', () => {
  expect(corpus.length).toBeGreaterThan(300);
  expect(operatorNames.length).toBeGreaterThanOrEqual(35);
  expect(parityCases.length).toBeGreaterThan(300);
  process.stdout.write(
    `\ncorpus: ${corpus.length} pages, ${operatorNames.length} operators, ` +
      `${parityCases.length} closure parse roots, ${duplicateKeyPages.length} refused pages\n`
  );
});

describe.each(['web', 'server'])('%s corpus parity', (env) => {
  test('every emitted closure matches the parser on output, markers and errors', () => {
    const harness = createParityHarness({ env, operators });
    const divergences = [];
    parityCases.forEach(({ fixture, artefact, key, tree, closure }) => {
      const node = harness.findNode(tree, key);
      const result = harness.run({
        tree: node,
        closure,
        arrayIndices: [2],
        location: 'page.$.block',
      });
      const walker = JSON.stringify([
        result.walker.output,
        result.walker.markers,
        result.walker.errors,
      ]);
      const compiled = JSON.stringify([
        result.closure.output,
        result.closure.markers,
        result.closure.errors,
      ]);
      if (walker !== compiled) {
        divergences.push({ fixture, artefact, key, walker, compiled });
      }
    });
    expect(divergences).toEqual([]);
  });
});

test('the only pages the emitter refuses are the ones whose expansion reuses ~k', () => {
  expect(duplicateKeyPages.map((page) => `${page.fixture}/${page.artefact}`)).toEqual([
    '103-runtime-components/pages/controls.json',
  ]);
  expect(duplicateKeyPages[0].message).toMatch(/names two different operator sites/);
});
