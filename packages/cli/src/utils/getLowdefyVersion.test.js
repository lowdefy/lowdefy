/*
  Copyright 2020 Lowdefy, Inc

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

import path from 'path';
import { readFile } from '@lowdefy/node-utils';
import getLowdefyVersion from './getLowdefyVersion';

jest.mock('@lowdefy/node-utils', () => {
  const readFile = jest.fn();
  return {
    readFile,
  };
});

beforeEach(() => {
  readFile.mockReset();
});

test('get version from yaml file', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      version: 1.0.0
      `;
    }
    return null;
  });
  const version = await getLowdefyVersion();
  expect(version).toEqual('1.0.0');
});

test('get version from yaml file, base dir specified', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'baseDir/lowdefy.yaml')) {
      return `
      version: 1.0.0
      `;
    }
    return null;
  });
  const version = await getLowdefyVersion('./baseDir');
  expect(version).toEqual('1.0.0');
});

test('could not find lowdefy.yaml in cwd', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return null;
    }
    return `
    version: 1.0.0
    `;
  });
  await expect(getLowdefyVersion()).rejects.toThrow(
    'Could not find "lowdefy.yaml" file in current working directory. Change directory to a Lowdefy project, or specify a base directory.'
  );
});

test('could not find lowdefy.yaml in base dir', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'baseDir/lowdefy.yaml')) {
      return null;
    }
    return `
    version: 1.0.0
    `;
  });
  await expect(getLowdefyVersion('./baseDir')).rejects.toThrow(
    'Could not find "lowdefy.yaml" file in specified base directory'
  );
});

test('lowdefy.yaml is invalid yaml', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      version: 1.0.0
        - a: a
        b: b
      `;
    }
    return null;
  });
  await expect(getLowdefyVersion()).rejects.toThrow(
    'Could not parse "lowdefy.yaml" file. Received error '
  );
});

test('No version specified', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      pages:
        - id: page1
          type: Context
      `;
    }
    return null;
  });
  await expect(getLowdefyVersion()).rejects.toThrow(
    'No version specified in "lowdefy.yaml" file. Specify a version in the "version field".'
  );
});

test('Version is not a string', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      version: 1
      `;
    }
    return null;
  });
  await expect(getLowdefyVersion()).rejects.toThrow(
    'Version number specified in "lowdefy.yaml" file is not valid. Received 1.'
  );
});

test('Version is not a valid version number', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), 'lowdefy.yaml')) {
      return `
      version: v1-0-3
      `;
    }
    return null;
  });
  await expect(getLowdefyVersion()).rejects.toThrow(
    'Version number specified in "lowdefy.yaml" file is not valid. Received "v1-0-3".'
  );
});
