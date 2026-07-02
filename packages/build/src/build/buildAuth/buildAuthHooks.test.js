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

import buildAuthHooks from './buildAuthHooks.js';

test('buildAuthHooks returns components unchanged when hooks is undefined', () => {
  const components = {
    auth: {},
  };
  const res = buildAuthHooks({ components });
  expect(res).toEqual({ auth: {} });
});

test('buildAuthHooks passes valid hooks bound to InternalApi endpoints', () => {
  const components = {
    auth: {
      hooks: [
        { id: 'link-contact', point: 'user.create.before', endpointId: 'auth/link-contact' },
        { id: 'audit-login', point: 'session.create.after', endpointId: 'auth/audit-login' },
      ],
    },
    api: [
      { id: 'auth/link-contact', type: 'InternalApi', routine: [] },
      { id: 'auth/audit-login', type: 'InternalApi', routine: [] },
    ],
  };
  const res = buildAuthHooks({ components });
  expect(res.auth.hooks).toEqual([
    { id: 'link-contact', point: 'user.create.before', endpointId: 'auth/link-contact' },
    { id: 'audit-login', point: 'session.create.after', endpointId: 'auth/audit-login' },
  ]);
});

test('buildAuthHooks accepts every point in the frozen catalog', () => {
  const points = [
    'user.create.before',
    'user.create.after',
    'user.update.before',
    'user.update.after',
    'session.create.before',
    'session.create.after',
    'session.delete.after',
    'account.create.before',
    'account.create.after',
    'verification.create.before',
    'verification.create.after',
    'email.verified',
    'invitation.send',
  ];
  const components = {
    auth: {
      hooks: points.map((point, i) => ({ id: `hook-${i}`, point, endpointId: 'auth/hook' })),
    },
    api: [{ id: 'auth/hook', type: 'InternalApi', routine: [] }],
  };
  expect(() => buildAuthHooks({ components })).not.toThrow();
});

test('buildAuthHooks throws when a hook binds an unknown point', () => {
  const components = {
    auth: {
      hooks: [{ id: 'bad-point', point: 'organization.create.before', endpointId: 'auth/hook' }],
    },
    api: [{ id: 'auth/hook', type: 'InternalApi', routine: [] }],
  };
  expect(() => buildAuthHooks({ components })).toThrow(
    'Auth hook "bad-point" binds unknown point "organization.create.before". Valid points are: user.create.before'
  );
});

test('buildAuthHooks throws when two hooks bind the same point', () => {
  const components = {
    auth: {
      hooks: [
        { id: 'first', point: 'user.create.before', endpointId: 'auth/hook' },
        { id: 'second', point: 'user.create.before', endpointId: 'auth/hook' },
      ],
    },
    api: [{ id: 'auth/hook', type: 'InternalApi', routine: [] }],
  };
  expect(() => buildAuthHooks({ components })).toThrow(
    'Auth hooks "first" and "second" both bind point "user.create.before". At most one hook may bind a point.'
  );
});

test('buildAuthHooks throws when the endpoint does not exist', () => {
  const components = {
    auth: {
      hooks: [{ id: 'missing', point: 'user.create.before', endpointId: 'auth/nowhere' }],
    },
    api: [{ id: 'auth/hook', type: 'InternalApi', routine: [] }],
  };
  expect(() => buildAuthHooks({ components })).toThrow(
    'Auth hook "missing" references endpoint "auth/nowhere" which does not exist.'
  );
});

test('buildAuthHooks throws when the endpoint does not exist because api is undefined', () => {
  const components = {
    auth: {
      hooks: [{ id: 'missing', point: 'user.create.before', endpointId: 'auth/nowhere' }],
    },
  };
  expect(() => buildAuthHooks({ components })).toThrow(
    'Auth hook "missing" references endpoint "auth/nowhere" which does not exist.'
  );
});

test('buildAuthHooks throws when the endpoint is not type InternalApi', () => {
  const components = {
    auth: {
      hooks: [{ id: 'public-target', point: 'user.create.before', endpointId: 'auth/hook' }],
    },
    api: [{ id: 'auth/hook', type: 'Api', routine: [] }],
  };
  expect(() => buildAuthHooks({ components })).toThrow(
    'Auth hook "public-target" endpoint "auth/hook" must be type "InternalApi" so it is not callable over HTTP.'
  );
});
