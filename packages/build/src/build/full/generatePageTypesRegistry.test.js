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

import generatePageTypesRegistry from './generatePageTypesRegistry.js';

test('generatePageTypesRegistry maps each types key to its chunk', () => {
  const source = generatePageTypesRegistry({ typesKeys: ['0123456789ab', 'ba9876543210'] });
  expect(source).toContain('"0123456789ab": () => import("./pageTypes/0123456789ab.js"),');
  expect(source).toContain('"ba9876543210": () => import("./pageTypes/ba9876543210.js"),');
  expect(source).toContain("export const icons = () => import('./icons.js');");
  expect(source).toContain("import('./operators/client.js')");
});

test('generatePageTypesRegistry writes an empty registry for an app with no pages', () => {
  expect(generatePageTypesRegistry({ typesKeys: [] })).toContain('export default {\n\n};');
});
