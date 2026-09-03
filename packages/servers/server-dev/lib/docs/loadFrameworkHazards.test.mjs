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
import loadFrameworkHazards from './loadFrameworkHazards.js';

test('loadFrameworkHazards loads the shipped hazards.json with well-formed unique entries', () => {
  const hazards = loadFrameworkHazards();
  expect(Array.isArray(hazards)).toBe(true);
  expect(hazards.length).toBeGreaterThan(0);
  const ids = hazards.map((hazard) => hazard.id);
  expect(new Set(ids).size).toEqual(ids.length);
  for (const hazard of hazards) {
    expect(hazard.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(typeof hazard.message).toBe('string');
    expect(['bug', 'semantics']).toContain(hazard.kind);
    // A bug hazard is a workaround the framework owes the user, so it names
    // the task that removes it; documented semantics are permanent.
    if (hazard.kind === 'bug') {
      expect(typeof hazard.retiredBy).toBe('string');
      expect(hazard.retiredBy).not.toEqual('');
    } else {
      expect(hazard.retiredBy).toBeUndefined();
    }
    expect(hazard.see === null || typeof hazard.see === 'string').toBe(true);
    const { kinds, types, when } = hazard.appliesTo;
    expect(kinds !== undefined || types !== undefined).toBe(true);
    for (const kind of kinds ?? []) {
      expect(['blocks', 'operators', 'actions', 'connections', 'requests', 'pages']).toContain(
        kind
      );
    }
    if (when !== undefined) {
      expect(when).toEqual('connectionTenantNotNone');
    }
  }
});

test('loadFrameworkHazards returns the same memoized list on repeated calls', () => {
  expect(loadFrameworkHazards()).toBe(loadFrameworkHazards());
});
