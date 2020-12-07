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

// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import fetchMetaUrl from './fetchMetaUrl';

const type = 'Type';

jest.mock('axios', () => {
  return {
    get: (url) => {
      if (url === 'valid-url') {
        return Promise.resolve({ data: { key: 'value' } });
      }
      if (url === '404') {
        const error = new Error('Test 404');
        error.response = {};
        error.response.status = 404;
        throw error;
      }
      throw new Error('Invalid url');
    },
  };
});

test('fetchMetaUrl fetches from url', async () => {
  const meta = await fetchMetaUrl({
    type,
    location: {
      url: 'valid-url',
    },
  });
  expect(meta).toEqual({ key: 'value' });
});

test('fetchMetaUrl request errors', async () => {
  await expect(
    fetchMetaUrl({
      type,
      location: {
        url: 'invalid-url',
      },
    })
  ).rejects.toThrow('Invalid url');
});

test('fetchMetaUrl throws if args are undefined', async () => {
  await expect(fetchMetaUrl()).rejects.toThrow('Failed to fetch meta, location is undefined.');
});

test('fetchMetaUrl throws if location is undefined', async () => {
  await expect(fetchMetaUrl({ type })).rejects.toThrow(
    'Failed to fetch meta, location is undefined.'
  );
});

test('fetchMetaUrl throws if location is not a string', async () => {
  await expect(
    fetchMetaUrl({
      type,
      location: {
        url: 1,
      },
    })
  ).rejects.toThrow('Block type "Type" url definition should be a string.');
});

test('fetchMetaUrl throws if response returns a 404 not found', async () => {
  await expect(
    fetchMetaUrl({
      type,
      location: {
        url: '404',
      },
    })
  ).rejects.toThrow('Meta for type "Type" could not be found at {"url":"404"}.');
});
