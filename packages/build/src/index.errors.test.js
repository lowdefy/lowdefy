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
import path from 'path';
import { fileURLToPath } from 'url';

import { createRunBuild } from './test/runBuild.js';

// Get the directory of this test file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock writeBuildArtifact to avoid file writes
jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => jest.fn(),
}));

// Import build after mocking
const { default: build } = await import('./index.js');

// Create runBuild helper with fixtures directory
const fixturesDir = path.join(__dirname, 'build-errors');
const runBuild = createRunBuild(build, fixturesDir);

/**
 * Error format:
 *   [Config Error] {message}
 *     {filePath}:{lineNumber} at {configPath}
 *     {absoluteFilePath}:{lineNumber}
 *
 * See build-errors/ fixtures for documented test cases.
 */

/**
 * Helper to count occurrences of a substring in an array of strings.
 * Used to verify errors are not logged multiple times.
 */
function countOccurrences(arr, searchStr) {
  return arr.filter((item) => item.includes(searchStr)).length;
}

/**
 * Helper to verify error is logged exactly once via logger.error (shows as ✖ in red).
 * Checks that the error appears in result.errors exactly once.
 * @param {Object} result - Build result from runBuild
 * @param {string} errorSubstring - Substring to search for in errors
 * @param {string} description - Description for error message
 */
function expectSingleError(result, errorSubstring, description = errorSubstring) {
  const count = countOccurrences(result.errors, errorSubstring);
  expect(count).toBe(1);
}

