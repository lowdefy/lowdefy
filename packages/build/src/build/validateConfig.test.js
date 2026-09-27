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

test.each([
  ['/app/', '/app'],
  ['/app//', '/app'],
  ['/app/nested/', '/app/nested'],
  ['/', ''],
])('validateConfig removes the trailing slash from basePath %s', (basePath, expected) => {
  const components = { config: { basePath } };
  validateConfig({ components, context });
  expect(components.config.basePath).toEqual(expected);
});

test('validateConfig leaves appMeta unchanged when config.dependencyTracking is not set', () => {
  const components = { appMeta: { slug: 'app' }, config: {} };
  validateConfig({ components, context });
  expect(components.appMeta).toEqual({ slug: 'app' });
});

test('validateConfig carries config.dependencyTracking false to appMeta', () => {
  const components = { appMeta: { slug: 'app' }, config: { dependencyTracking: false } };
  validateConfig({ components, context });
  expect(components.appMeta).toEqual({ slug: 'app', dependencyTracking: false });
});

test('validateConfig leaves appMeta unchanged when config.dependencyTracking is true', () => {
  const components = { appMeta: { slug: 'app' }, config: { dependencyTracking: true } };
  validateConfig({ components, context });
  expect(components.appMeta).toEqual({ slug: 'app' });
});

test('validateConfig throws when config.dependencyTracking is not a boolean', () => {
  const components = { appMeta: {}, config: { dependencyTracking: 'no' } };
  expect(() => validateConfig({ components, context })).toThrow(
    'App "config.dependencyTracking" should be a boolean.'
  );
});

test('validateConfig accepts trustedProxies addresses and CIDR ranges', () => {
  const components = { config: { trustedProxies: ['10.0.0.0/8', '127.0.0.1', 'fd00::/8'] } };
  validateConfig({ components, context });
  expect(components.config.trustedProxies).toEqual(['10.0.0.0/8', '127.0.0.1', 'fd00::/8']);
});

test.each([
  ['not an array', '10.0.0.0/8', 'should be an array of IP address or CIDR range strings'],
  ['a hostname entry', ['proxy.internal'], 'entries should be IP addresses'],
  ['an out-of-range prefix', ['10.0.0.0/40'], 'entries should be IP addresses'],
  ['a non-string entry', [10], 'entries should be IP addresses'],
])('validateConfig throws when trustedProxies is %s', (_, trustedProxies, message) => {
  const components = { config: { trustedProxies } };
  expect(() => validateConfig({ components, context })).toThrow(message);
});

test.each([['0.0.0.0/0'], ['::/0']])(
  'validateConfig warns that trustedProxies range %s trusts every address',
  (range) => {
    const warnings = [];
    const warnContext = { ...context, handleWarning: (warning) => warnings.push(warning) };
    const components = { config: { trustedProxies: ['10.0.0.0/8', range] } };
    validateConfig({ components, context: warnContext });
    expect(warnings.map((warning) => warning.message)).toEqual([
      `App "config.trustedProxies" entry "${range}" trusts every address, so any client can choose the address auth rate limits and sessions record by sending X-Forwarded-For. List only the addresses or ranges of your proxies.`,
    ]);
  }
);

test('validateConfig does not warn for trustedProxies ranges narrower than every address', () => {
  const warnings = [];
  const warnContext = { ...context, handleWarning: (warning) => warnings.push(warning) };
  const components = { config: { trustedProxies: ['10.0.0.0/8', '0.0.0.0/1', '127.0.0.1'] } };
  validateConfig({ components, context: warnContext });
  expect(warnings).toEqual([]);
});
