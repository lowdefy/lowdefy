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

import buildConfig from './buildConfig';
import testContext from '../test/testContext';

const context = testContext();

test('buildConfig config not an object', async () => {
  const components = {
    config: 'config',
  };
  await expect(buildConfig({ components, context })).rejects.toThrow('Config is not an object.');
});

test('buildConfig config error when both protected and public pages are both arrays', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          protected: [],
          public: [],
        },
      },
    },
  };
  await expect(buildConfig({ components, context })).rejects.toThrow(
    'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and visa versa.'
  );
});

test('buildConfig config error when both protected and public pages are true', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          protected: true,
          public: true,
        },
      },
    },
  };
  await expect(buildConfig({ components, context })).rejects.toThrow(
    'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and visa versa.'
  );
});

test('buildConfig default', async () => {
  const components = {};
  const res = await buildConfig({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {},
      },
    },
    auth: {
      include: [],
      set: 'public',
      default: 'public',
    },
  });
});

test('buildConfig all protected, some public', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          public: ['a', 'b'],
        },
      },
    },
  };
  const res = await buildConfig({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          public: ['a', 'b'],
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

test('buildConfig all public, some protected', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          protected: ['a', 'b'],
        },
      },
    },
  };
  const res = await buildConfig({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          protected: ['a', 'b'],
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

test('buildConfig all public', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          public: true,
        },
      },
    },
  };
  const res = await buildConfig({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          public: true,
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

test('buildConfig all protected', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          protected: true,
        },
      },
    },
  };
  const res = await buildConfig({ components, context });
  expect(res).toEqual({
    config: {
      auth: {
        pages: {
          protected: true,
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
