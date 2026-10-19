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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'tests/success');

// Pin gitSha so buildAppMeta produces a deterministic appMeta in snapshots.
process.env.LOWDEFY_GIT_SHA = 'test-git-sha-for-snapshots';

// Mock writeBuildArtifact to capture artifacts instead of writing to disk
const mockWriteBuildArtifact = jest.fn();
jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => mockWriteBuildArtifact,
}));

// Mock updateServerPackageJson to skip server package.json update
jest.unstable_mockModule('./build/full/updateServerPackageJson.js', () => ({
  default: jest.fn(() => Promise.resolve()),
}));

// Mock copyPublicFolder to skip public folder copy
jest.unstable_mockModule('./build/copyPublicFolder.js', () => ({
  default: jest.fn(() => Promise.resolve()),
}));

// Import after mocking
const { default: build } = await import('./index.js');
const { snapshotTypesMap } = await import('./test-utils/runBuildForSnapshots.js');
const { default: makeId } = await import('./utils/makeId.js');

/**
 * Discovers all fixture directories in the success folder.
 */
function discoverFixtures() {
  const entries = fs.readdirSync(fixturesDir, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(fixturesDir, entry.name, 'lowdefy.yaml'))
    )
    .map((entry) => entry.name)
    .sort();
}

/**
 * Returns a function that replaces `directory`, and the rest of any path below
 * it, with `placeholder` followed by '/'-separated segments.
 */
function createPathReplacer({ directory, placeholder }) {
  const sep = escapeRegExp(path.sep);
  const pattern = new RegExp(`${escapeRegExp(directory)}((?:${sep}[^${sep}"'\\s:]*)*)`, 'g');
  return (value) =>
    value.replace(pattern, (match, rest) => `${placeholder}${rest.split(path.sep).join('/')}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Deep-maps every string (object keys included) in a JSON-like value.
 */
function mapStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, fn));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [fn(key), mapStrings(item, fn)])
    );
  }
  return value;
}

/**
 * Runs build for a fixture and captures artifacts.
 */
async function runBuildForFixture(fixtureDir) {
  const configDir = path.join(fixturesDir, fixtureDir);
  const artifacts = {};

  // Reset makeId counter for deterministic ~k values
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
      customTypesMap: snapshotTypesMap,
      directories: {
        config: configDir,
        build: path.join(configDir, '.lowdefy'),
        server: path.join(configDir, '.lowdefy', 'server'),
      },
      logger,
      stage: 'prod',
    });
  } catch (err) {
    // Log errors for debugging
    console.log('Build errors:', logger.error.mock.calls);
    throw err;
  }

  // Parse JSON artifacts for readable snapshots.
  const parsedArtifacts = {};
  for (const [filePath, content] of Object.entries(artifacts)) {
    if (filePath.endsWith('.json')) {
      try {
        parsedArtifacts[filePath] = JSON.parse(content);
      } catch {
        parsedArtifacts[filePath] = content;
      }
    } else {
      parsedArtifacts[filePath] = content;
    }
  }

  // Replace absolute fixture paths with stable placeholders so snapshots are
  // portable across machines (module _ref paths are stored as absolute).
  // configDir → <CONFIG_DIR> handles the active fixture's paths; fixturesDir →
  // <FIXTURES_DIR> catches cross-fixture references (e.g. cross-module tests
  // that resolve _ref into a sibling fixture directory). The rest of each path
  // is written with '/' so Windows builds match the same snapshot.
  // buildId is random per build, so it is replaced wherever it landed (the
  // appMeta artifact and any config that read it through _build.app).
  const { buildId } = parsedArtifacts['appMeta.json'];
  const replaceConfigDir = createPathReplacer({
    directory: configDir,
    placeholder: '<CONFIG_DIR>',
  });
  const replaceFixturesDir = createPathReplacer({
    directory: fixturesDir,
    placeholder: '<FIXTURES_DIR>',
  });
  const normalizedArtifacts = mapStrings(parsedArtifacts, (value) =>
    replaceFixturesDir(replaceConfigDir(value)).replaceAll(buildId, '<BUILD_ID>')
  );

  return { artifacts: normalizedArtifacts, logger };
}

/**
 * Reads a snapshot file from the fixture directory.
 */
function readSnapshot(fixtureDir) {
  const snapshotPath = path.join(fixturesDir, fixtureDir, 'snapshot.json');
  if (fs.existsSync(snapshotPath)) {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  }
  return null;
}

/**
 * Writes a snapshot file to the fixture directory.
 */
function writeSnapshot(fixtureDir, artifacts) {
  const snapshotPath = path.join(fixturesDir, fixtureDir, 'snapshot.json');
  fs.writeFileSync(snapshotPath, JSON.stringify(artifacts, null, 2) + '\n');
}

// Discover all fixtures
const allFixtures = discoverFixtures();

// Check if we should update snapshots
const updateSnapshots =
  process.env.UPDATE_SNAPSHOTS === 'true' ||
  process.argv.includes('-u') ||
  process.argv.includes('--updateSnapshot');

describe('Build Artifact Snapshots', () => {
  test.each(allFixtures)('%s', async (fixtureDir) => {
    const { artifacts } = await runBuildForFixture(fixtureDir);

    // Sort artifact keys for consistent snapshot ordering
    const sortedArtifacts = {};
    Object.keys(artifacts)
      .sort()
      .forEach((key) => {
        sortedArtifacts[key] = artifacts[key];
      });

    const existingSnapshot = readSnapshot(fixtureDir);

    if (updateSnapshots || existingSnapshot === null) {
      // Write new snapshot
      writeSnapshot(fixtureDir, sortedArtifacts);
      if (existingSnapshot === null) {
        console.log(`  → Created snapshot for ${fixtureDir}`);
      } else {
        console.log(`  → Updated snapshot for ${fixtureDir}`);
      }
    }

    // Compare with snapshot
    const snapshot = readSnapshot(fixtureDir);
    expect(sortedArtifacts).toEqual(snapshot);
  });
});
