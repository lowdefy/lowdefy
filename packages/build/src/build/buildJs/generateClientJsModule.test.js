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

import generateClientJsModule from './generateClientJsModule.js';
import generateJsFile from './generateJsFile.js';

// The dev-server fold and the full build both generate client jsMap module text
// through generateClientJsModule. The wire format the client compiles must not
// drift from what writeJs produced, so pin it to generateJsFile with the exact
// client prototype writeJs used before the single-source refactor.
const CLIENT_PROTOTYPE = `{ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }`;

test('generateClientJsModule matches generateJsFile with the client prototype', () => {
  const map = {
    A: 'return args.x + 1;',
    B: 'return 1;',
  };
  expect(generateClientJsModule(map)).toEqual(
    generateJsFile({ map, functionPrototype: CLIENT_PROTOTYPE })
  );
});

test('generateClientJsModule wraps each hash in the client prototype', () => {
  const output = generateClientJsModule({ hash1: 'return 42;' });
  expect(output).toContain(`'hash1': (${CLIENT_PROTOTYPE}) => { return 42; }`);
});

test('generateClientJsModule returns an empty default export for an empty map', () => {
  expect(generateClientJsModule({})).toEqual(`
export default {
  };`);
});
