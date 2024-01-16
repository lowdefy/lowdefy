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

test('validateAuthConfig no auth defined', async () => {
  const components = {};
  const result = await validateAuthConfig({ components, context });
  expect(result).toEqual({
    auth: {
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

test('validateAuthConfig auth not an object', async () => {
  const components = {
    auth: 'auth',
  };
  await expect(validateAuthConfig({ components, context })).rejects.toThrow(
    'lowdefy.auth is not an object.'
  );
});

test('validateAuthConfig invalid auth config', async () => {
  let components = {
    auth: {
      pages: {
        protected: {},
      },
    },
  };
  await expect(validateAuthConfig({ components, context })).rejects.toThrow(
    'App "auth.pages.protected.$" should be an array of strings.'
  );
  components = {
    auth: {
      pages: {
        roles: ['a'],
      },
    },
  };
  await expect(validateAuthConfig({ components, context })).rejects.toThrow(
    'App "auth.pages.roles" should be an object.'
  );
});

test('validateAuthConfig config error when both protected and public pages are both arrays', async () => {
  const components = {
    auth: {
      pages: {
        protected: [],
        public: [],
      },
    },
  };
  await expect(validateAuthConfig({ components, context })).rejects.toThrow(
    'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and visa versa.'
  );
});

test('validateAuthConfig config error when both protected and public pages are true', async () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        public: true,
      },
    },
  };
  await expect(validateAuthConfig({ components, context })).rejects.toThrow(
    'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and visa versa.'
  );
});

test('validateAuthConfig config error when protected or public are false.', async () => {
  let components = {
    auth: {
      pages: {
        protected: false,
      },
    },
  };
  await expect(validateAuthConfig({ components, context })).rejects.toThrow(
    'Protected pages can not be set to false.'
  );
  components = {
    auth: {
      pages: {
        public: false,
      },
    },
  };
  await expect(validateAuthConfig({ components, context })).rejects.toThrow(
    'Public pages can not be set to false.'
  );
});
