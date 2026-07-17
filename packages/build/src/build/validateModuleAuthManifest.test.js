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

import validateModuleAuthManifest from './validateModuleAuthManifest.js';

test('validateModuleAuthManifest passes when auth is undefined', () => {
  expect(() => validateModuleAuthManifest({ auth: undefined, entryId: 'crm' })).not.toThrow();
});

test('validateModuleAuthManifest passes a full valid auth section', () => {
  const auth = {
    hooks: [
      { point: 'user.create.before', endpoint: 'link-contact-on-signup' },
      { point: 'email.verified', endpoint: 'link-contact-on-signup' },
    ],
    pages: {
      signIn: 'login',
      signUp: 'signup',
      error: 'error',
      forgotPassword: 'forgot-password',
      resetPassword: 'reset-password',
      verifyEmail: 'verify-email',
    },
    public: ['accept-invitation'],
  };
  expect(() => validateModuleAuthManifest({ auth, entryId: 'crm' })).not.toThrow();
});

test('validateModuleAuthManifest throws when auth is not an object', () => {
  expect(() => validateModuleAuthManifest({ auth: ['hooks'], entryId: 'crm' })).toThrow(
    'Module "crm" manifest "auth" must be an object.'
  );
});

test('validateModuleAuthManifest throws on an unknown auth key', () => {
  expect(() =>
    validateModuleAuthManifest({ auth: { authPages: { signIn: 'login' } }, entryId: 'crm' })
  ).toThrow(
    'Module "crm" manifest "auth" has unknown key "authPages". Allowed keys are: hooks, pages, public.'
  );
});

test('validateModuleAuthManifest throws when hooks is not an array', () => {
  expect(() =>
    validateModuleAuthManifest({
      auth: { hooks: { point: 'user.create.before', endpoint: 'link' } },
      entryId: 'crm',
    })
  ).toThrow('Module "crm" manifest "auth.hooks" must be an array.');
});

test('validateModuleAuthManifest throws when a hook entry is missing endpoint', () => {
  expect(() =>
    validateModuleAuthManifest({
      auth: { hooks: [{ point: 'user.create.before' }] },
      entryId: 'crm',
    })
  ).toThrow(
    'Module "crm" manifest "auth.hooks" entries must be objects with string "point" and "endpoint" properties.'
  );
});

test('validateModuleAuthManifest throws when a hook entry is missing point', () => {
  expect(() =>
    validateModuleAuthManifest({
      auth: { hooks: [{ endpoint: 'link-contact' }] },
      entryId: 'crm',
    })
  ).toThrow(
    'Module "crm" manifest "auth.hooks" entries must be objects with string "point" and "endpoint" properties.'
  );
});

test('validateModuleAuthManifest throws when a hook entry uses endpointId instead of endpoint', () => {
  expect(() =>
    validateModuleAuthManifest({
      auth: {
        hooks: [{ point: 'user.create.before', endpoint: 'link', endpointId: 'crm/link' }],
      },
      entryId: 'crm',
    })
  ).toThrow(
    'Module "crm" manifest "auth.hooks" entry has unknown key "endpointId". Allowed keys are: point, endpoint.'
  );
});

test('validateModuleAuthManifest throws when pages is not an object', () => {
  expect(() => validateModuleAuthManifest({ auth: { pages: ['login'] }, entryId: 'crm' })).toThrow(
    'Module "crm" manifest "auth.pages" must be an object.'
  );
});

test('validateModuleAuthManifest throws on an unknown authPages role', () => {
  expect(() =>
    validateModuleAuthManifest({ auth: { pages: { logIn: 'login' } }, entryId: 'crm' })
  ).toThrow(
    'Module "crm" manifest "auth.pages" has unknown role "logIn". Valid roles are: signIn, signUp, error, forgotPassword, resetPassword, verifyEmail, acceptInvitation.'
  );
});

test('validateModuleAuthManifest throws when a role value is not a string', () => {
  expect(() =>
    validateModuleAuthManifest({ auth: { pages: { signIn: ['login'] } }, entryId: 'crm' })
  ).toThrow('Module "crm" manifest "auth.pages.signIn" must be a page id string.');
});

test('validateModuleAuthManifest throws when public is not an array', () => {
  expect(() =>
    validateModuleAuthManifest({ auth: { public: 'accept-invitation' }, entryId: 'crm' })
  ).toThrow('Module "crm" manifest "auth.public" must be an array of page ids.');
});

test('validateModuleAuthManifest throws when a public entry is not a string', () => {
  expect(() =>
    validateModuleAuthManifest({ auth: { public: [{ id: 'accept-invitation' }] }, entryId: 'crm' })
  ).toThrow('Module "crm" manifest "auth.public" entries must be page id strings.');
});
