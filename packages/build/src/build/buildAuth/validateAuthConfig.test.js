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

import validateAuthConfig from './validateAuthConfig.js';
import testContext from '../../test/testContext.js';

const context = testContext();

test('validateAuthConfig no auth defined', () => {
  const components = {};
  const result = validateAuthConfig({ components, context });
  expect(result).toEqual({
    auth: {
      api: {
        roles: {},
      },
      authPages: {},
      callbacks: [],
      events: [],
      pages: {
        roles: {},
      },
      providers: [],
      session: {},
      theme: {},
    },
  });
});

test('validateAuthConfig auth not an object', () => {
  const components = {
    auth: 'auth',
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'lowdefy.auth is not an object.'
  );
});

test('validateAuthConfig invalid auth config', () => {
  let components = {
    auth: {
      pages: {
        protected: {},
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'App "auth.pages.protected.$" should be an array of strings.'
  );
  components = {
    auth: {
      pages: {
        roles: ['a'],
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'App "auth.pages.roles" should be an object.'
  );
});

test('validateAuthConfig config error when both protected and public pages are both arrays', () => {
  const components = {
    auth: {
      pages: {
        protected: [],
        public: [],
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and vice versa.'
  );
});

test('validateAuthConfig config error when both protected and public pages are true', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        public: true,
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and vice versa.'
  );
});

test('validateAuthConfig config error when protected or public are false.', () => {
  let components = {
    auth: {
      pages: {
        protected: false,
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Protected pages can not be set to false.'
  );
  components = {
    auth: {
      pages: {
        public: false,
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Public pages can not be set to false.'
  );
});
