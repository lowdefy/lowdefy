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

// Config-compiler S1 byte-parity gate: every success fixture builds twice —
// once through the walker, once through the compiler (options.compiler) —
// and the captured artifacts must be byte-identical. Fixtures that hit an
// explicit S1-scope deferral (module refs, resolvers, dynamic transformers,
// .yaml.njk) are recorded as deferred, not silently skipped.
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'tests/success');

process.env.NEXTAUTH_SECRET = 'test-secret-for-snapshot-tests';

// Mock buildApp for a constant gitSha (mirrors index.snapshots.test.js).
jest.unstable_mockModule('./build/buildApp.js', () => ({
  default: ({ components }) => {
    if (!components.app) components.app = {};
    if (!components.app.html) components.app.html = {};
    if (!components.app.html.appendBody) components.app.html.appendBody = '';
    if (!components.app.html.appendHead) components.app.html.appendHead = '';
    components.appMeta = {
      slug: components.slug ?? null,
      name: components.name ?? null,
      version: components.version ?? null,
      description: components.description ?? null,
      license: components.license ?? null,
      lowdefyVersion: components.lowdefy ?? null,
      gitSha: 'test-git-sha-for-snapshots',
    };
    return components;
  },
}));

const mockWriteBuildArtifact = jest.fn();
jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => mockWriteBuildArtifact,
}));

jest.unstable_mockModule('./build/full/updateServerPackageJson.js', () => ({
  default: async () => {},
}));

jest.unstable_mockModule('./build/copyPublicFolder.js', () => ({
  default: async () => {},
}));

const { default: build } = await import('./index.js');
const { default: makeId } = await import('./utils/makeId.js');
const { snapshotTypesMap } = await import('./test-utils/runBuildForSnapshots.js');

const S1_DEFERRAL = /not yet compiled \(config-compiler S1 scope\)|Structural nunjucks templates/;
const S1_DEFERRAL_LINE =
  /[^\n]*(?:not yet compiled \(config-compiler S1 scope\)|Structural nunjucks templates)[^\n]*/;

function discoverFixtures() {
  return fs
    .readdirSync(fixturesDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(fixturesDir, entry.name, 'lowdefy.yaml'))
    )
    .map((entry) => entry.name)
    .sort();
}

async function runFixture(fixtureDir, compiler) {
  const configDir = path.join(fixturesDir, fixtureDir);
  const artifacts = {};
  makeId.reset();
  mockWriteBuildArtifact.mockReset();
  mockWriteBuildArtifact.mockImplementation((filePath, content) => {
    artifacts[filePath] = content;
  });
  const logger = {
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    succeed: jest.fn(),
  };
  try {
    await build({
      compiler,
      customTypesMap: snapshotTypesMap,
      directories: {
        config: configDir,
        build: path.join(configDir, '.lowdefy'),
        server: path.join(configDir, '.lowdefy', 'server'),
      },
      logger,
      stage: 'prod',
    });
  } catch (error) {
    // Surface the detail errors that went through the logger — the build
    // throws an aggregate.
    const logged = logger.error.mock.calls
      .flat()
      .map((e) => (e instanceof Error ? `${e.message}\n${e.stack}` : String(e)))
      .join('\n---\n');
    error.message = `${error.message}\nLogged errors:\n${logged}`;
    throw error;
  }
  return { artifacts, logger };
}

function canonicalJsonObject(content) {
  const parsed = JSON.parse(content);
  const sorted = {};
  for (const key of Object.keys(parsed).sort()) {
    sorted[key] = parsed[key];
  }
  return JSON.stringify(sorted);
}

const deferred = [];

describe('compiler parity — success fixture corpus', () => {
  const fixtures = discoverFixtures();

  test.each(fixtures.map((f) => [f]))('%s builds byte-identical', async (fixtureDir) => {
    const walker = await runFixture(fixtureDir, false);

    let compiled;
    try {
      compiled = await runFixture(fixtureDir, true);
    } catch (error) {
      if (S1_DEFERRAL.test(error.message)) {
        deferred.push(`${fixtureDir}: ${error.message.match(S1_DEFERRAL_LINE)[0].trim()}`);
        return;
      }
      throw error;
    }

    // A run that collected S1-deferral errors (build continues, throws the
    // aggregate later) surfaces them through the logger.
    const loggedErrors = compiled.logger.error.mock.calls
      .flat()
      .map((e) => (e instanceof Error ? e.message : String(e)))
      .join('\n');
    if (S1_DEFERRAL.test(loggedErrors)) {
      deferred.push(`${fixtureDir}: ${loggedErrors.match(S1_DEFERRAL_LINE)[0].trim()}`);
      return;
    }

    expect(Object.keys(compiled.artifacts).sort()).toEqual(Object.keys(walker.artifacts).sort());
    for (const key of Object.keys(walker.artifacts).sort()) {
      if (key === 'refMap.json') {
        // The walker registers refMap entries in parallel-IO completion order
        // (siblings sync, children per read wave) — insertion order is
        // incidental, not a contract. Compare ids and entries canonically;
        // entry-internal key order still byte-checks.
        expect(canonicalJsonObject(compiled.artifacts[key])).toBe(
          canonicalJsonObject(walker.artifacts[key])
        );
        continue;
      }
      if (compiled.artifacts[key] !== walker.artifacts[key]) {
        // Surface the artifact name and first divergence point for diagnosis.
        const a = walker.artifacts[key];
        const b = compiled.artifacts[key];
        let i = 0;
        while (i < Math.min(a.length, b.length) && a[i] === b[i]) i += 1;
        const start = Math.max(0, i - 80);
        throw new Error(
          `Artifact "${key}" differs in fixture "${fixtureDir}" at offset ${i}:\n` +
            `walker:   …${a.slice(start, i + 120)}…\n` +
            `compiler: …${b.slice(start, i + 120)}…`
        );
      }
    }
  });

  afterAll(() => {
    // The compiled path writes its modules under each fixture's .lowdefy.
    for (const fixtureDir of fixtures) {
      fs.rmSync(path.join(fixturesDir, fixtureDir, '.lowdefy'), { recursive: true, force: true });
    }
    // S1b: walker delegation covers module/component/menu refs, resolver
    // refs, non-YAML content, and dynamic paths — the whole corpus must
    // build through the compiler. A deferral here is a regression.
    expect(deferred).toEqual([]);
  });
});
