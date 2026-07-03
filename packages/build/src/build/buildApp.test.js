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

import { jest } from '@jest/globals';
import { execSync } from 'child_process';

import buildApp, { computeAppMeta } from './buildApp.js';
import testContext from '../test-utils/testContext.js';

const context = testContext();

let gitSha;

try {
  gitSha = execSync('git rev-parse HEAD').toString().trim();
} catch (_) {
  gitSha = null;
}

const emptyAppMeta = {
  slug: null,
  name: null,
  version: null,
  description: null,
  license: null,
  lowdefyVersion: null,
  gitSha,
};

const originalEnvShaPresent = Object.prototype.hasOwnProperty.call(
  process.env,
  'LOWDEFY_GIT_SHA'
);
const originalEnvSha = process.env.LOWDEFY_GIT_SHA;

beforeEach(() => {
  delete process.env.LOWDEFY_GIT_SHA;
});

afterAll(() => {
  if (originalEnvShaPresent) {
    process.env.LOWDEFY_GIT_SHA = originalEnvSha;
  } else {
    delete process.env.LOWDEFY_GIT_SHA;
  }
});

test('buildApp no app defined', () => {
  const components = {};
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: '',
        appendHead: '',
      },
      notificationLandingPage: '/lowdefy/notification',
    },
    appMeta: emptyAppMeta,
  });
});

test('buildApp empty app object', () => {
  const components = { app: {} };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: '',
        appendHead: '',
      },
      notificationLandingPage: '/lowdefy/notification',
    },
    appMeta: emptyAppMeta,
  });
});

test('buildApp empty html', () => {
  const components = { app: { html: {} } };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: '',
        appendHead: '',
      },
      notificationLandingPage: '/lowdefy/notification',
    },
    appMeta: emptyAppMeta,
  });
});

test('buildApp appendHead and appendBody', () => {
  const components = {
    app: {
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
    },
  };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      email: {},
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
      notificationLandingPage: '/lowdefy/notification',
    },
    appMeta: emptyAppMeta,
  });
});

test('buildApp app not an object', () => {
  const components = {
    app: 'app',
  };
  expect(() => buildApp({ components, context })).toThrow('lowdefy.app is not an object.');
});

test('buildApp populates appMeta from root fields', () => {
  const components = {
    slug: 'my-app',
    name: 'My App',
    version: '1.2.3',
    description: 'Useful.',
    license: 'MIT',
    lowdefy: '5.0.0',
  };
  const result = buildApp({ components, context });
  expect(result.appMeta).toEqual({
    slug: 'my-app',
    name: 'My App',
    version: '1.2.3',
    description: 'Useful.',
    license: 'MIT',
    lowdefyVersion: '5.0.0',
    gitSha,
  });
});

test('buildApp absent root fields become null in appMeta', () => {
  const components = {};
  const result = buildApp({ components, context });
  expect(result.appMeta).toEqual({
    slug: null,
    name: null,
    version: null,
    description: null,
    license: null,
    lowdefyVersion: null,
    gitSha,
  });
});

test('computeAppMeta builds appMeta shape from source fields', () => {
  expect(
    computeAppMeta({
      slug: 'my-app',
      name: 'My App',
      version: '1.2.3',
      description: 'Useful.',
      license: 'MIT',
      lowdefy: '5.0.0',
    })
  ).toEqual({
    slug: 'my-app',
    name: 'My App',
    version: '1.2.3',
    description: 'Useful.',
    license: 'MIT',
    lowdefyVersion: '5.0.0',
    gitSha,
  });
});

test('buildApp prefers context.appMeta when present', () => {
  const precomputed = { ...emptyAppMeta, slug: 'precomputed' };
  const contextWithMeta = testContext();
  contextWithMeta.appMeta = precomputed;
  const result = buildApp({
    components: { slug: 'from-components' },
    context: contextWithMeta,
  });
  expect(result.appMeta).toBe(precomputed);
  expect(result.appMeta.slug).toBe('precomputed');
});

test('buildApp LOWDEFY_GIT_SHA env var wins over git rev-parse', async () => {
  jest.resetModules();
  jest.unstable_mockModule('child_process', () => ({
    execSync: jest.fn(() => Buffer.from('from-git-rev-parse\n')),
  }));
  const { default: buildAppMocked } = await import('./buildApp.js');

  process.env.LOWDEFY_GIT_SHA = 'from-env-var';
  const result = buildAppMocked({ components: {}, context });
  expect(result.appMeta.gitSha).toBe('from-env-var');

  delete process.env.LOWDEFY_GIT_SHA;
  const result2 = buildAppMocked({ components: {}, context });
  expect(result2.appMeta.gitSha).toBe('from-git-rev-parse');
});

test('buildApp empty/whitespace LOWDEFY_GIT_SHA falls through to git rev-parse', async () => {
  jest.resetModules();
  jest.unstable_mockModule('child_process', () => ({
    execSync: jest.fn(() => Buffer.from('from-git-rev-parse\n')),
  }));
  const { default: buildAppMocked } = await import('./buildApp.js');

  process.env.LOWDEFY_GIT_SHA = '';
  expect(buildAppMocked({ components: {}, context }).appMeta.gitSha).toBe('from-git-rev-parse');

  process.env.LOWDEFY_GIT_SHA = '   ';
  expect(buildAppMocked({ components: {}, context }).appMeta.gitSha).toBe('from-git-rev-parse');
});

test('buildApp returns null gitSha when both env and git rev-parse fail', async () => {
  jest.resetModules();
  jest.unstable_mockModule('child_process', () => ({
    execSync: jest.fn(() => {
      throw new Error('not a git repo');
    }),
  }));
  const { default: buildAppMocked } = await import('./buildApp.js');

  const result = buildAppMocked({ components: {}, context });
  expect(result.appMeta.gitSha).toBeNull();
});
