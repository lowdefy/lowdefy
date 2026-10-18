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

import { jest } from '@jest/globals';

const authJson = {};
const handleMobileSignIn = jest.fn(() => new Response('mobile sign-in'));

jest.unstable_mockModule('@lowdefy/api', () => ({ handleMobileSignIn }));
jest.unstable_mockModule('../../lib/build/auth.js', () => ({ default: authJson }));
jest.unstable_mockModule('../../lib/build/config.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/build/theme.js', () => ({
  default: { antd: { token: { colorPrimary: '#00aa55' } } },
}));
jest.unstable_mockModule('../../lib/server/auth/getAuth.js', () => ({ default: () => null }));
jest.unstable_mockModule('../../lib/server/auth/getMockUser.js', () => ({ default: () => null }));
const { default: mobileSignInHandler } = await import('./mobileSignIn.js');

function createContext() {
  return {
    get: () => ({ logger: {} }),
    req: { raw: new Request('http://localhost/auth/mobile') },
  };
}

beforeEach(() => {
  delete authJson.mobile;
  handleMobileSignIn.mockClear();
});

test('mobileSignInHandler falls through to the app pages when the app has no mobile section', async () => {
  const next = jest.fn(() => 'page');
  expect(await mobileSignInHandler(createContext(), next)).toEqual('page');
  expect(handleMobileSignIn).not.toHaveBeenCalled();
});

test('mobileSignInHandler serves the mobile sign-in page when the app has a mobile section', async () => {
  authJson.mobile = { shells: [] };
  const next = jest.fn();
  const res = await mobileSignInHandler(createContext(), next);
  expect(await res.text()).toEqual('mobile sign-in');
  expect(next).not.toHaveBeenCalled();
  expect(handleMobileSignIn).toHaveBeenCalledWith(
    expect.objectContaining({ basePath: '', primaryColor: '#00aa55' })
  );
});
