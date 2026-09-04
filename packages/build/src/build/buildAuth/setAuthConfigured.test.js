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

import setAuthConfigured from './setAuthConfigured.js';

test('setAuthConfigured sets configured to true when auth has a non-marker key', () => {
  const components = {
    auth: {
      emailAndPassword: { enabled: true },
    },
  };
  const res = setAuthConfigured({ components });
  expect(res.auth.configured).toBe(true);
});

test('setAuthConfigured sets configured to false when auth is empty', () => {
  const components = { auth: {} };
  const res = setAuthConfigured({ components });
  expect(res.auth.configured).toBe(false);
});

test('setAuthConfigured sets configured to false when auth only contains marker keys', () => {
  const components = {
    auth: {
      '~k': '1',
    },
  };
  const res = setAuthConfigured({ components });
  expect(res.auth.configured).toBe(false);
});

test('setAuthConfigured sets configured to false when auth only declares dev users', () => {
  const components = {
    auth: { dev: { browserUser: 'admin', users: { admin: { id: 'u1' } } } },
  };
  const res = setAuthConfigured({ components });
  expect(res.auth.configured).toBe(false);
});
