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

test('validateAuthConfig throws when auth providers configured but NEXTAUTH_SECRET not set', () => {
  const originalEnv = process.env.NEXTAUTH_SECRET;
  delete process.env.NEXTAUTH_SECRET;

  const components = {
    auth: {
      providers: [
        {
          id: 'google',
          type: 'GoogleProvider',
          properties: {
            clientId: 'test-id',
            clientSecret: 'test-secret',
          },
        },
      ],
    },
  };

  try {
    expect(() => validateAuthConfig({ components, context })).toThrow(
      'Auth providers are configured but NEXTAUTH_SECRET environment variable is not set.'
    );
  } finally {
    if (originalEnv !== undefined) {
      process.env.NEXTAUTH_SECRET = originalEnv;
    }
  }
});

test('validateAuthConfig passes when auth providers configured and NEXTAUTH_SECRET is set', () => {
  const originalEnv = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = 'test-secret-value';

  const components = {
    auth: {
      providers: [
        {
          id: 'google',
          type: 'GoogleProvider',
          properties: {
            clientId: 'test-id',
            clientSecret: 'test-secret',
          },
        },
      ],
    },
  };

  try {
    const result = validateAuthConfig({ components, context });
    expect(result.auth.providers).toHaveLength(1);
  } finally {
    if (originalEnv !== undefined) {
      process.env.NEXTAUTH_SECRET = originalEnv;
    } else {
      delete process.env.NEXTAUTH_SECRET;
    }
  }
});
