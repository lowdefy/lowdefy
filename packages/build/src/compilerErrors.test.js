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

// E2 golden gate (replaces the walker error-parity comparison): every error
// fixture builds in dev and prod, and the formatted error and warning lists
// (message AND file:line source) compare against goldens captured from the
// final walker-parity-green state (E1). Paths are stored portable.
// Regenerate intentionally with UPDATE_GOLDENS=true after a reviewed
// behavior change.
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createRunBuild } from './test-utils/runBuild.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'tests/errors');
const goldensPath = path.join(__dirname, 'tests/errors.golden.json');

process.env.NEXTAUTH_SECRET = 'test-secret-for-error-golden-tests';

jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => jest.fn(),
}));

const { default: build } = await import('./index.js');

const runBuild = createRunBuild(build, fixturesDir, '.lowdefy-errgolden');

const UPDATE_GOLDENS = process.env.UPDATE_GOLDENS === 'true';
const goldens = UPDATE_GOLDENS ? {} : JSON.parse(fs.readFileSync(goldensPath, 'utf8'));

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

// Collection order is not a contract (factories may interleave) — compare
// sorted; absolute fixture paths store as a portable placeholder.
function portable(lines) {
  return [...lines].map((line) => line.split(fixturesDir).join('<errors>')).sort();
}

const allFixtures = discoverFixtures();

describe.each(['dev', 'prod'])('build error goldens — %s', (stage) => {
  test.each(allFixtures.map((f) => [f]))('%s', async (fixtureName) => {
    const result = await runBuild(fixtureName, stage);
    const snapshot = {
      errors: portable(result.errors),
      warnings: portable(result.warnings),
      threw: result.thrownError !== null,
    };
    if (UPDATE_GOLDENS) {
      goldens[fixtureName] = goldens[fixtureName] ?? {};
      goldens[fixtureName][stage] = snapshot;
      return;
    }
    expect(snapshot).toEqual(goldens[fixtureName]?.[stage]);
  });
});

afterAll(() => {
  if (UPDATE_GOLDENS) {
    const ordered = {};
    for (const name of Object.keys(goldens).sort()) {
      ordered[name] = goldens[name];
    }
    fs.writeFileSync(goldensPath, JSON.stringify(ordered, null, 2) + '\n');
  }
  for (const fixtureName of allFixtures) {
    fs.rmSync(path.join(fixturesDir, fixtureName, '.lowdefy-errgolden'), {
      recursive: true,
      force: true,
    });
  }
});
