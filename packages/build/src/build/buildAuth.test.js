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

import buildAuth from './buildAuth';
import validateConfig from './validateConfig';
import testContext from '../test/testContext';

const context = testContext();

test('buildAuth default', async () => {
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
    },
    auth: {
      include: [],
      set: 'public',
      default: 'public',
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
    },
    auth: {
      include: ['a', 'b'],
      set: 'public',
      default: 'protected',
    },
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
    },
    auth: {
      include: ['a', 'b'],
      set: 'protected',
      default: 'public',
    },
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
    },
    auth: {
      include: [],
      set: 'protected',
      default: 'public',
    },
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
    },
    auth: {
      include: [],
      set: 'public',
      default: 'protected',
    },
  });
});
