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

// E1 designed divergence — see the refMap.json comparison below.
const REFMAP_DIVERGENCE_FIXTURES = new Set(['77-cross-module-menu-refs']);

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
  // Fixtures exercising build OPTIONS (global refResolver) declare them in a
  // buildOptions.json — applied to walker and compiler builds alike.
  let buildOptions = {};
  const optionsPath = path.join(configDir, 'buildOptions.json');
  if (fs.existsSync(optionsPath)) {
    buildOptions = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));
  }
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
      ...buildOptions,
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

// refMap ids are internal pointers (tree paths or allocation-order counters)
// — the contract is what an entry resolves to: its source line, file path,
// stored original def, and the same data up its parent chain. Compare the
// two maps as sorted multisets of those profiles, id-free and order-free.
function refMapProfiles(content) {
  const refMap = JSON.parse(content);
  const profile = (id, depth = 0) => {
    const entry = refMap[id];
    if (!entry || depth > 64) return null;
    return {
      lineNumber: entry.lineNumber ?? null,
      path: entry.path ?? null,
      original: entry.original ?? null,
      parent:
        entry.parent === null || entry.parent === undefined
          ? null
          : profile(entry.parent, depth + 1),
    };
  };
  return Object.keys(refMap)
    .map((id) => JSON.stringify(profile(id)))
    .sort();
}

// S2a: compiled builds use lexical ~k ids (`<fileId>:<n>`), the walker uses
// counter ids — the id STRINGS differ by design, everything else must not.
// Tree artifacts are rewritten to positional ids by first-encounter order
// over a deterministic walk (sorted artifact names, parse order within
// each), then byte-compared. The inverse map (canonical → original id) pairs
// walker and compiler ids occupying the same position for the keyMap gate.
function canonicalizeKeyIds(artifacts) {
  const idMap = new Map();
  const inverse = new Map();
  const rename = (id) => {
    if (typeof id !== 'string') return id;
    if (!idMap.has(id)) {
      const canonical = `k${idMap.size.toString(36)}`;
      idMap.set(id, canonical);
      inverse.set(canonical, id);
    }
    return idMap.get(id);
  };
  const walk = (node) => {
    if (Array.isArray(node)) {
      return node.map(walk);
    }
    if (node && typeof node === 'object') {
      const out = {};
      for (const [key, value] of Object.entries(node)) {
        if (key === '~k' || key === '~k_parent') {
          out[key] = rename(value);
        } else {
          out[key] = walk(value);
        }
      }
      return out;
    }
    return node;
  };
  const result = {};
  for (const name of Object.keys(artifacts).sort()) {
    const content = artifacts[name];
    // ES-module artifacts derive 1:1 from JSON twins compared here — their
    // embedded ~k ids differ by design (lexical vs counter) and behavior is
    // gated by the compilerClosures round-trip.
    if (name.endsWith('.mjs')) {
      continue;
    }
    if (!name.endsWith('.json') || name === 'refMap.json' || name === 'keyMap.json') {
      result[name] = content;
      continue;
    }
    result[name] = JSON.stringify(walk(JSON.parse(content)));
  }
  return { artifacts: result, inverse };
}

// The keyMap consumer contract: for a given ~k, resolveConfigLocation reads
// the entry's key path, ~r → refMap → FILE, and ~l; suppression walks
// ~k_parent chains reading ~ignoreBuildChecks. Two keyMaps are equivalent
// when every positionally-paired id resolves an identical parent chain. The
// ~r id is compared by what it resolves to (the refMap path) — id strings
// are allocation-order-dependent for counter ids and not a contract.
function keyChain(id, keyMap, refMap) {
  const chain = [];
  let current = id;
  const guard = new Set();
  while (current !== undefined && keyMap[current] && !guard.has(current)) {
    guard.add(current);
    const entry = keyMap[current];
    const refId = entry['~r'];
    chain.push({
      key: entry.key,
      l: entry['~l'] ?? null,
      file: refId === undefined ? null : refMap[refId]?.path ?? null,
      ignore: entry['~ignoreBuildChecks'] ?? null,
    });
    current = entry['~k_parent'];
  }
  return chain;
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

    // ES-module artifacts (page data modules + the registry on every build,
    // closure modules on compiled builds) derive 1:1 from the JSON twins
    // compared below — excluded from byte parity on both sides.
    const jsonKeys = (artifacts) =>
      Object.keys(artifacts)
        .filter((k) => !k.endsWith('.mjs'))
        .sort();
    expect(jsonKeys(compiled.artifacts)).toEqual(jsonKeys(walker.artifacts));
    const walkerCanonical = canonicalizeKeyIds(walker.artifacts);
    const compiledCanonical = canonicalizeKeyIds(compiled.artifacts);
    for (const key of Object.keys(walkerCanonical.artifacts).sort()) {
      if (key === 'refMap.json') {
        // Designed divergence (E1, recorded in endgame.md): cross-module
        // refs inside preserved manifest content of meta-operator manifests.
        // The walker's two-pass preservation flattens their refMap parent to
        // the module refDef and stores post-tag originals; single-pass
        // compiled resolution parents them under their true containing file
        // (a strictly more informative inclusion chain) with the pre-tag
        // def. All other artifacts stay byte-compared.
        if (REFMAP_DIVERGENCE_FIXTURES.has(fixtureDir)) {
          continue;
        }
        // The walker registers refMap entries in parallel-IO completion order
        // and counter ids follow allocation order — neither is a contract.
        expect(refMapProfiles(compiled.artifacts[key])).toEqual(
          refMapProfiles(walker.artifacts[key])
        );
        continue;
      }
      if (key === 'keyMap.json') {
        continue;
      }
      if (compiledCanonical.artifacts[key] !== walkerCanonical.artifacts[key]) {
        // Surface the artifact name and first divergence point for diagnosis.
        const a = walkerCanonical.artifacts[key];
        const b = compiledCanonical.artifacts[key];
        let i = 0;
        while (i < Math.min(a.length, b.length) && a[i] === b[i]) i += 1;
        const start = Math.max(0, i - 80);
        throw new Error(
          `Artifact "${key}" differs in fixture "${fixtureDir}" at offset ${i} (canonical ~k):\n` +
            `walker:   …${a.slice(start, i + 120)}…\n` +
            `compiler: …${b.slice(start, i + 120)}…`
        );
      }
    }

    // keyMap gate: identical entry counts, and every positionally-paired ~k
    // resolves an identical location/suppression parent chain.
    const walkerKeyMap = JSON.parse(walker.artifacts['keyMap.json']);
    const compiledKeyMap = JSON.parse(compiled.artifacts['keyMap.json']);
    const walkerRefMap = JSON.parse(walker.artifacts['refMap.json']);
    const compiledRefMap = JSON.parse(compiled.artifacts['refMap.json']);
    expect(Object.keys(compiledKeyMap).length).toBe(Object.keys(walkerKeyMap).length);
    for (const [canonical, walkerId] of walkerCanonical.inverse) {
      const compiledId = compiledCanonical.inverse.get(canonical);
      const a = keyChain(walkerId, walkerKeyMap, walkerRefMap);
      const b = keyChain(compiledId, compiledKeyMap, compiledRefMap);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        throw new Error(
          `keyMap chain differs in fixture "${fixtureDir}" for ${canonical} ` +
            `(walker ${walkerId} vs compiler ${compiledId}):\n` +
            `walker:   ${JSON.stringify(a)}\ncompiler: ${JSON.stringify(b)}`
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