describe('Connection Errors (A)', () => {
  test('A1: Invalid connection type throws error with location', async () => {
    const result = await runBuild('A1-invalid-connection-type', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'NonExistentConnection');
    expect(result.errors[0]).toContain(
      '[Config Error] Connection type "NonExistentConnection" was used but is not defined.\n' +
        '  lowdefy.yaml:14 at root.connections[0:invalidConnection:NonExistentConnection]\n' +
        `  ${path.join(fixturesDir, 'A1-invalid-connection-type', 'lowdefy.yaml:14')}`
    );
  });

  test('A2: Missing connection id throws error', async () => {
    const result = await runBuild('A2-missing-connection-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'should have required property "id"');
    expect(result.errors[0]).toContain(
      '[Config Error] Connection should have required property "id".\n' +
        '  lowdefy.yaml:13 at root.connections[0:AxiosHttp]\n' +
        `  ${path.join(fixturesDir, 'A2-missing-connection-id', 'lowdefy.yaml:13')}`
    );
  });

  test('A3: Duplicate connection id throws error', async () => {
    const result = await runBuild('A3-duplicate-connection-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Duplicate connectionId');
    expect(result.errors[0]).toContain(
      '[Config Error] Duplicate connectionId "testApi".\n' +
        '  lowdefy.yaml:17 at root.connections[1:testApi:AxiosHttp]\n' +
        `  ${path.join(fixturesDir, 'A3-duplicate-connection-id', 'lowdefy.yaml:17')}`
    );
  });
});

describe('Auth Errors (B)', () => {
  test('B1: Auth not object throws error', async () => {
    const result = await runBuild('B1-auth-not-object', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'should be an object');
    expect(result.errors[0]).toContain(
      '[Config Error] App "auth" should be an object.\n' +
        '  lowdefy.yaml:11 at root\n' +
        `  ${path.join(fixturesDir, 'B1-auth-not-object', 'lowdefy.yaml:11')}`
    );
  });

  test('B2: Auth provider missing id throws error', async () => {
    const result = await runBuild('B2-auth-provider-missing-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'should have required property "id"');
    expect(result.errors[0]).toContain(
      '[Config Error] Auth provider should have required property "id".\n' +
        '  lowdefy.yaml:14 at root.auth.providers[0:GoogleProvider]\n' +
        `  ${path.join(fixturesDir, 'B2-auth-provider-missing-id', 'lowdefy.yaml:14')}`
    );
  });

  test('B3: Public/protected conflict throws error', async () => {
    const result = await runBuild('B3-public-protected-conflict', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'mutually exclusive');
    expect(result.errors[0]).toContain(
      '[Config Error] Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and vice versa.\n' +
        '  lowdefy.yaml:13 at root.auth.pages\n' +
        `  ${path.join(fixturesDir, 'B3-public-protected-conflict', 'lowdefy.yaml:13')}`
    );
  });

  test('B4: Missing NEXTAUTH_SECRET throws error when auth providers configured', async () => {
    const originalEnv = process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;

    try {
      const result = await runBuild('B4-missing-nextauth-secret', 'prod');
      // Verify error logged exactly once via logger.error (✖ in red)
      expectSingleError(result, 'NEXTAUTH_SECRET');
      expect(result.errors[0]).toContain(
        '[Config Error] Auth providers are configured but NEXTAUTH_SECRET environment variable is not set.'
      );
      expect(result.errors[0]).toContain(
        '  lowdefy.yaml:13 at root.auth\n' +
          `  ${path.join(fixturesDir, 'B4-missing-nextauth-secret', 'lowdefy.yaml:13')}`
      );
    } finally {
      if (originalEnv !== undefined) {
        process.env.NEXTAUTH_SECRET = originalEnv;
      }
    }
  });
});

describe('Menu Errors (C)', () => {
  test('C1: Duplicate menu id throws error', async () => {
    const result = await runBuild('C1-duplicate-menu-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Duplicate menuId');
    expect(result.errors[0]).toContain(
      '[Config Error] Duplicate menuId "default".\n' +
        '  lowdefy.yaml:20 at root.menus[1:default]\n' +
        `  ${path.join(fixturesDir, 'C1-duplicate-menu-id', 'lowdefy.yaml:20')}`
    );
  });

  test('C2: Menu link to missing page warns in dev mode', async () => {
    const result = await runBuild('C2-menu-missing-page', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, 'nonExistentPage')).toBe(1);
    expect(result.warnings[0]).toContain(
      '[Config Warning] Page "nonExistentPage" referenced in menu link "badLink" not found.\n' +
        '  lowdefy.yaml:15 at root.menus[0:default].links[0:badLink:MenuLink]\n' +
        `  ${path.join(fixturesDir, 'C2-menu-missing-page', 'lowdefy.yaml:15')}`
    );
  });

  test('C2: Menu link to missing page throws in prod mode', async () => {
    const result = await runBuild('C2-menu-missing-page', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'nonExistentPage');
    expect(result.errors[0]).toContain(
      '[Config Error] Page "nonExistentPage" referenced in menu link "badLink" not found.\n' +
        '  lowdefy.yaml:15 at root.menus[0:default].links[0:badLink:MenuLink]\n' +
        `  ${path.join(fixturesDir, 'C2-menu-missing-page', 'lowdefy.yaml:15')}`
    );
  });
});

describe('Page/Block Errors (D, E)', () => {
  test('D1: Duplicate page id throws error', async () => {
    const result = await runBuild('D1-duplicate-page-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Duplicate pageId');
    expect(result.errors[0]).toContain(
      '[Config Error] Duplicate pageId "home".\n' +
        '  lowdefy.yaml:15 at root.pages[1:home:Box]\n' +
        `  ${path.join(fixturesDir, 'D1-duplicate-page-id', 'lowdefy.yaml:15')}`
    );
  });

  test('E1: Invalid action type throws error with suggestion', async () => {
    const result = await runBuild('E1-invalid-action-type', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'SetStat');
    expect(result.errors[0]).toContain(
      '[Config Error] Action type "SetStat" was used but is not defined. Did you mean "SetState"?\n' +
        '  lowdefy.yaml:23 at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:invalidAction:SetStat]\n' +
        `  ${path.join(fixturesDir, 'E1-invalid-action-type', 'lowdefy.yaml:23')}`
    );
  });

  test('E2: Invalid block type throws error with suggestion', async () => {
    const result = await runBuild('E2-invalid-block-type', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Buton');
    expect(result.errors[0]).toContain(
      '[Config Error] Block type "Buton" was used but is not defined. Did you mean "Button"?\n' +
        '  lowdefy.yaml:17 at root.pages[0:home:Box].blocks[0:invalidBlock:Buton]\n' +
        `  ${path.join(fixturesDir, 'E2-invalid-block-type', 'lowdefy.yaml:17')}`
    );
  });

  test('E3: Missing block id throws error', async () => {
    const result = await runBuild('E3-missing-block-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Block should have required property "id"');
    expect(result.errors[0]).toContain(
      '[Config Error] Block should have required property "id".\n' +
        '  lowdefy.yaml:16 at root.pages[0:home:Box].blocks[0:Button]\n' +
        `  ${path.join(fixturesDir, 'E3-missing-block-id', 'lowdefy.yaml:16')}`
    );
  });

  test('E4: Block id not string throws error', async () => {
    const result = await runBuild('E4-block-id-not-string', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'should be a string');
    expect(result.errors[0]).toContain(
      '[Config Error] Block "id" should be a string.\n' +
        '  lowdefy.yaml:16 at root.pages[0:home:Box].blocks[0:123:Button]\n' +
        `  ${path.join(fixturesDir, 'E4-block-id-not-string', 'lowdefy.yaml:16')}`
    );
  });

  test('E5: Block type not string throws error', async () => {
    const result = await runBuild('E5-block-type-not-string', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Block "type" should be a string');
    expect(result.errors[0]).toContain(
      '[Config Error] Block "type" should be a string.\n' +
        '  lowdefy.yaml:17 at root.pages[0:home:Box].blocks[0:badType:[object Object]].type\n' +
        `  ${path.join(fixturesDir, 'E5-block-type-not-string', 'lowdefy.yaml:17')}`
    );
  });
});

describe('Request Errors (F)', () => {
  test('F1: Invalid request reference warns in dev mode', async () => {
    const result = await runBuild('F1-invalid-request-reference', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, 'nonExistentRequest')).toBe(1);
    expect(result.warnings[0]).toContain(
      '[Config Warning] Request "nonExistentRequest" not defined on page "home".\n' +
        '  lowdefy.yaml:29 at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:callRequest:Request]\n' +
        `  ${path.join(fixturesDir, 'F1-invalid-request-reference', 'lowdefy.yaml:29')}`
    );
  });

  test('F1: Invalid request reference throws in prod mode', async () => {
    const result = await runBuild('F1-invalid-request-reference', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'nonExistentRequest');
    expect(result.errors[0]).toContain(
      '[Config Error] Request "nonExistentRequest" not defined on page "home".\n' +
        '  lowdefy.yaml:29 at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:callRequest:Request]\n' +
        `  ${path.join(fixturesDir, 'F1-invalid-request-reference', 'lowdefy.yaml:29')}`
    );
  });

  test('F2: Request missing id throws error', async () => {
    const result = await runBuild('F2-request-missing-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Request should have required property "id"');
    expect(result.errors[0]).toContain(
      '[Config Error] Request should have required property "id".\n' +
        '  lowdefy.yaml:22 at root.pages[0:home:Box].requests[0:testApi:AxiosHttp]\n' +
        `  ${path.join(fixturesDir, 'F2-request-missing-id', 'lowdefy.yaml:22')}`
    );
  });

  test('F3: Duplicate request id throws error', async () => {
    const result = await runBuild('F3-duplicate-request-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Duplicate requestId');
    expect(result.errors[0]).toContain(
      '[Config Error] Duplicate requestId "myRequest" on page "home".\n' +
        '  lowdefy.yaml:27 at root.pages[0:home:Box].requests[1:testApi:AxiosHttp]\n' +
        `  ${path.join(fixturesDir, 'F3-duplicate-request-id', 'lowdefy.yaml:27')}`
    );
  });

  test('F4: Request id with period throws error', async () => {
    const result = await runBuild('F4-request-id-with-period', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'should not include a period');
    expect(result.errors[0]).toContain(
      '[Config Error] Request id "my.request" at page "home" should not include a period (".").\n' +
        '  lowdefy.yaml:23 at root.pages[0:home:Box].requests[0:testApi:AxiosHttp]\n' +
        `  ${path.join(fixturesDir, 'F4-request-id-with-period', 'lowdefy.yaml:23')}`
    );
  });

  test('F5: Invalid request type throws error with suggestion', async () => {
    const result = await runBuild('F5-invalid-request-type', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'AxiosHtt');
    expect(result.errors[0]).toContain(
      '[Config Error] Request type "AxiosHtt" was used but is not defined. Did you mean "AxiosHttp"?\n' +
        '  lowdefy.yaml:23 at root.pages[0:home:Box].requests[0:testApi:AxiosHtt]\n' +
        `  ${path.join(fixturesDir, 'F5-invalid-request-type', 'lowdefy.yaml:23')}`
    );
  });

  test('F6: Non-existent connection throws error', async () => {
    const result = await runBuild('F6-nonexistent-connection', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'nonExistentConnection');
    expect(result.errors[0]).toContain(
      '[Config Error] Request "badConnectionRequest" at page "home" references non-existent connection "nonExistentConnection".\n' +
        '  lowdefy.yaml:17 at root.pages[0:home:Box].requests[0:nonExistentConnection:AxiosHttp]\n' +
        `  ${path.join(fixturesDir, 'F6-nonexistent-connection', 'lowdefy.yaml:17')}`
    );
  });

  test('F7: Non-existent connection with ~ignoreBuildCheck suppresses error', async () => {
    const result = await runBuild('F7-nonexistent-connection-ignored', 'prod');
    // Should have no errors about nonExistentConnection since ~ignoreBuildCheck is set
    const connectionError = result.errors.find((e) => e.includes('nonExistentConnection'));
    expect(connectionError).toBeUndefined();
  });
});

describe('Action/Event Errors (G)', () => {
  test('G1: Invalid page link warns in dev mode', async () => {
    const result = await runBuild('G1-invalid-page-link', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, 'nonExistentPage')).toBe(1);
    expect(result.warnings[0]).toContain(
      '[Config Warning] Page "nonExistentPage" not found. Link on page "home" references non-existent page.\n' +
        '  lowdefy.yaml:23 at root.pages[0:home:Box].blocks[0:invalidLink:Button].events.onClick[0:linkAction:Link]\n' +
        `  ${path.join(fixturesDir, 'G1-invalid-page-link', 'lowdefy.yaml:23')}`
    );
  });

  test('G1: Invalid page link throws in prod mode', async () => {
    const result = await runBuild('G1-invalid-page-link', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'nonExistentPage');
    expect(result.errors[0]).toContain(
      '[Config Error] Page "nonExistentPage" not found. Link on page "home" references non-existent page.\n' +
        '  lowdefy.yaml:23 at root.pages[0:home:Box].blocks[0:invalidLink:Button].events.onClick[0:linkAction:Link]\n' +
        `  ${path.join(fixturesDir, 'G1-invalid-page-link', 'lowdefy.yaml:23')}`
    );
  });

  test('G2: Duplicate action id throws error', async () => {
    const result = await runBuild('G2-duplicate-action-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Duplicate actionId');
    expect(result.errors[0]).toContain(
      '[Config Error] Duplicate actionId "linkAction" on event "onClick" on block "button" on page "home".\n' +
        '  lowdefy.yaml:26 at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[1:linkAction:SetState]\n' +
        `  ${path.join(fixturesDir, 'G2-duplicate-action-id', 'lowdefy.yaml:26')}`
    );
  });

  test('G3: Missing action id throws error', async () => {
    const result = await runBuild('G3-missing-action-id', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Action should have required property "id"');
    expect(result.errors[0]).toContain(
      '[Config Error] Action should have required property "id".\n' +
        '  lowdefy.yaml:22 at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:SetState]\n' +
        `  ${path.join(fixturesDir, 'G3-missing-action-id', 'lowdefy.yaml:22')}`
    );
  });

  test('G4: Action type not string throws error', async () => {
    const result = await runBuild('G4-action-type-not-string', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Action "type" should be a string');
    expect(result.errors[0]).toContain(
      '[Config Error] Action "type" should be a string.\n' +
        '  lowdefy.yaml:24 at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:action1:[object Object]].type\n' +
        `  ${path.join(fixturesDir, 'G4-action-type-not-string', 'lowdefy.yaml:24')}`
    );
  });

  test('G5: Events not array throws error', async () => {
    const result = await runBuild('G5-events-not-array', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'must be array');
    expect(result.errors[0]).toContain(
      '[Config Error] must be array\n' +
        '  lowdefy.yaml:21 at root.pages[0:home:Box].blocks[0:button:Button].events.onClick\n' +
        `  ${path.join(fixturesDir, 'G5-events-not-array', 'lowdefy.yaml:21')}`
    );
  });
});

describe('Operator Errors (H)', () => {
  test('H1: Operator typo (_staet) throws error with suggestion', async () => {
    const result = await runBuild('H1-operator-typo-state', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, '_staet')).toBe(1);
    const operatorWarning = result.warnings.find((w) => w.includes('_staet'));
    expect(operatorWarning).toContain(
      '[Config Error] Operator type "_staet" was used but is not defined. Did you mean "_state"?\n' +
        '  lowdefy.yaml:21 at root.pages[0:home:Box].blocks[0:typoBlock:Paragraph].properties.content\n' +
        `  ${path.join(fixturesDir, 'H1-operator-typo-state', 'lowdefy.yaml:21')}`
    );
  });

  test('H2: Operator typo (_iff) throws error with suggestion', async () => {
    const result = await runBuild('H2-operator-typo-if', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, '_iff')).toBe(1);
    const operatorWarning = result.warnings.find((w) => w.includes('_iff'));
    expect(operatorWarning).toContain(
      '[Config Error] Operator type "_iff" was used but is not defined. Did you mean "_if"?\n' +
        '  lowdefy.yaml:21 at root.pages[0:home:Box].blocks[0:typoBlock:Paragraph].properties.content\n' +
        `  ${path.join(fixturesDir, 'H2-operator-typo-if', 'lowdefy.yaml:21')}`
    );
  });

  test('H3: Operator typo with ~ignoreBuildCheck suppresses warning', async () => {
    const result = await runBuild('H3-operator-typo-ignored', 'dev');
    // Should have no warnings about _staet since ~ignoreBuildCheck is set
    const operatorWarning = result.warnings.find((w) => w.includes('_staet'));
    expect(operatorWarning).toBeUndefined();
  });

  test('H4: Invalid action type with ~ignoreBuildCheck suppresses error', async () => {
    const result = await runBuild('H4-action-type-ignored', 'prod');
    // Should have no errors about NonExistentAction since ~ignoreBuildCheck is set
    const actionError = result.errors.find((e) => e.includes('NonExistentAction'));
    expect(actionError).toBeUndefined();
  });

  test('H5: Invalid block type with ~ignoreBuildCheck suppresses error', async () => {
    const result = await runBuild('H5-block-type-ignored', 'prod');
    // Should have no errors about NonExistentBlock since ~ignoreBuildCheck is set
    const blockError = result.errors.find((e) => e.includes('NonExistentBlock'));
    expect(blockError).toBeUndefined();
  });

  test('H6: Invalid connection type with ~ignoreBuildCheck suppresses error', async () => {
    const result = await runBuild('H6-connection-type-ignored', 'prod');
    // Should have no errors about NonExistentConnection since ~ignoreBuildCheck is set
    const connectionError = result.errors.find((e) => e.includes('NonExistentConnection'));
    expect(connectionError).toBeUndefined();
  });

  test('H7: Invalid request type with ~ignoreBuildCheck suppresses error', async () => {
    const result = await runBuild('H7-request-type-ignored', 'prod');
    // Should have no errors about NonExistentRequest since ~ignoreBuildCheck is set
    const requestError = result.errors.find((e) => e.includes('NonExistentRequest'));
    expect(requestError).toBeUndefined();
  });
});

describe('File Reference Errors (I)', () => {
  test('I1: Missing _ref file throws error', async () => {
    const result = await runBuild('I1-missing-ref-file', 'prod');
    expect(result.thrownError).not.toBeNull();
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'does not exist');
  });

  test('I2: Circular _ref throws error', async () => {
    const result = await runBuild('I2-circular-ref', 'prod');
    expect(result.thrownError).not.toBeNull();
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'Circular reference');
    expect(result.errors[0]).toContain(
      '[Config Error] Circular reference detected. File "a.yaml" references itself through:\n' +
        '  -> lowdefy.yaml\n' +
        '  -> a.yaml\n' +
        '  -> b.yaml\n' +
        '  -> a.yaml\n' +
        '  b.yaml:4\n' +
        `  ${path.join(fixturesDir, 'I2-circular-ref', 'b.yaml:4')}`
    );
  });
});

