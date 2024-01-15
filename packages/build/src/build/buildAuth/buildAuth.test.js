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

import buildAuth from './buildAuth.js';
import testContext from '../../test/testContext.js';

const context = testContext();

test('buildAuth default', async () => {
  const components = {
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: false,
      events: [],
      pages: {
        roles: {},
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [
      { id: 'a', type: 'Context', auth: { public: true } },
      { id: 'b', type: 'Context', auth: { public: true } },
      { id: 'c', type: 'Context', auth: { public: true } },
    ],
  });
});

test('buildAuth no pages', async () => {
  const components = {};
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: false,
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

test('buildAuth all protected, some public', async () => {
  const components = {
    auth: {
      pages: {
        public: ['a', 'b'],
        roles: {},
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: true,
      events: [],
      pages: {
        public: ['a', 'b'],
        roles: {},
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [
      { id: 'a', type: 'Context', auth: { public: true } },
      { id: 'b', type: 'Context', auth: { public: true } },
      { id: 'c', type: 'Context', auth: { public: false } },
    ],
  });
});

test('buildAuth all public, some protected', async () => {
  const components = {
    auth: {
      pages: {
        protected: ['a', 'b'],
        roles: {},
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: true,
      events: [],
      pages: {
        protected: ['a', 'b'],
        roles: {},
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [
      { id: 'a', type: 'Context', auth: { public: false } },
      { id: 'b', type: 'Context', auth: { public: false } },
      { id: 'c', type: 'Context', auth: { public: true } },
    ],
  });
});

test('buildAuth all public', async () => {
  const components = {
    auth: {
      pages: {
        public: true,
        roles: {},
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: true,
      events: [],
      pages: {
        public: true,
        roles: {},
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [
      { id: 'a', type: 'Context', auth: { public: true } },
      { id: 'b', type: 'Context', auth: { public: true } },
      { id: 'c', type: 'Context', auth: { public: true } },
    ],
  });
});

test('buildAuth all protected', async () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        roles: {},
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      events: [],
      configured: true,
      pages: {
        protected: true,
        roles: {},
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [
      { id: 'a', type: 'Context', auth: { public: false } },
      { id: 'b', type: 'Context', auth: { public: false } },
      { id: 'c', type: 'Context', auth: { public: false } },
    ],
  });
});

test('buildAuth roles', async () => {
  const components = {
    auth: {
      pages: {
        roles: {
          role1: ['page1'],
          role2: ['page1', 'page2'],
        },
      },
    },
    pages: [
      { id: 'page1', type: 'Context' },
      { id: 'page2', type: 'Context' },
      { id: 'page3', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: true,
      events: [],
      pages: {
        roles: {
          role1: ['page1'],
          role2: ['page1', 'page2'],
        },
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [
      { id: 'page1', type: 'Context', auth: { public: false, roles: ['role1', 'role2'] } },
      { id: 'page2', type: 'Context', auth: { public: false, roles: ['role2'] } },
      { id: 'page3', type: 'Context', auth: { public: true } },
    ],
  });
});

test('buildAuth roles and public pages inconsistency', async () => {
  const components = {
    auth: {
      pages: {
        roles: {
          role1: ['page1'],
        },
        public: ['page1'],
      },
    },
    pages: [{ id: 'page1', type: 'Context' }],
  };
  expect(() => buildAuth({ components, context })).toThrow(
    'Page "page1" is both protected by roles ["role1"] and public.'
  );
});

test('buildAuth roles and protected pages array', async () => {
  const components = {
    auth: {
      pages: {
        roles: {
          role1: ['page1'],
        },
        protected: ['page1'],
      },
    },
    pages: [{ id: 'page1', type: 'Context' }],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: true,
      events: [],
      pages: {
        roles: {
          role1: ['page1'],
        },
        protected: ['page1'],
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [{ id: 'page1', type: 'Context', auth: { public: false, roles: ['role1'] } }],
  });
});

test('buildAuth roles and protected true', async () => {
  const components = {
    auth: {
      pages: {
        roles: {
          role1: ['page1'],
        },
        protected: true,
      },
    },
    pages: [{ id: 'page1', type: 'Context' }],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      callbacks: [],
      configured: true,
      events: [],
      pages: {
        roles: {
          role1: ['page1'],
        },
        protected: true,
      },
      providers: [],
      session: {},
      theme: {},
    },
    pages: [{ id: 'page1', type: 'Context', auth: { public: false, roles: ['role1'] } }],
  });
});

test('Auth plugins are counted', () => {
  const components = {
    auth: {
      adapter: {
        id: 'adapter',
        type: 'Adapter',
        properties: {
          x: 1,
        },
      },
      providers: [
        {
          id: 'provider',
          type: 'Provider',
          properties: {
            x: 1,
          },
        },
      ],
      callbacks: [
        {
          id: 'callback',
          type: 'Callback',
          properties: {
            x: 1,
          },
        },
      ],
      events: [
        {
          id: 'event',
          type: 'Event',
          properties: {
            x: 1,
          },
        },
      ],
    },
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      authPages: {},
      adapter: {
        id: 'adapter',
        properties: {
          x: 1,
        },
        type: 'Adapter',
      },
      callbacks: [
        {
          id: 'callback',
          properties: {
            x: 1,
          },
          type: 'Callback',
        },
      ],
      configured: true,
      events: [
        {
          id: 'event',
          properties: {
            x: 1,
          },
          type: 'Event',
        },
      ],
      pages: {
        roles: {},
      },
      providers: [
        {
          id: 'provider',
          properties: {
            x: 1,
          },
          type: 'Provider',
        },
      ],
      session: {},
      theme: {},
    },
  });
  expect(context.typeCounters.auth.adapters.getCounts()).toEqual({ Adapter: 1 });
  expect(context.typeCounters.auth.providers.getCounts()).toEqual({ Provider: 1 });
  expect(context.typeCounters.auth.callbacks.getCounts()).toEqual({ Callback: 1 });
  expect(context.typeCounters.auth.events.getCounts()).toEqual({ Event: 1 });
});
