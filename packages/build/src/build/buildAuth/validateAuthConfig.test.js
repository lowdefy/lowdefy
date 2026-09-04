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
  expect(() => validateAuthConfig({ components, context })).toThrow(/contains an unknown property/);
});

test('validateAuthConfig throws when auth sets the retired userAdminRole key', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      userAdminRole: 'user-admin',
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(/contains an unknown property/);
});

test('validateAuthConfig throws when configured without an authentication mechanism', () => {
  const components = {
    auth: {
      secret: validSecret,
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth is configured without an authentication mechanism. Configure a login method ("emailAndPassword.enabled: true", "magicLink.enabled: true" or "phoneNumber.enabled: true"), or an OAuth provider in "providers", or an API auth strategy in "strategies".'
  );
});

test('validateAuthConfig passes a strategies-only auth block without a database or login method', () => {
  const components = {
    auth: {
      secret: validSecret,
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: { keys: [{ value: { _secret: 'PARTNER_KEY' } }] },
        },
      ],
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when a strategies-only auth block is missing secret', () => {
  const components = {
    auth: {
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: { keys: [{ value: { _secret: 'PARTNER_KEY' } }] },
        },
      ],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "secret" is required when auth is configured. Reference it with the _secret operator.'
  );
});

test('validateAuthConfig throws when a strategy entry is missing a required property', () => {
  const components = {
    auth: {
      secret: validSecret,
      strategies: [{ id: 'partner-access' }],
    },
  };
  // Anchored - the schema errorMessage is thrown verbatim, with no extra
  // "Auth " prefix or trailing period added around it.
  expect(() => validateAuthConfig({ components, context })).toThrow(
    /^Auth strategy should have required property "type"\.$/
  );
});

test('validateAuthConfig throws when strategies is not an array', () => {
  const components = {
    auth: {
      secret: validSecret,
      strategies: { id: 'partner-access' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "strategies" should be an array.'
  );
});

test('validateAuthConfig does not demand a mechanism when only dev.mockUser is set', () => {
  const components = {
    auth: {
      dev: {
        mockUser: { id: 'user-1', roles: ['admin'] },
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when dev.mockUser is set alongside a runtime auth key', () => {
  const components = {
    auth: {
      dev: { mockUser: { id: 'user-1', roles: ['admin'] } },
      secret: validSecret,
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth is configured without an authentication mechanism.'
  );
});

test('validateAuthConfig accepts named dev user fixtures under dev.users', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      dev: {
        users: {
          admin: { id: 'dev-admin', roles: ['admin'], organization_id: 'org_1' },
          member: { id: 'dev-member', roles: ['member'], organization_id: 'org_1' },
        },
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when dev.users is not an object', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      dev: { users: ['admin'] },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "dev.users" should be an object.'
  );
});

test('validateAuthConfig throws when a dev.users entry is not an object', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      dev: { users: { admin: 'dev-admin' } },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "dev.users" entries should be objects.'
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
        connectionId: 'email',
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig passes with email templates overrides', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      magicLink: { enabled: true },
      email: {
        connectionId: 'email',
        templates: {
          verifyEmail: 'verify-email-notification',
          resetPassword: 'reset-password-notification',
          magicLink: 'magic-link-notification',
          invitation: 'invite-notification',
        },
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when email is missing connectionId', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      magicLink: { enabled: true },
      email: {},
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "email" should have required property "connectionId" — the id of an SMTP connection in "connections". The old inline "from"/"provider" transport shape moved onto the SMTP connection.'
  );
});

test('validateAuthConfig throws on the old inline from/provider email shape', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      magicLink: { enabled: true },
      email: {
        from: 'noreply@example.com',
        provider: { type: 'smtp', properties: { host: 'smtp.example.com', port: 587 } },
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "email" should only have properties "connectionId" and "templates". The old inline "from"/"provider" transport shape moved onto the SMTP connection referenced by "connectionId".'
  );
});

test('validateAuthConfig throws on duplicate provider ids', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [
        { id: 'okta', type: 'GenericOAuth', properties: {} },
        { id: 'okta', type: 'GenericOAuth', properties: {} },
      ],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Duplicate auth provider id "okta".'
  );
});

test('validateAuthConfig throws a located error when a provider id is a reserved name', () => {
  const provider = { id: '__proto__', type: 'GenericOAuth', properties: {} };
  // addKeys writes ~k non-enumerably, which is what keeps it out of the schema's
  // additionalProperties check - mirror that here.
  Object.defineProperty(provider, '~k', { value: 'providerKey', enumerable: false });
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [provider],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth provider id "__proto__" is a reserved name and cannot be used as an id.'
  );
  try {
    validateAuthConfig({ components, context });
  } catch (e) {
    expect(e.configKey).toBe('providerKey');
  }
});

