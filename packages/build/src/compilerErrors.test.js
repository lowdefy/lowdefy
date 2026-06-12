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

// Config-compiler S1 error-parity gate: every error fixture builds twice —
// walker and compiler — in both dev and prod, and the formatted error and
// warning lists (message AND file:line source) must match exactly. The two
// .yaml.njk fixtures are the designed D5 divergence: the compiler fails them
// with the codemod error instead of rendering the template.
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createRunBuild } from './test-utils/runBuild.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'tests/errors');

process.env.NEXTAUTH_SECRET = 'test-secret-for-error-parity-tests';

jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => jest.fn(),
}));

const { default: build } = await import('./index.js');

const runBuild = createRunBuild(build, fixturesDir);

// D5: structural nunjucks templates are removed under the compiler — these
// fixtures assert the codemod error instead of walker parity.
const NJK_FIXTURES = new Set(['M3-ref-njk-template', 'M4-ref-njk-ignored']);

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

// Error collection order can differ legitimately (the walker resolves
// sibling refs concurrently; compiled factories run sequentially) — compare
// as sorted lists so content and counts gate, not interleaving.
function sorted(lines) {
  return [...lines].sort();
}

const allFixtures = discoverFixtures();

describe.each(['dev', 'prod'])('compiler error parity — %s', (stage) => {
  test.each(allFixtures.map((f) => [f]))('%s', async (fixtureName) => {
    const walker = await runBuild(fixtureName, stage);
    const compiled = await runBuild(fixtureName, stage, { compiler: true });

    if (NJK_FIXTURES.has(fixtureName)) {
      const all = [...compiled.errors, ...compiled.warnings].join('\n');
      expect(all).toContain('Structural nunjucks templates (.yaml.njk) are no longer supported');
      return;
    }

    expect(sorted(compiled.errors)).toEqual(sorted(walker.errors));
    expect(sorted(compiled.warnings)).toEqual(sorted(walker.warnings));
    expect(compiled.thrownError === null).toBe(walker.thrownError === null);
  });
});

afterAll(() => {
  for (const fixtureName of allFixtures) {
    fs.rmSync(path.join(fixturesDir, fixtureName, '.lowdefy'), { recursive: true, force: true });
  }
});
