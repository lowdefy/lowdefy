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

import resolveCallBinding from './resolveCallBinding.js';

const system = { system: true, boundOrganizationId: null, user: null };
const github = { id: 'github', name: 'GitHub' };

function resolve(context, properties) {
  return resolveCallBinding(context, { stepId: 'call', configKey: 'k', ...properties });
}

test('a step naming neither organization nor caller has no binding, in any run', () => {
  expect(resolve(system, {})).toBe(null);
  expect(resolve({ user: { id: 'user-1' } }, {})).toBe(null);
});

test('a system run binds to the named organization, with or without a caller', () => {
  expect(resolve(system, { organization: 'org-1' })).toEqual({
    organizationId: 'org-1',
    caller: null,
  });
  expect(resolve(system, { organization: 'org-1', caller: { ...github, extra: 1 } })).toEqual({
    organizationId: 'org-1',
    caller: github,
  });
});

test('a caller without an organization is refused', () => {
  expect(() => resolve(system, { caller: github })).toThrow(
    'CallApi step "call" names a "caller" without an "organization".'
  );
});

test('an organization that is not a non-empty string is refused', () => {
  expect(() => resolve(system, { organization: '' })).toThrow(
    'CallApi step "call" property "organization" should be a non-empty organization id string.'
  );
  expect(() => resolve(system, { organization: { id: 'org-1' } })).toThrow(
    'should be a non-empty organization id string.'
  );
});

test('a caller without a string id and name is refused', () => {
  const message =
    'CallApi step "call" property "caller" should be an object with non-empty string "id" and "name".';
  expect(() => resolve(system, { organization: 'org-1', caller: { id: 'github' } })).toThrow(
    message
  );
  expect(() => resolve(system, { organization: 'org-1', caller: 'github' })).toThrow(message);
});

test('a run that is not a system run can not bind', () => {
  expect(() =>
    resolve({ user: { id: 'user-1', organization_id: 'org-1' } }, { organization: 'org-1' })
  ).toThrow('accepted only in a trusted system run');
  expect(() => resolve({ user: null }, { organization: 'org-1' })).toThrow(
    'accepted only in a trusted system run'
  );
});

test('a bound run keeps its caller when a nested step restates the organization alone', () => {
  const bound = {
    system: true,
    boundOrganizationId: 'org-1',
    user: { ...github, organization_id: 'org-1', system: true },
  };
  expect(resolve(bound, { organization: 'org-1' })).toEqual({
    organizationId: 'org-1',
    caller: github,
  });
  expect(resolve(bound, { organization: 'org-1', caller: github })).toEqual({
    organizationId: 'org-1',
    caller: github,
  });
});

test('a bound run with no caller can not name one', () => {
  expect(() =>
    resolve(
      { system: true, boundOrganizationId: 'org-1', user: null },
      { organization: 'org-1', caller: github }
    )
  ).toThrow(
    'CallApi step "call" names caller "github", but this run is already bound with no caller and can not name another.'
  );
});