describe('State Reference Errors (J)', () => {
  test('J1: Undefined state reference warns in dev mode', async () => {
    const result = await runBuild('J1-undefined-state', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, 'undefinedKey')).toBe(1);
    expect(result.warnings[0]).toContain(
      '[Config Warning] _state references "undefinedKey" on page "home", but no input block with id "undefinedKey" exists on this page. State keys are created from input block ids. Check for typos, add an input block with this id, or initialize the state with SetState.\n' +
        '  lowdefy.yaml:21 at root.pages[0:home:Box].blocks[0:stateRef:Paragraph].properties.content\n' +
        `  ${path.join(fixturesDir, 'J1-undefined-state', 'lowdefy.yaml:21')}`
    );
  });

  test('J1: Undefined state reference throws in prod mode', async () => {
    const result = await runBuild('J1-undefined-state', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'undefinedKey');
    expect(result.errors[0]).toContain(
      '[Config Error] _state references "undefinedKey" on page "home", but no input block with id "undefinedKey" exists on this page.'
    );
  });

  test('J2: Undefined state reference with ~ignoreBuildCheck suppresses warning', async () => {
    const result = await runBuild('J2-undefined-state-ignored', 'dev');
    // Should have no warnings about undefinedKey since ~ignoreBuildCheck is set
    const stateWarning = result.warnings.find((w) => w.includes('undefinedKey'));
    expect(stateWarning).toBeUndefined();
  });
});

