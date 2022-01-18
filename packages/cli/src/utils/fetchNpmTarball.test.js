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

/* eslint-disable no-unused-vars */

import axios from 'axios';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import fetchNpmTarball from './fetchNpmTarball.js';

// TODO: not testing decompress

jest.mock('decompress');
jest.mock('decompress-targz');

const directory = 'directory';

jest.mock('axios', () => {
  return {
    get: (url) => {
      if (url === 'https://registry.npmjs.org/valid-package') {
        return Promise.resolve({
          data: {
            versions: {
              '1.0.0': {
                dist: {
                  tarball: 'tarball-url',
                },
              },
              v404: {
                dist: {
                  tarball: 'https://registry.npmjs.org/404',
                },
              },
              noData: {
                dist: {
                  tarball: 'https://registry.npmjs.org/no-data',
                },
              },
              undef: {
                dist: {
                  tarball: 'https://registry.npmjs.org/undefined',
                },
              },
              error: {
                dist: {
                  tarball: 'https://registry.npmjs.org/axios-error',
                },
              },
            },
          },
        });
      }
      if (url === 'tarball-url') {
        return {
          data: Buffer.from('tarball data'),
        };
      }
      if (url === 'https://registry.npmjs.org/404') {
        const error = new Error('Test 404');
        error.response = {};
        error.response.status = 404;
        throw error;
      }
      if (url === 'https://registry.npmjs.org/axios-error') {
        throw new Error('Axios error');
      }
      if (url === 'https://registry.npmjs.org/no-data') {
        return {};
      }
      if (url === 'https://registry.npmjs.org/undefined') {
        return;
      }
    },
  };
});

// TODO: Axios mock is not working so packages are loaded from npm.

// test('valid package and version', async () => {
//   await fetchNpmTarball({ packageName: 'valid-package', version: '1.0.0', directory });
//   expect(true).toBe(true);
// });

// test('version does not exist', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'valid-package', version: 'invalid', directory })
//   ).rejects.toThrow('Invalid version. "valid-package" does not have version "invalid"');
// });

// test('npm return a 404', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: '404', version: '1.0.0', directory })
//   ).rejects.toThrow('Package "404" could not be found at https://registry.npmjs.org/404.');
// });

// test('axios error', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'axios-error', version: '1.0.0', directory })
//   ).rejects.toThrow('Axios error');
// });

// test('empty response', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'no-data', version: '1.0.0', directory })
//   ).rejects.toThrow('Package "no-data" could not be found at https://registry.npmjs.org/no-data.');
// });

// test('undefined response', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'undefined', version: '1.0.0', directory })
//   ).rejects.toThrow(
//     'Package "undefined" could not be found at https://registry.npmjs.org/undefined.'
//   );
// });

// test('tarball 404', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'valid-package', version: 'v404', directory })
//   ).rejects.toThrow(
//     'Package "valid-package" tarball could not be found at https://registry.npmjs.org/404.'
//   );
// });

// test('tarball axios error', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'valid-package', version: 'error', directory })
//   ).rejects.toThrow('Axios error');
// });

// test('tarball empty response', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'valid-package', version: 'noData', directory })
//   ).rejects.toThrow(
//     'Package "valid-package" tarball could not be found at https://registry.npmjs.org/no-data.'
//   );
// });

// test('tarball undefined response', async () => {
//   await expect(
//     fetchNpmTarball({ packageName: 'valid-package', version: 'undef', directory })
//   ).rejects.toThrow(
//     'Package "valid-package" tarball could not be found at https://registry.npmjs.org/undefined.'
//   );
// });
