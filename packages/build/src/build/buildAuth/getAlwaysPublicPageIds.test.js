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

import getAlwaysPublicPageIds from './getAlwaysPublicPageIds.js';

test('getAlwaysPublicPageIds derives page ids from authPages role values', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
        verifyEmail: '/verify-email',
      },
    },
  };
  const res = getAlwaysPublicPageIds({ components, context: {} });
  expect(res).toEqual(['login', 'verify-email']);
});

test('getAlwaysPublicPageIds includes the page id held by authPages.twoFactor', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
        twoFactor: '/two-factor-challenge',
      },
    },
  };
  const res = getAlwaysPublicPageIds({ components, context: {} });
  expect(res).toEqual(['login', 'two-factor-challenge']);
});

test('getAlwaysPublicPageIds excludes the page id held by authPages.twoFactorEnrol', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
        twoFactorEnrol: '/two-factor-enrol',
      },
    },
  };
  const res = getAlwaysPublicPageIds({ components, context: {} });
  expect(res).toContain('login');
  expect(res).not.toContain('two-factor-enrol');
});

test('getAlwaysPublicPageIds unions module-contributed public pages with role pages', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
      },
    },
  };
  const context = { moduleAuthPublicPages: ['module-page'] };
  const res = getAlwaysPublicPageIds({ components, context });
  expect(res).toEqual(['login', 'module-page']);
});

test('getAlwaysPublicPageIds ignores non-string and internal keys', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
        '~k': 'some-key',
        roles: { admin: ['a'] },
      },
    },
  };
  const res = getAlwaysPublicPageIds({ components, context: {} });
  expect(res).toEqual(['login']);
});