test('validateAuthConfig throws when a built-in provider type is configured twice', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [
        { id: 'google-a', type: 'Google', properties: {} },
        { id: 'google-b', type: 'Google', properties: {} },
      ],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth provider type "Google" is configured more than once. BetterAuth supports one configuration per built-in provider; use GenericOAuth for additional configurations.'
  );
});

test('validateAuthConfig passes with multiple GenericOAuth providers with distinct ids', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [
        { id: 'okta', type: 'GenericOAuth', properties: {} },
        { id: 'auth0', type: 'GenericOAuth', properties: {} },
      ],
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

test('validateAuthConfig passes with a provider "twoFactorTrusted" boolean', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [{ id: 'google', type: 'Google', properties: {}, twoFactorTrusted: true }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when provider "twoFactorTrusted" is not a boolean', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [{ id: 'google', type: 'Google', properties: {}, twoFactorTrusted: 'yes' }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth provider "twoFactorTrusted" should be a boolean.'
  );
});

test('validateAuthConfig throws when twoFactor.required is not a boolean', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { required: 'yes' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "twoFactor.required" should be a boolean.'
  );
});

test('validateAuthConfig throws when twoFactor.trustDevice is not a boolean', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { trustDevice: 'no' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "twoFactor.trustDevice" should be a boolean.'
  );
});

test('validateAuthConfig rejects a role list for twoFactor.required with the boolean type error', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { required: ['admin'] },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "twoFactor.required" should be a boolean.'
  );
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

test('validateAuthConfig passes a valid hooks array', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      hooks: [{ id: 'link-contact', point: 'user.create.before', endpointId: 'auth/link-contact' }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when a hook entry is missing a required property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      hooks: [{ id: 'link-contact', endpointId: 'auth/link-contact' }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth hook should have required property "point".'
  );
});

test('validateAuthConfig throws when a hook entry contains an unknown property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      hooks: [
        {
          id: 'link-contact',
          point: 'user.create.before',
          endpointId: 'auth/link-contact',
          properties: {},
        },
      ],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow();
});

test('validateAuthConfig throws when hooks is not an array', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      hooks: { id: 'link-contact' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "hooks" should be an array.'
  );
});

test('validateAuthConfig passes a valid pinned organizations block', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'pinned', org: 'team-portal', signup: 'open' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig passes a tenant organizations block', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'tenant' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig passes a signup-only organizations block for the default single-org app', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { signup: 'open' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when policy is pinned without an org slug', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'pinned' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.org" is required when "organizations.policy" is "pinned".'
  );
});

test('validateAuthConfig throws when org is set under the tenant policy', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'tenant', org: 'team-portal' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.org" applies only to the "pinned" policy'
  );
});

test('validateAuthConfig throws when create is set under the pinned policy', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'pinned', org: 'team-portal', create: 'auto' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.create" applies only to the "tenant" policy'
  );
});

test('validateAuthConfig throws when organizations.create is not a known creation mode', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'tenant', create: 'self-serve' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.create" should be "auto" or "operator".'
  );
});

test('validateAuthConfig throws when organizations.policy is not a known policy', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'multi' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.policy" should be "pinned" or "tenant".'
  );
});

test('validateAuthConfig throws when organizations.signup is not a known policy', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { signup: 'closed' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.signup" should be "invite-only" or "open".'
  );
});

test('validateAuthConfig passes an organizations block with an invitation expiry', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'tenant', invitationExpiresIn: 1209600 },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when organizations.invitationExpiresIn is not an integer', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { invitationExpiresIn: '14d' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.invitationExpiresIn" should be an integer number of seconds.'
  );
});

test('validateAuthConfig throws when organizations.invitationExpiresIn is under a minute', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { invitationExpiresIn: 5 },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "organizations.invitationExpiresIn" should be at least 60 seconds.'
  );
});