describe('Payload Reference Errors (K)', () => {
  test('K1: Undefined payload reference warns in dev mode', async () => {
    const result = await runBuild('K1-undefined-payload', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, 'undefinedKey')).toBe(1);
    const payloadWarning = result.warnings.find((w) => w.includes('undefinedKey'));
    expect(payloadWarning).toContain(
      '[Config Warning] _payload references "undefinedKey" in request "testRequest" on page "home", but no key "undefinedKey" exists in the request payload definition.'
    );
    expect(payloadWarning).toContain(
      '  lowdefy.yaml:33 at root.pages[0:home:Box].requests[0:testApi:AxiosHttp].properties.params.id\n' +
        `  ${path.join(fixturesDir, 'K1-undefined-payload', 'lowdefy.yaml:33')}`
    );
  });

  test('K1: Undefined payload reference throws in prod mode', async () => {
    const result = await runBuild('K1-undefined-payload', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'undefinedKey');
    const payloadError = result.errors.find((e) => e.includes('undefinedKey'));
    expect(payloadError).toContain(
      '[Config Error] _payload references "undefinedKey" in request "testRequest" on page "home", but no key "undefinedKey" exists in the request payload definition.'
    );
  });

  test('K2: Undefined payload reference with ~ignoreBuildCheck suppresses warning', async () => {
    const result = await runBuild('K2-undefined-payload-ignored', 'dev');
    // Should have no warnings about undefinedKey since ~ignoreBuildCheck is set
    const payloadWarning = result.warnings.find((w) => w.includes('undefinedKey'));
    expect(payloadWarning).toBeUndefined();
  });
});

