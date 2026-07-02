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

import validateAuthConfig from './validateAuthConfig.js';
import testContext from '../../test-utils/testContext.js';

const context = testContext();

const validSecret = { _secret: 'BETTER_AUTH_SECRET' };
const validDatabase = { id: 'auth_db', type: 'MongoDBAuthAdapter', properties: {} };

test('validateAuthConfig sets auth to an empty object when auth is absent', () => {
  const components = {};
  const result = validateAuthConfig({ components, context });
  expect(result).toEqual({ auth: {} });
});

test('validateAuthConfig does not throw when auth is already an empty object', () => {
  const components = { auth: {} };
  const result = validateAuthConfig({ components, context });
  expect(result).toEqual({ auth: {} });
});

test('validateAuthConfig throws when auth is not an object', () => {
  const components = { auth: 'auth' };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'lowdefy.auth is not an object.'
  );
});

test('validateAuthConfig throws when auth contains an unknown key', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      notAKnownAuthKey: true,
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    /contains an unknown property/
  );
});

test('validateAuthConfig throws when configured without an authentication mechanism', () => {
  const components = {
    auth: {
      secret: validSecret,
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth is configured without an authentication mechanism. Configure a login method ("emailAndPassword.enabled: true" or "magicLink.enabled: true") or an OAuth provider in "providers".'
  );
});

test('validateAuthConfig throws when only dev.mockUser is set, since it is not a mechanism', () => {
  const components = {
    auth: {
      dev: {
        mockUser: { id: 'user-1', roles: ['admin'] },
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth is configured without an authentication mechanism.'
  );
});

test('validateAuthConfig throws when secret is missing', () => {
  const components = {
    auth: {
      database: validDatabase,
      emailAndPassword: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "secret" is required when auth is configured. Reference it with the _secret operator.'
  );
});

test('validateAuthConfig throws when database is missing for a login method', () => {
  const components = {
    auth: {
      secret: validSecret,
      emailAndPassword: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "database" is required when a login method or provider is configured.'
  );
});

test('validateAuthConfig throws when database is missing for a configured provider', () => {
  const components = {
    auth: {
      secret: validSecret,
      providers: [{ id: 'okta', type: 'GenericOAuth', properties: {} }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "database" is required when a login method or provider is configured.'
  );
});

test('validateAuthConfig throws when email is missing and magicLink is enabled', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      magicLink: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "email" is required when "magicLink" is enabled or "emailAndPassword.requireEmailVerification" is true.'
  );
});

test('validateAuthConfig throws when email is missing and requireEmailVerification is true', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true, requireEmailVerification: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "email" is required when "magicLink" is enabled or "emailAndPassword.requireEmailVerification" is true.'
  );
});

test('validateAuthConfig passes with a minimal valid emailAndPassword mechanism', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig passes with a magicLink mechanism when email is configured', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      magicLink: { enabled: true },
      email: {
        from: 'noreply@example.com',
        provider: { type: 'smtp', properties: {} },
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig passes with an OAuth provider mechanism', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [{ id: 'okta', type: 'GenericOAuth', properties: {} }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when emailAndPassword is missing "enabled"', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: {},
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    /should have required property "enabled"/
  );
});

test('validateAuthConfig throws when magicLink is missing "enabled"', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      magicLink: {},
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    /should have required property "enabled"/
  );
});

test('validateAuthConfig throws when both protected and public pages are arrays', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
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

test('validateAuthConfig throws when both protected and public pages are true', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
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

test('validateAuthConfig throws when pages.protected is false', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      pages: {
        protected: false,
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Protected pages can not be set to false.'
  );
});

test('validateAuthConfig throws when pages.public is false', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      pages: {
        public: false,
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Public pages can not be set to false.'
  );
});

test('validateAuthConfig throws when both protected and public api are set', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      api: {
        protected: ['a'],
        public: ['b'],
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Protected and public api are mutually exclusive. When protected api are listed, all unlisted api are public by default and vice versa.'
  );
});

test('validateAuthConfig throws when both protected and public websockets are set', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      websockets: {
        protected: true,
        public: true,
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Protected and public websockets are mutually exclusive. When protected websockets are listed, all unlisted websockets are public by default and vice versa.'
  );
});
