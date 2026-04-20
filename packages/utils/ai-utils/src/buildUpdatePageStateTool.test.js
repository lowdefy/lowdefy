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

import buildUpdatePageStateTool from './buildUpdatePageStateTool.js';

test('returns null when sharedState is absent', () => {
  expect(buildUpdatePageStateTool({ sharedState: undefined })).toBeNull();
  expect(buildUpdatePageStateTool({ sharedState: null })).toBeNull();
});

test('returns a tool with no execute fn when sharedState is an object', () => {
  const t = buildUpdatePageStateTool({ sharedState: { foo: 1 } });
  expect(t).not.toBeNull();
  expect(typeof t.description).toBe('string');
  expect(t.inputSchema).toBeDefined();
  expect(t.execute).toBeUndefined();
});

test('description enumerates top-level keys with types', () => {
  const t = buildUpdatePageStateTool({
    sharedState: { legal_name: 'Acme', trade_name: 'Acme Inc.', employees: 42 },
  });
  expect(t.description).toMatch(/legal_name/);
  expect(t.description).toMatch(/trade_name/);
  expect(t.description).toMatch(/employees/);
});

test('description handles empty sharedState gracefully', () => {
  const t = buildUpdatePageStateTool({ sharedState: {} });
  expect(t).not.toBeNull();
  expect(typeof t.description).toBe('string');
});