describe('Step Reference Errors (L)', () => {
  test('L1: Undefined step reference warns in dev mode', async () => {
    const result = await runBuild('L1-undefined-step', 'dev');
    // Verify warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, 'nonExistentStep')).toBe(1);
    const stepWarning = result.warnings.find((w) => w.includes('nonExistentStep'));
    expect(stepWarning).toContain(
      '[Config Warning] _step references "nonExistentStep" in endpoint "testEndpoint", but no step with id "nonExistentStep" exists in the routine.'
    );
    expect(stepWarning).toContain(
      '  lowdefy.yaml:32 at root.api[0:testEndpoint:Endpoint].routine[1].:return\n' +
        `  ${path.join(fixturesDir, 'L1-undefined-step', 'lowdefy.yaml:32')}`
    );
  });

  test('L1: Undefined step reference throws in prod mode', async () => {
    const result = await runBuild('L1-undefined-step', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'nonExistentStep');
    const stepError = result.errors.find((e) => e.includes('nonExistentStep'));
    expect(stepError).toContain(
      '[Config Error] _step references "nonExistentStep" in endpoint "testEndpoint", but no step with id "nonExistentStep" exists in the routine.'
    );
  });

  test('L2: Undefined step reference with ~ignoreBuildCheck suppresses warning', async () => {
    const result = await runBuild('L2-undefined-step-ignored', 'dev');
    // Should have no warnings about nonExistentStep since ~ignoreBuildCheck is set
    const stepWarning = result.warnings.find((w) => w.includes('nonExistentStep'));
    expect(stepWarning).toBeUndefined();
  });
});

