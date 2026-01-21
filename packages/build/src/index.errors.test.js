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

import { createRunBuild } from './test-utils/runBuild.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'tests/errors');

// Mock writeBuildArtifact to avoid file writes
jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => jest.fn(),
}));

// Import build after mocking
const { default: build } = await import('./index.js');

// Create runBuild helper
const runBuild = createRunBuild(build, fixturesDir);

/**
 * Discovers all fixture directories that have an expected.json file.
 */
function discoverFixtures() {
  return fs
    .readdirSync(fixturesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const expectedPath = path.join(fixturesDir, entry.name, 'expected.json');
      return fs.existsSync(expectedPath);
    })
    .map((entry) => entry.name)
    .sort();
}

/**
 * Reads the expected.json file for a fixture.
 */
function readExpected(fixtureName) {
  const expectedPath = path.join(fixturesDir, fixtureName, 'expected.json');
  const content = fs.readFileSync(expectedPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Counts occurrences of a substring in an array of strings.
 */
function countOccurrences(arr, searchStr) {
  return (arr ?? []).filter((item) => item.includes(searchStr)).length;
}

const allFixtures = discoverFixtures();

describe('Build Error Tests', () => {
  test.each(allFixtures)('%s', async (fixtureName) => {
    const expected = readExpected(fixtureName);

    for (const testCase of expected.tests) {
      // Handle environment variable setup/cleanup
      const savedEnv = {};
      if (testCase.deleteEnv) {
        for (const envVar of testCase.deleteEnv) {
          savedEnv[envVar] = process.env[envVar];
          delete process.env[envVar];
        }
      }

      try {
        const result = await runBuild(fixtureName, testCase.mode);

        // Check for expected errors (substrings that should appear exactly once)
        if (testCase.errors) {
          for (const errorSubstring of testCase.errors) {
            const count = countOccurrences(result.errors, errorSubstring);
            expect(count).toBe(1);
          }
        }

        // Check error messages contain expected text
        if (testCase.errorContains) {
          for (const expectedText of testCase.errorContains) {
            // Replace {{fixturesDir}} with actual path
            const normalizedExpected = expectedText.replace(
              /\{\{fixturesDir\}\}/g,
              fixturesDir
            );
            const found = result.errors.some((err) => err.includes(normalizedExpected));
            expect(found).toBe(true);
          }
        }

        // Check for expected warnings
        if (testCase.warnings) {
          for (const warningSubstring of testCase.warnings) {
            const count = countOccurrences(result.warnings, warningSubstring);
            expect(count).toBe(1);
          }
        }

        // Check warning messages contain expected text
        if (testCase.warningContains) {
          for (const expectedText of testCase.warningContains) {
            const normalizedExpected = expectedText.replace(
              /\{\{fixturesDir\}\}/g,
              fixturesDir
            );
            const found = result.warnings.some((warn) => warn.includes(normalizedExpected));
            expect(found).toBe(true);
          }
        }

        // Check that certain errors should NOT appear (for ~ignoreBuildCheck tests)
        if (testCase.noErrors) {
          for (const notExpected of testCase.noErrors) {
            const found = result.errors.find((e) => e.includes(notExpected));
            expect(found).toBeUndefined();
          }
        }

        // Check that certain warnings should NOT appear
        if (testCase.noWarnings) {
          for (const notExpected of testCase.noWarnings) {
            const found = result.warnings.find((w) => w.includes(notExpected));
            expect(found).toBeUndefined();
          }
        }

        // Check if build should have thrown
        if (testCase.expectThrow) {
          expect(result.thrownError).not.toBeNull();
        }

        // Check expected error count
        if (testCase.errorCount !== undefined) {
          expect(result.errors.length).toBe(testCase.errorCount);
        }

        // Check expected warning count
        if (testCase.warningCount !== undefined) {
          expect(result.warnings.length).toBe(testCase.warningCount);
        }
      } finally {
        // Restore environment variables
        for (const [envVar, value] of Object.entries(savedEnv)) {
          if (value !== undefined) {
            process.env[envVar] = value;
          }
        }
      }
    }
  });
});
