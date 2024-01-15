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

import { execSync } from 'child_process';

import buildApp from './buildApp.js';
import testContext from '../test/testContext.js';

const context = testContext();

let git_sha;

try {
  git_sha = execSync('git rev-parse HEAD').toString().trim();
} catch (_) {
  //pass
}

test('buildApp no app defined', () => {
  const components = {};
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: '',
        appendHead: '',
      },
      git_sha,
    },
  });
});

test('buildApp empty app object', () => {
  const components = { app: {} };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: '',
        appendHead: '',
      },
      git_sha,
    },
  });
});

test('buildApp empty html', () => {
  const components = { app: { html: {} } };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: '',
        appendHead: '',
      },
      git_sha,
    },
  });
});

test('buildApp appendHead and appendHead', () => {
  const components = {
    app: {
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
      git_sha,
    },
  };
  const result = buildApp({ components, context });
  expect(result).toEqual({
    app: {
      html: {
        appendBody: 'body',
        appendHead: 'head',
      },
      git_sha,
    },
  });
});

test('buildApp app not an object', () => {
  const components = {
    app: 'app',
  };
  expect(() => buildApp({ components, context })).toThrow('lowdefy.app is not an object.');
});