describe('Multi-file Error Tracking', () => {
  test('Error in child file shows correct file path', async () => {
    const result = await runBuild('multi-file-error', 'prod');
    // Verify error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'NonExistentBlockType');
    expect(result.errors[0]).toContain(
      '[Config Error] Block type "NonExistentBlockType" was used but is not defined.\n' +
        '  pages/home.yaml:12 at root.pages[0:home:Box].blocks[1:invalidBlock:NonExistentBlockType]\n' +
        `  ${path.join(fixturesDir, 'multi-file-error', 'pages/home.yaml:12')}`
    );
  });
});

describe('Multiple Validation Errors Collection', () => {
  test('All validation errors are collected and reported in prod mode', async () => {
    const result = await runBuild('multi-validation-errors', 'prod');
    // Should have all three errors, not just the first one
    expect(result.errors.length).toBe(3);

    // Verify each error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'undefinedState');
    expectSingleError(result, 'anotherUndefined');
    expectSingleError(result, 'undefinedPayload');

    // Check for each error type
    const stateError1 = result.errors.find((e) => e.includes('undefinedState'));
    const stateError2 = result.errors.find((e) => e.includes('anotherUndefined'));
    const payloadError = result.errors.find((e) => e.includes('undefinedPayload'));

    expect(stateError1).toContain(
      '[Config Error] _state references "undefinedState" on page "home"'
    );
    expect(stateError2).toContain(
      '[Config Error] _state references "anotherUndefined" on page "home"'
    );
    expect(payloadError).toContain(
      '[Config Error] _payload references "undefinedPayload" in request "testRequest"'
    );
  });

  test('All validation warnings are collected and reported in dev mode', async () => {
    const result = await runBuild('multi-validation-errors', 'dev');
    // Should have at least the three validation warnings (may have "No menus found" warning too)
    expect(result.warnings.length).toBeGreaterThanOrEqual(3);

    // Verify each warning logged exactly once via logger.warn (⚠ in yellow)
    expect(countOccurrences(result.warnings, 'undefinedState')).toBe(1);
    expect(countOccurrences(result.warnings, 'anotherUndefined')).toBe(1);
    expect(countOccurrences(result.warnings, 'undefinedPayload')).toBe(1);

    // Check for each warning type
    const stateWarning1 = result.warnings.find((w) => w.includes('undefinedState'));
    const stateWarning2 = result.warnings.find((w) => w.includes('anotherUndefined'));
    const payloadWarning = result.warnings.find((w) => w.includes('undefinedPayload'));

    expect(stateWarning1).toContain(
      '[Config Warning] _state references "undefinedState" on page "home"'
    );
    expect(stateWarning2).toContain(
      '[Config Warning] _state references "anotherUndefined" on page "home"'
    );
    expect(payloadWarning).toContain(
      '[Config Warning] _payload references "undefinedPayload" in request "testRequest"'
    );
  });

  test('Errors are not logged twice (no duplicates)', async () => {
    const result = await runBuild('multi-validation-errors', 'prod');
    // Verify each error logged exactly once via logger.error (✖ in red)
    expectSingleError(result, 'undefinedState');
    expectSingleError(result, 'anotherUndefined');
    expectSingleError(result, 'undefinedPayload');
  });

  test('Schema errors are not logged twice', async () => {
    // A2-missing-connection-id has a schema error - verify it only appears once via logger.error (✖ in red)
    const result = await runBuild('A2-missing-connection-id', 'prod');
    expectSingleError(result, 'should have required property "id"');
  });
});
