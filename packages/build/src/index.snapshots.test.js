/*
  Copyright 2020-2024 Lowdefy, Inc

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

// Set NEXTAUTH_SECRET for auth-related tests
process.env.NEXTAUTH_SECRET = 'test-secret-for-snapshot-tests';

// Mock writeBuildArtifact to capture artifacts instead of writing to disk
const mockWriteBuildArtifact = jest.fn();
jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => mockWriteBuildArtifact,
}));

// Mock updateServerPackageJson to skip server package.json update
jest.unstable_mockModule('./build/updateServerPackageJson.js', () => ({
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
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
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

  // Parse JSON artifacts for readable snapshots
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

  return { artifacts: parsedArtifacts, logger };
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
const updateSnapshots = process.argv.includes('-u') || process.argv.includes('--updateSnapshot');

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
