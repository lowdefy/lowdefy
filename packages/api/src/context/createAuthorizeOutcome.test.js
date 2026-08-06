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

import createAuthorizeOutcome from './createAuthorizeOutcome.js';

import { ConfigError } from '@lowdefy/errors';

test('authorizeOutcome public object', () => {
  const auth = { public: true };
  let authorizeOutcome = createAuthorizeOutcome({});
  expect(authorizeOutcome({ auth })).toBe('allow');

  authorizeOutcome = createAuthorizeOutcome({ user: { sub: 'sub' } });
  expect(authorizeOutcome({ auth })).toBe('allow');
});

test('authorizeOutcome protected object, no roles', () => {
  const auth = { public: false };

  let authorizeOutcome = createAuthorizeOutcome({});
  expect(authorizeOutcome({ auth })).toBe('deny');

  authorizeOutcome = createAuthorizeOutcome({ user: { sub: 'sub' } });
  expect(authorizeOutcome({ auth })).toBe('allow');
});

test('authorizeOutcome role protected object', () => {
  const auth = { public: false, roles: ['role1'] };

  let authorizeOutcome = createAuthorizeOutcome({});
  expect(authorizeOutcome({ auth })).toBe('deny');

  authorizeOutcome = createAuthorizeOutcome({ user: { sub: 'sub' } });
  expect(authorizeOutcome({ auth })).toBe('deny');

  authorizeOutcome = createAuthorizeOutcome({ user: { sub: 'sub', roles: [] } });
  expect(authorizeOutcome({ auth })).toBe('deny');

  authorizeOutcome = createAuthorizeOutcome({ user: { sub: 'sub', roles: ['role2'] } });
  expect(authorizeOutcome({ auth })).toBe('deny');

  authorizeOutcome = createAuthorizeOutcome({ user: { sub: 'sub', roles: ['role1'] } });
  expect(authorizeOutcome({ auth })).toBe('allow');

  authorizeOutcome = createAuthorizeOutcome({ user: { sub: 'sub', roles: ['role1', 'role2'] } });
  expect(authorizeOutcome({ auth })).toBe('allow');
});

test('throws ConfigError with helpful message when auth.public is undefined', () => {
  const authorizeOutcome = createAuthorizeOutcome({});
  // Message doesn't include Received - that's formatted by logger
  expect(() => authorizeOutcome({ auth: { other: 'value' } })).toThrow(
    'auth.public must be true or false.'
  );
  expect(() => authorizeOutcome({ auth: {} })).toThrow('auth.public must be true or false.');
});