test('validateAuthConfig throws when organizations contains an unknown property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(/contains an unknown property/);
});

test('validateAuthConfig passes an enabled phoneNumber block with a phone.otp.send binding', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      phoneNumber: { enabled: true },
      hooks: [{ id: 'send-otp-sms', point: 'phone.otp.send', endpointId: 'auth/send-otp-sms' }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig counts phoneNumber as a login method for the mechanism check', () => {
  const components = {
    auth: {
      secret: validSecret,
      phoneNumber: { enabled: true },
      hooks: [{ id: 'send-otp-sms', point: 'phone.otp.send', endpointId: 'auth/send-otp-sms' }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "database" is required when a login method or provider is configured.'
  );
});

test('validateAuthConfig throws when phoneNumber is enabled without a phone.otp.send binding', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      phoneNumber: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "phoneNumber" is enabled but no hook binds the "phone.otp.send" point. Bind an InternalApi endpoint in "auth.hooks" to send the OTP SMS.'
  );
});

test('validateAuthConfig does not require a phone.otp.send binding when phoneNumber is disabled', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      phoneNumber: { enabled: false },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when phoneNumber is missing the enabled property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      phoneNumber: {},
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "phoneNumber" should have required property "enabled".'
  );
});

test('validateAuthConfig throws when signUpOnVerification is missing tempEmailDomain', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      phoneNumber: { enabled: true, signUpOnVerification: {} },
      hooks: [{ id: 'send-otp-sms', point: 'phone.otp.send', endpointId: 'auth/send-otp-sms' }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "phoneNumber.signUpOnVerification" should have required property "tempEmailDomain".'
  );
});

test('validateAuthConfig throws when phoneNumber contains an unknown property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      phoneNumber: { enabled: true, getTempEmail: 'nope' },
      hooks: [{ id: 'send-otp-sms', point: 'phone.otp.send', endpointId: 'auth/send-otp-sms' }],
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(/contains an unknown property/);
});

test('validateAuthConfig throws when twoFactor is enabled without authPages.twoFactor', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "authPages.twoFactor" is required when "twoFactor.enabled" is true. Set the page the engine routes a two-factor challenge to.'
  );
});

test('validateAuthConfig passes when twoFactor is enabled with authPages.twoFactor set', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { enabled: true },
      authPages: { twoFactor: '/two-factor-challenge' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig does not require authPages.twoFactor when twoFactor is disabled', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { enabled: false },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig does not require authPages.twoFactor when twoFactor is not configured', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when twoFactor.required is true without authPages.twoFactorEnrol', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { enabled: true, required: true },
      authPages: { twoFactor: '/two-factor-challenge' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "authPages.twoFactorEnrol" is required when "twoFactor.required" is true. Every unenrolled user is redirected there, so a deployment requiring enrolment without the page redirects them to nowhere.'
  );
});

test('validateAuthConfig passes when twoFactor.required is true with authPages.twoFactorEnrol set', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { enabled: true, required: true },
      authPages: { twoFactor: '/two-factor-challenge', twoFactorEnrol: '/two-factor-enrol' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when twoFactor.required is true but no factor can be enrolled', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { enabled: false, required: true },
      authPages: { twoFactorEnrol: '/two-factor-enrol' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "twoFactor.required" is true but no second factor can be enrolled - "twoFactor.enabled" is false and passkeys are not enabled. Every user would be locked out with no way to satisfy the requirement.'
  );
});

test('validateAuthConfig passes when twoFactor.required is true and passkeys are the enrolment route', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      twoFactor: { enabled: false, required: true },
      passkey: { enabled: true },
      authPages: { twoFactorEnrol: '/two-factor-enrol' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

const validCaptcha = {
  enabled: true,
  provider: 'cloudflare-turnstile',
  siteKey: '0x4AAAAAAA',
  secretKey: { _secret: 'TURNSTILE_SECRET_KEY' },
};

test('validateAuthConfig passes a valid captcha block alongside a login method', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: validCaptcha,
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig does not count captcha as an authentication mechanism', () => {
  const components = {
    auth: {
      secret: validSecret,
      captcha: validCaptcha,
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth is configured without an authentication mechanism.'
  );
});

test('validateAuthConfig throws when captcha is missing a required property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: { enabled: true, provider: 'cloudflare-turnstile', siteKey: '0x4AAAAAAA' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "captcha" should have required property "secretKey".'
  );
});

