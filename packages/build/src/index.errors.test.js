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
 * Error format template (full location):
 *   [{error_type}] {message}
 *     {filePath}:{lineNumber} at {configPath}
 *     {absoluteFilePath}:{lineNumber}
 *
 * Some errors may have partial or no location info.
 */
const FULL_ERROR_FORMAT_REGEX =
  /^\[(Config Error|Config Warning|Config Schema Error)\] .+\n {2}.+\.yaml:\d+ at root\..+\n {2}\/.+\.yaml:\d+$/;

const SIMPLE_ERROR_FORMAT_REGEX = /^\[(Config Error|Config Warning|Config Schema Error)\] .+$/;

/**
 * Checks if an error/warning message matches the expected format.
 * @param {string} message - The error message to check
 * @param {string} expectedPrefix - Expected prefix ('Config Error', 'Config Warning', etc.)
 * @param {object} options - Options for validation
 * @param {boolean} [options.expectFullLocation=true] - Whether to expect full location info
 */
function expectValidErrorFormat(message, expectedPrefix, options = {}) {
  const { expectFullLocation = true } = options;

  if (expectFullLocation) {
    expect(message).toMatch(FULL_ERROR_FORMAT_REGEX);
  } else {
    expect(message).toMatch(SIMPLE_ERROR_FORMAT_REGEX);
  }
  expect(message).toMatch(new RegExp(`^\\[${expectedPrefix}\\]`));
}

