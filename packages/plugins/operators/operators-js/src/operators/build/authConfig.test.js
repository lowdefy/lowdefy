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

import _authConfig from './authConfig.js';

const authConfig = {
  emailAndPassword: { enabled: true },
  magicLink: { enabled: false },
  twoFactor: { enabled: true },
  passkey: { enabled: false },
  phoneNumber: { enabled: true, signUpOnVerification: false },
  captcha: { enabled: true, provider: 'cloudflare-turnstile', siteKey: '0x4AAAAAAA' },
  providers: [
    { id: 'google', type: 'Google' },
    { id: 'custom-oauth', type: 'GenericOAuth' },
  ],
  organizations: { policy: 'tenant', signup: 'invite-only' },
  roles: [
    { id: 'admin', label: 'Administrator', description: 'Full access' },
    { id: 'editor', label: 'editor', description: 'Can edit content' },
  ],
};

test('_authConfig dynamic is true', () => {
  expect(_authConfig.dynamic).toBe(true);
});

test('_authConfig returns emailAndPassword.enabled boolean', () => {
  expect(_authConfig({ authConfig, params: 'emailAndPassword.enabled' })).toBe(true);
});

test('_authConfig returns magicLink.enabled boolean', () => {
  expect(_authConfig({ authConfig, params: 'magicLink.enabled' })).toBe(false);
});

test('_authConfig returns twoFactor.enabled boolean', () => {
  expect(_authConfig({ authConfig, params: 'twoFactor.enabled' })).toBe(true);
});

test('_authConfig returns passkey.enabled boolean', () => {
  expect(_authConfig({ authConfig, params: 'passkey.enabled' })).toBe(false);
});

test('_authConfig returns phoneNumber.enabled boolean', () => {
  expect(_authConfig({ authConfig, params: 'phoneNumber.enabled' })).toBe(true);
});

test('_authConfig returns phoneNumber.signUpOnVerification boolean', () => {
  expect(_authConfig({ authConfig, params: 'phoneNumber.signUpOnVerification' })).toBe(false);
});

test('_authConfig returns providers projected to id and type only', () => {
  expect(_authConfig({ authConfig, params: 'providers' })).toEqual([
    { id: 'google', type: 'Google' },
    { id: 'custom-oauth', type: 'GenericOAuth' },
  ]);
});

test('_authConfig returns a copy of providers so config cannot mutate the projection', () => {
  const result = _authConfig({ authConfig, params: 'providers' });
  result[0].id = 'mutated';
  expect(authConfig.providers[0].id).toBe('google');
});

test('_authConfig returns organizations.signup policy', () => {
  expect(_authConfig({ authConfig, params: 'organizations.signup' })).toBe('invite-only');
});

test('_authConfig returns organizations.policy', () => {
  expect(_authConfig({ authConfig, params: 'organizations.policy' })).toBe('tenant');
  expect(
    _authConfig({
      authConfig: { organizations: { policy: 'pinned', signup: 'invite-only' } },
      params: 'organizations.policy',
    })
  ).toBe('pinned');
});

test('_authConfig throws for unknown path and names all readable paths', () => {
  expect(() => _authConfig({ authConfig, params: 'authPages.signIn' })).toThrow(
    '_build.authConfig received an unreadable path "authPages.signIn". Readable paths are: ' +
      '"emailAndPassword.enabled", "magicLink.enabled", "twoFactor.enabled", "passkey.enabled", ' +
      '"phoneNumber.enabled", "phoneNumber.signUpOnVerification", ' +
      '"captcha.enabled", "captcha.provider", "captcha.siteKey", ' +
      '"providers", "organizations.policy", "organizations.signup", "roles".'
  );
});

test('_authConfig throws for un-projected wiring key instead of returning null', () => {
  expect(() => _authConfig({ authConfig, params: 'providers.0.properties' })).toThrow(
    'Readable paths are:'
  );
});

test('_authConfig throws for non-string params', () => {
  expect(() => _authConfig({ authConfig, params: { key: 'providers' } })).toThrow(
    'unreadable path'
  );
  expect(() => _authConfig({ authConfig, params: true })).toThrow('unreadable path');
});

test('_authConfig throws the boundary error when projection is not available', () => {
  expect(() => _authConfig({ authConfig: undefined, params: 'providers' })).toThrow(
    '_build.authConfig is not available here.'
  );
});

test('_authConfig returns captcha projection paths', () => {
  expect(_authConfig({ authConfig, params: 'captcha.enabled' })).toBe(true);
  expect(_authConfig({ authConfig, params: 'captcha.provider' })).toBe('cloudflare-turnstile');
  expect(_authConfig({ authConfig, params: 'captcha.siteKey' })).toBe('0x4AAAAAAA');
});

test('_authConfig throws for the un-projected captcha secretKey', () => {
  expect(() => _authConfig({ authConfig, params: 'captcha.secretKey' })).toThrow(
    'Readable paths are:'
  );
});

test('_authConfig returns the projected roles catalog', () => {
  expect(_authConfig({ authConfig, params: 'roles' })).toEqual([
    { id: 'admin', label: 'Administrator', description: 'Full access' },
    { id: 'editor', label: 'editor', description: 'Can edit content' },
  ]);
});

test('_authConfig returns a copy of roles so config cannot mutate the projection', () => {
  const result = _authConfig({ authConfig, params: 'roles' });
  result[0].id = 'mutated';
  expect(authConfig.roles[0].id).toBe('admin');
});

test('_authConfig throws the boundary error for roles when projection is not available', () => {
  expect(() => _authConfig({ authConfig: undefined, params: 'roles' })).toThrow(
    '_build.authConfig is not available here.'
  );
});
