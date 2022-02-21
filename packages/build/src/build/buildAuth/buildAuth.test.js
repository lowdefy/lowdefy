/*
  Copyright 2020-2021 Lowdefy, Inc

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
import validateConfig from '../validateConfig.js';
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
  // validateConfig adds default values
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          roles: {},
        },
      },
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
  // validateConfig adds default values
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          roles: {},
        },
      },
      theme: {},
    },
  });
});

test('buildAuth all protected, some public', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          public: ['a', 'b'],
          roles: {},
        },
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          public: ['a', 'b'],
          roles: {},
        },
      },
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
    config: {
      auth: {
        pages: {
          protected: ['a', 'b'],
          roles: {},
        },
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          protected: ['a', 'b'],
          roles: {},
        },
      },
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
    config: {
      auth: {
        pages: {
          public: true,
          roles: {},
        },
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          public: true,
          roles: {},
        },
      },
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
    config: {
      auth: {
        pages: {
          protected: true,
          roles: {},
        },
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          protected: true,
          roles: {},
        },
      },
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
    config: {
      auth: {
        pages: {
          roles: {
            role1: ['page1'],
            role2: ['page1', 'page2'],
          },
        },
      },
    },
    pages: [
      { id: 'page1', type: 'Context' },
      { id: 'page2', type: 'Context' },
      { id: 'page3', type: 'Context' },
    ],
  };
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          roles: {
            role1: ['page1'],
            role2: ['page1', 'page2'],
          },
        },
      },
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
    config: {
      auth: {
        pages: {
          roles: {
            role1: ['page1'],
          },
          public: ['page1'],
        },
      },
    },
    pages: [{ id: 'page1', type: 'Context' }],
  };
  validateConfig({ components });
  expect(() => buildAuth({ components, context })).toThrow(
    'Page "page1" is both protected by roles ["role1"] and public.'
  );
});

test('buildAuth roles and protected pages array', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          roles: {
            role1: ['page1'],
          },
          protected: ['page1'],
        },
      },
    },
    pages: [{ id: 'page1', type: 'Context' }],
  };
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          roles: {
            role1: ['page1'],
          },
          protected: ['page1'],
        },
      },
      theme: {},
    },
    pages: [{ id: 'page1', type: 'Context', auth: { public: false, roles: ['role1'] } }],
  });
});

test('buildAuth roles and protected true', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          roles: {
            role1: ['page1'],
          },
          protected: true,
        },
      },
    },
    pages: [{ id: 'page1', type: 'Context' }],
  };
  validateConfig({ components });
  const res = await buildAuth({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          roles: {
            role1: ['page1'],
          },
          protected: true,
        },
      },
      theme: {},
    },
    pages: [{ id: 'page1', type: 'Context', auth: { public: false, roles: ['role1'] } }],
  });
});