describe('Connection Errors (A)', () => {
  test('A1: Invalid connection type throws error with location', async () => {
    const result = await runBuild('A1-invalid-connection-type', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain(
      'Connection type "NonExistentConnection" was used but is not defined'
    );
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.connections[0:invalidConnection:NonExistentConnection]');
    expect(errorMsg).toContain(path.join(fixturesDir, 'A1-invalid-connection-type'));
  });

  test('A2: Missing connection id throws error', async () => {
    const result = await runBuild('A2-missing-connection-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Connection id missing');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.connections[0:AxiosHttp]');
  });

  test('A3: Duplicate connection id throws error', async () => {
    const result = await runBuild('A3-duplicate-connection-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Duplicate connectionId "testApi"');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.connections[1:testApi:AxiosHttp]');
  });
});

describe('Auth Errors (B)', () => {
  test('B1: Auth not object throws error', async () => {
    const result = await runBuild('B1-auth-not-object', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    // B1 error doesn't have full location tracking yet
    expectValidErrorFormat(errorMsg, 'Config Error', { expectFullLocation: false });
    expect(errorMsg).toContain('lowdefy.auth is not an object');
  });

  test('B2: Auth provider missing id throws error', async () => {
    const result = await runBuild('B2-auth-provider-missing-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    // B2 is a schema validation error without standard format
    expect(errorMsg).toContain('Auth provider should have required property "id"');
  });

  test('B3: Public/protected conflict throws error', async () => {
    const result = await runBuild('B3-public-protected-conflict', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('mutually exclusive');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.auth');
  });
});

describe('Menu Errors (C)', () => {
  test('C1: Duplicate menu id throws error', async () => {
    const result = await runBuild('C1-duplicate-menu-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Duplicate menuId "default"');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.menus[1:default]');
  });

  test('C2: Menu link to missing page warns in dev mode', async () => {
    const result = await runBuild('C2-menu-missing-page', 'dev');

    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('nonExistentPage'));
    expect(warnMsg).toBeDefined();
    // Note: Uses Config Error prefix but goes to warnings in dev mode
    expectValidErrorFormat(warnMsg, 'Config Error');
    expect(warnMsg).toContain('referenced in menu');
    expect(warnMsg).toContain('not found');
    expect(warnMsg).toContain('lowdefy.yaml:');
    expect(warnMsg).toContain('at root.menus[0:default].links[0:badLink:MenuLink]');
  });
});

describe('Page/Block Errors (D, E)', () => {
  test('D1: Duplicate page id throws error', async () => {
    const result = await runBuild('D1-duplicate-page-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Duplicate pageId "home"');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[1:home:Box]');
  });

  test('E1: Invalid action type throws error with suggestion', async () => {
    const result = await runBuild('E1-invalid-action-type', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors.find((e) => e.includes('Action type'));
    expect(errorMsg).toBeDefined();
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Action type "SetStat" was used but is not defined');
    expect(errorMsg).toContain('Did you mean "SetState"?');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain(
      'at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:invalidAction:SetStat]'
    );
  });

  test('E2: Invalid block type throws error with suggestion', async () => {
    const result = await runBuild('E2-invalid-block-type', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors.find((e) => e.includes('Block type'));
    expect(errorMsg).toBeDefined();
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Block type "Buton" was used but is not defined');
    expect(errorMsg).toContain('Did you mean "Button"?');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].blocks[0:invalidBlock:Buton]');
  });

  test('E3: Missing block id throws error', async () => {
    const result = await runBuild('E3-missing-block-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Block id missing');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].blocks[0:Button]');
  });

  test('E4: Block id not string throws error', async () => {
    const result = await runBuild('E4-block-id-not-string', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Block id is not a string');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].blocks[0:123:Button]');
  });

  test('E5: Block type not string throws error', async () => {
    const result = await runBuild('E5-block-type-not-string', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Block type is not a string');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].blocks[0:badType');
  });
});

describe('Request Errors (F)', () => {
  test('F1: Invalid request reference warns in dev mode', async () => {
    const result = await runBuild('F1-invalid-request-reference', 'dev');

    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('not defined on page'));
    expect(warnMsg).toBeDefined();
    expectValidErrorFormat(warnMsg, 'Config Warning');
    expect(warnMsg).toContain('Request "nonExistentRequest" not defined on page "home"');
    expect(warnMsg).toContain('lowdefy.yaml:');
  });

  test('F1: Invalid request reference throws in prod mode', async () => {
    const result = await runBuild('F1-invalid-request-reference', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors.find((e) => e.includes('not defined on page'));
    expect(errorMsg).toBeDefined();
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Request "nonExistentRequest" not defined on page "home"');
    expect(errorMsg).toContain('lowdefy.yaml:');
  });

  test('F2: Request missing id throws error', async () => {
    const result = await runBuild('F2-request-missing-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Request id missing');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].requests[0:testApi:AxiosHttp]');
  });

  test('F3: Duplicate request id throws error', async () => {
    const result = await runBuild('F3-duplicate-request-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Duplicate requestId "myRequest"');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].requests[1:testApi:AxiosHttp]');
  });

  test('F4: Request id with period throws error', async () => {
    const result = await runBuild('F4-request-id-with-period', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Request id "my.request"');
    expect(errorMsg).toContain('should not include a period');
    expect(errorMsg).toContain('lowdefy.yaml:');
    // Path shows connectionId (testApi) in the identifier segment
    expect(errorMsg).toContain('at root.pages[0:home:Box].requests[0:testApi:AxiosHttp]');
  });

  test('F5: Invalid request type throws error with suggestion', async () => {
    const result = await runBuild('F5-invalid-request-type', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors.find((e) => e.includes('Request type'));
    expect(errorMsg).toBeDefined();
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Request type "AxiosHtt" was used but is not defined');
    expect(errorMsg).toContain('Did you mean "AxiosHttp"?');
    expect(errorMsg).toContain('lowdefy.yaml:');
    // Path shows connectionId (testApi) in the identifier segment
    expect(errorMsg).toContain('at root.pages[0:home:Box].requests[0:testApi:AxiosHtt]');
  });

  test('F6: Non-existent connection throws error', async () => {
    const result = await runBuild('F6-nonexistent-connection', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('connection');
    expect(errorMsg).toContain('lowdefy.yaml:');
  });
});

describe('Action/Event Errors (G)', () => {
  test('G1: Invalid page link warns in dev mode', async () => {
    const result = await runBuild('G1-invalid-page-link', 'dev');

    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('not found'));
    expect(warnMsg).toBeDefined();
    expectValidErrorFormat(warnMsg, 'Config Warning');
    expect(warnMsg).toContain('Page "nonExistentPage" not found');
    expect(warnMsg).toContain('lowdefy.yaml:');
    expect(warnMsg).toContain(
      'at root.pages[0:home:Box].blocks[0:invalidLink:Button].events.onClick[0:linkAction:Link]'
    );
  });

  test('G1: Invalid page link throws in prod mode', async () => {
    const result = await runBuild('G1-invalid-page-link', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors.find((e) => e.includes('not found'));
    expect(errorMsg).toBeDefined();
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Page "nonExistentPage" not found');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain(
      'at root.pages[0:home:Box].blocks[0:invalidLink:Button].events.onClick[0:linkAction:Link]'
    );
  });

  test('G2: Duplicate action id throws error', async () => {
    const result = await runBuild('G2-duplicate-action-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Duplicate actionId "linkAction"');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain(
      'at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[1:linkAction:SetState]'
    );
  });

  test('G3: Missing action id throws error', async () => {
    const result = await runBuild('G3-missing-action-id', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Action id missing');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain(
      'at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:SetState]'
    );
  });

  test('G4: Action type not string throws error', async () => {
    const result = await runBuild('G4-action-type-not-string', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('Action type is not a string');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].blocks[0:button:Button].events.onClick[0:action1');
  });

  test('G5: Events not array throws error', async () => {
    const result = await runBuild('G5-events-not-array', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors[0];
    expectValidErrorFormat(errorMsg, 'Config Error');
    expect(errorMsg).toContain('must be an array');
    expect(errorMsg).toContain('lowdefy.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box]');
  });
});

describe('Operator Errors (H)', () => {
  test('H1: Operator typo (_staet) throws error with suggestion', async () => {
    const result = await runBuild('H1-operator-typo-state', 'dev');

    // Unknown operators go to warnings array with Config Error prefix
    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('_staet'));
    expect(warnMsg).toBeDefined();
    expectValidErrorFormat(warnMsg, 'Config Error');
    expect(warnMsg).toContain('Operator type "_staet" was used but is not defined');
    expect(warnMsg).toContain('Did you mean "_state"?');
    expect(warnMsg).toContain('lowdefy.yaml:');
    expect(warnMsg).toContain(
      'at root.pages[0:home:Box].blocks[0:typoBlock:Paragraph].properties.content'
    );
  });

  test('H2: Operator typo (_iff) throws error with suggestion', async () => {
    const result = await runBuild('H2-operator-typo-if', 'dev');

    // Unknown operators go to warnings array with Config Error prefix
    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('_iff'));
    expect(warnMsg).toBeDefined();
    expectValidErrorFormat(warnMsg, 'Config Error');
    expect(warnMsg).toContain('Operator type "_iff" was used but is not defined');
    expect(warnMsg).toContain('Did you mean "_if"?');
    expect(warnMsg).toContain('lowdefy.yaml:');
    expect(warnMsg).toContain(
      'at root.pages[0:home:Box].blocks[0:typoBlock:Paragraph].properties.content'
    );
  });
});

describe('File Reference Errors (I)', () => {
  test('I1: Missing _ref file throws error', async () => {
    const result = await runBuild('I1-missing-ref-file', 'prod');

    expect(result.thrownError).not.toBeNull();
    expect(result.thrownError.message).toContain('does not exist');
  });

  test('I2: Circular _ref throws error', async () => {
    const result = await runBuild('I2-circular-ref', 'prod');

    expect(result.thrownError).not.toBeNull();
    expect(result.thrownError.message).toContain('Circular reference detected');
  });
});

describe('State Reference Errors (J)', () => {
  test('J1: Undefined state reference warns', async () => {
    const result = await runBuild('J1-undefined-state', 'dev');

    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('_state'));
    expect(warnMsg).toBeDefined();
    expectValidErrorFormat(warnMsg, 'Config Warning');
    expect(warnMsg).toContain('_state');
    expect(warnMsg).toContain('no input block');
    expect(warnMsg).toContain('lowdefy.yaml:');
  });
});

describe('Payload Reference Errors (K)', () => {
  test('K1: Undefined payload reference warns', async () => {
    const result = await runBuild('K1-undefined-payload', 'dev');

    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('_payload'));
    expect(warnMsg).toBeDefined();
    expectValidErrorFormat(warnMsg, 'Config Warning');
    expect(warnMsg).toContain('_payload');
    expect(warnMsg).toContain('lowdefy.yaml:');
  });
});

describe('Step Reference Errors (L)', () => {
  test('L1: Undefined step reference warns', async () => {
    const result = await runBuild('L1-undefined-step', 'dev');

    expect(result.warnings.length).toBeGreaterThan(0);
    const warnMsg = result.warnings.find((w) => w.includes('_step'));
    expect(warnMsg).toBeDefined();
    expectValidErrorFormat(warnMsg, 'Config Warning');
    expect(warnMsg).toContain('_step');
    expect(warnMsg).toContain('lowdefy.yaml:');
  });
});

describe('Multi-file Error Tracking', () => {
  test('Error in child file shows correct file path', async () => {
    const result = await runBuild('multi-file-error', 'prod');

    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors.find((e) => e.includes('Block type'));
    expect(errorMsg).toBeDefined();
    expectValidErrorFormat(errorMsg, 'Config Error');
    // Error should reference pages/home.yaml, not lowdefy.yaml
    expect(errorMsg).toContain('pages/home.yaml:');
    expect(errorMsg).toContain('at root.pages[0:home:Box].blocks[0:invalidBlock:NonExistentBlockType]');
    expect(errorMsg).toContain(path.join(fixturesDir, 'multi-file-error', 'pages/home.yaml'));
  });
});
