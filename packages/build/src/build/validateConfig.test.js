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

import validateConfig from './validateConfig.js';
import testContext from '../test-utils/testContext.js';

const context = testContext();

test('validateConfig no config defined', () => {
  const components = {};
  const result = validateConfig({ components, context });
  expect(result).toEqual({
    config: {},
  });
});

test('validateConfig config not an object', () => {
  const components = {
    config: 'config',
  };
  expect(() => validateConfig({ components, context })).toThrow('lowdefy.config is not an object.');
});

test('validateConfig config error when basePath does not start with "/".', () => {
  let components = {
    config: {
      basePath: '/base',
    },
  };
  const result = validateConfig({ components, context });
  expect(result).toEqual({
    config: {
      basePath: '/base',
    },
  });
  components = {
    config: {
      basePath: 'base',
    },
  };
  expect(() => validateConfig({ components, context })).toThrow('Base path must start with "/".');
});

test('validateConfig accepts cron environments with one host and forwarded environments', () => {
  const components = {
    config: {
      cron: {
        environments: {
          production: {},
          staging: { url: 'https://staging.example.com', secret: 'STAGING_CRON_SECRET' },
          develop: {
            url: 'https://develop.example.com',
            secret: 'DEVELOP_CRON_SECRET',
            enabled: false,
          },
        },
      },
    },
  };
  expect(validateConfig({ components, context })).toEqual(components);
});

test('validateConfig throws when config.cron.environments is missing', () => {
  const components = { config: { cron: {} } };
  expect(() => validateConfig({ components, context })).toThrow(
    'lowdefy.config.cron.environments is not an object.'
  );
});

test('validateConfig throws when no cron environment is the host', () => {
  const components = {
    config: {
      cron: {
        environments: {
          staging: { url: 'https://staging.example.com', secret: 'STAGING_CRON_SECRET' },
        },
      },
    },
  };
  expect(() => validateConfig({ components, context })).toThrow(
    'Exactly one environment in lowdefy.config.cron.environments must have no url (the deployment that runs the crons). Received [].'
  );
});

test('validateConfig throws when more than one cron environment is the host', () => {
  const components = {
    config: { cron: { environments: { production: {}, staging: {} } } },
  };
  expect(() => validateConfig({ components, context })).toThrow(
    'Received ["production","staging"].'
  );
});

test('validateConfig throws when a forwarded cron environment has no secret', () => {
  const components = {
    config: {
      cron: { environments: { production: {}, staging: { url: 'https://staging.example.com' } } },
    },
  };
  expect(() => validateConfig({ components, context })).toThrow(
    'Cron environment "staging" has a url but no secret.'
  );
});

test('validateConfig throws when a cron environment url is not an absolute http url', () => {
  const components = {
    config: {
      cron: {
        environments: { production: {}, staging: { url: 'staging.example.com', secret: 'S' } },
      },
    },
  };
  expect(() => validateConfig({ components, context })).toThrow(
    'Cron environment "staging" url is not an absolute http(s) URL'
  );
});

test('validateConfig throws when the host cron environment has a secret', () => {
  const components = {
    config: {
      cron: {
        environments: {
          production: { secret: 'X' },
          staging: { url: 'https://staging.example.com', secret: 'S' },
        },
      },
    },
  };
  expect(() => validateConfig({ components, context })).toThrow(
    'Cron environment "production" has a secret but no url.'
  );
});

test('validateConfig throws for an invalid cron environment name', () => {
  const components = {
    config: {
      cron: {
        environments: {
          production: {},
          'staging/eu': { url: 'https://staging.example.com', secret: 'S' },
        },
      },
    },
  };
  expect(() => validateConfig({ components, context })).toThrow(
    'Cron environment name "staging/eu" is invalid.'
  );
});

test('validateConfig throws for a cron environment named default', () => {
  const components = {
    config: {
      cron: {
        environments: { production: {}, default: { url: 'https://d.example.com', secret: 'S' } },
      },
    },
  };
  expect(() => validateConfig({ components, context })).toThrow(
    'Cron environment name "default" is reserved'
  );
});