test('validateAuthConfig throws when captcha.provider is not a supported provider', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: { ...validCaptcha, provider: 'google-recaptcha' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "captcha.provider" should be "cloudflare-turnstile".'
  );
});

test('validateAuthConfig throws the public-key contract error when siteKey is a _secret reference', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: { ...validCaptcha, siteKey: { _secret: 'TURNSTILE_SITE_KEY' } },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "captcha.siteKey" should be a plain string. The site key is public - every browser reads it from the page - and must not be a _secret operator reference, so the build can project it to Captcha blocks.'
  );
});

test('validateAuthConfig throws when captcha.secretKey is a plain string', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: { ...validCaptcha, secretKey: 'literal-secret' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "captcha.secretKey" should be a _secret operator reference.'
  );
});

test('validateAuthConfig passes an explicit captcha.endpoints array', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: { ...validCaptcha, endpoints: ['/sign-up/email'] },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when captcha contains an unknown property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: { ...validCaptcha, minScore: 0.5 },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(/contains an unknown property/);
});

test('validateAuthConfig throws when captcha.endpoints is an empty array', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      captcha: { ...validCaptcha, endpoints: [] },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "captcha.endpoints" should have at least one endpoint. Omit the key to protect the computed default set, or set "enabled: false" to disable captcha.'
  );
});

test('validateAuthConfig passes a valid oauthProvider block', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      oauthProvider: { consentPage: '/oauth/consent', dynamicClientRegistration: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig throws when oauthProvider has no consentPage', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      oauthProvider: { dynamicClientRegistration: false },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "oauthProvider" should have required property "consentPage".'
  );
});

test('validateAuthConfig throws when oauthProvider.consentPage is not a string', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      oauthProvider: { consentPage: true },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "oauthProvider.consentPage" should be a string.'
  );
});

test('validateAuthConfig throws when oauthProvider.dynamicClientRegistration is not a boolean', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      oauthProvider: { consentPage: '/oauth/consent', dynamicClientRegistration: 'yes' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "oauthProvider.dynamicClientRegistration" should be a boolean.'
  );
});

test('validateAuthConfig throws when oauthProvider contains an unknown property', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      oauthProvider: { consentPage: '/oauth/consent', scopes: ['crm:read'] },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "oauthProvider" contains an unknown property. The known properties are "consentPage", "postLoginPage" and "dynamicClientRegistration".'
  );
});

test('validateAuthConfig throws when oauthProvider.postLoginPage is not a string', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      oauthProvider: { consentPage: '/oauth/consent', postLoginPage: 7 },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "oauthProvider.postLoginPage" should be a string.'
  );
});

test('validateAuthConfig requires oauthProvider.postLoginPage under the tenant organizations policy', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'tenant' },
      oauthProvider: { consentPage: '/oauth/consent' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth "oauthProvider.postLoginPage" is required when "organizations.policy" is "tenant".'
  );
});

test('validateAuthConfig accepts oauthProvider with postLoginPage under the tenant organizations policy', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'tenant' },
      oauthProvider: { consentPage: '/oauth/consent', postLoginPage: '/oauth/select-organization' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig does not require oauthProvider.postLoginPage under the pinned organizations policy', () => {
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      organizations: { policy: 'pinned', org: 'acme' },
      oauthProvider: { consentPage: '/oauth/consent' },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig does not require an auth mechanism when auth only declares dev users', () => {
  const components = {
    auth: {
      dev: {
        browserUser: 'admin',
        users: { admin: { id: 'u1', roles: ['admin'] } },
      },
    },
  };
  expect(() => validateAuthConfig({ components, context })).not.toThrow();
});

test('validateAuthConfig still schema-checks an auth block that only declares dev users', () => {
  const components = {
    auth: {
      dev: { users: { admin: { id: 'u1', notACallerField: true } } },
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(/unknown property/);
});

test('validateAuthConfig throws when auth declares dev users alongside a key that needs a mechanism', () => {
  const components = {
    auth: {
      dev: { users: { admin: { id: 'u1' } } },
      secret: validSecret,
    },
  };
  expect(() => validateAuthConfig({ components, context })).toThrow(
    'Auth is configured without an authentication mechanism.'
  );
});
