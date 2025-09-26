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

/* eslint-disable no-global-assign */
import media from './media.js';

console.error = () => {};

const window = { innerHeight: 300, innerWidth: 500 };
const globals = { window };

test('_media full media object', () => {
  expect(media({ params: true, location: 'locationId', globals })).toEqual({
    height: 300,
    size: 'xs',
    width: 500,
  });
});

test('_media size', () => {
  expect(
    media({
      params: 'size',
      location: 'locationId',
      globals: { window: { innerHeight: 300, innerWidth: 500 } },
    })
  ).toEqual('xs');
  expect(
    media({
      params: 'size',
      location: 'locationId',
      globals: { window: { innerHeight: 300, innerWidth: 700 } },
    })
  ).toEqual('sm');
  expect(
    media({
      params: 'size',
      location: 'locationId',
      globals: { window: { innerHeight: 300, innerWidth: 900 } },
    })
  ).toEqual('md');
  expect(
    media({
      params: 'size',
      location: 'locationId',
      globals: { window: { innerHeight: 300, innerWidth: 1100 } },
    })
  ).toEqual('lg');
  expect(
    media({
      params: 'size',
      location: 'locationId',
      globals: { window: { innerHeight: 300, innerWidth: 1400 } },
    })
  ).toEqual('xl');
  expect(
    media({
      params: 'size',
      location: 'locationId',
      globals: { window: { innerHeight: 300, innerWidth: 1900 } },
    })
  ).toEqual('xxl');
});

test('_media width', () => {
  expect(media({ params: 'width', location: 'locationId', globals })).toEqual(500);
});

test('_media height', () => {
  expect(media({ params: 'height', location: 'locationId', globals })).toEqual(300);
});

test('_media throw on no innerWidth', () => {
  expect(() => media({ params: true, location: 'locationId', globals: { window: {} } })).toThrow(
    'Operator Error: device window width not available for _media. Received: true at locationId.'
  );
});