test('throws ConfigError with received value when auth.public is wrong type', () => {
  const authorizeOutcome = createAuthorizeOutcome({});
  try {
    authorizeOutcome({ auth: { public: 'yes' } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('auth.public must be true or false.');
    expect(e.received).toBe('yes');
  }
  try {
    authorizeOutcome({ auth: { public: 1 } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toBe(1);
  }
  try {
    authorizeOutcome({ auth: { public: null } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toBe(null);
  }
});

test('throws ConfigError when user.roles is a string', () => {
  try {
    createAuthorizeOutcome({ user: { sub: 'sub', roles: 'admin' } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('user.roles must be an array of strings.');
    expect(e.received).toBe('admin');
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when user.roles is a number', () => {
  try {
    createAuthorizeOutcome({ user: { sub: 'sub', roles: 42 } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toBe(42);
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when user.roles is an object', () => {
  try {
    createAuthorizeOutcome({ user: { sub: 'sub', roles: { admin: true } } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.received).toEqual({ admin: true });
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('throws ConfigError when user.roles contains a non-string entry', () => {
  try {
    createAuthorizeOutcome({ user: { sub: 'sub', roles: ['admin', 42] } });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('user.roles must be an array of strings.');
    expect(e.received).toEqual(['admin', 42]);
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('context.system true authorizes protected config without a user', () => {
  const authorizeOutcome = createAuthorizeOutcome({ user: null, system: true });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('allow');
  expect(authorizeOutcome({ auth: { public: true } })).toBe('allow');
});

test('context.system true authorizes roles-protected config without a user', () => {
  const authorizeOutcome = createAuthorizeOutcome({ user: null, system: true });
  expect(authorizeOutcome({ auth: { public: false, roles: ['admin'] } })).toBe('allow');
});

test('context.system true on a role-gated config returns allow without an enrolment check', () => {
  // system short-circuits before roles and before the enrolment floor: a
  // caller-less system context holds no factor, so enrolment is undefined for it.
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: { twoFactorRequired: true, twoFactorEnrolPageId: 'enrol' },
    system: true,
    user: null,
  });
  expect(authorizeOutcome({ auth: { public: false, roles: ['admin'] } })).toBe('allow');
});

test('an unset context.system applies the normal auth.public / auth.roles matching', () => {
  // createAuthorizeOutcome is called with the whole context; a normal run has
  // context.system unset, so the blanket pass never triggers.
  const authorizeOutcome = createAuthorizeOutcome({ user: null });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('deny');
  expect(authorizeOutcome({ auth: { public: true } })).toBe('allow');
});

test('throws ConfigError with configKey for location tracing', () => {
  const authorizeOutcome = createAuthorizeOutcome({});
  try {
    authorizeOutcome({ auth: {}, '~k': 'pages[0:home].auth' });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.configKey).toBe('pages[0:home].auth');
    expect(e.message).toBe('auth.public must be true or false.');
    expect(e.received).toBeUndefined();
  }
});

const enforcement = { twoFactorRequired: true, twoFactorEnrolPageId: 'enrol' };

test('enrolment required, unenrolled, protected with no roles returns enrol_required', () => {
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub', two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('enrol_required');
});

test('enrolment required, unenrolled, protected page whose roles the caller lacks returns deny', () => {
  // The ordering assertion: roles are checked before enrolment, so a caller who
  // fails the role gate is denied and never learns whether the page exists via an
  // enrol redirect. Must never regress.
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub', roles: ['role2'], two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: false, roles: ['role1'] } })).toBe('deny');
});

test('enrolment required, unenrolled, public config returns allow', () => {
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub', two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: true } })).toBe('allow');
});

test('enrolment required, unenrolled, pageId equal to the enrol page is exempt', () => {
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub', two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: false } }, { pageId: 'enrol' })).toBe('allow');
});

test('enrolment required, unenrolled, a different pageId is not exempt', () => {
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub', two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: false } }, { pageId: 'other' })).toBe('enrol_required');
});

test('enrolment required, unenrolled, a config id colliding with the enrol page but no pageId is not exempt', () => {
  // The exemption keys on the explicit pageId argument passed only by the page
  // route, never on config.id - so a non-page caller cannot reach the exemption
  // by carrying an id that collides with the enrol page's string.
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub', two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: false }, id: 'enrol' })).toBe('enrol_required');
});

test('enrolment required, caller with no two_factor_enrolled key passes untouched', () => {
  // Absent key = pass untouched (strategy/injected/system callers - Decision 10).
  // The check is strictly === false, never !user.two_factor_enrolled.
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub' },
  });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('allow');
});

test('enrolment required, enrolled caller returns allow', () => {
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: { sub: 'sub', two_factor_enrolled: true },
  });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('allow');
});

test('enrolment off, unenrolled caller returns allow', () => {
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: { twoFactorRequired: false, twoFactorEnrolPageId: 'enrol' },
    user: { sub: 'sub', two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('allow');
});

test('authEnforcement null returns allow for enrolled and unenrolled alike', () => {
  let authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: null,
    user: { sub: 'sub', two_factor_enrolled: false },
  });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('allow');

  authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: null,
    user: { sub: 'sub', two_factor_enrolled: true },
  });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('allow');
});

test('enrolment required, unauthenticated on a protected config returns deny', () => {
  const authorizeOutcome = createAuthorizeOutcome({
    authEnforcement: enforcement,
    user: null,
  });
  expect(authorizeOutcome({ auth: { public: false } })).toBe('deny');
});
