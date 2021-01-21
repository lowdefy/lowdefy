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

/* eslint-disable no-global-assign */
import media from '../../src/web/media';

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 300 });
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
});

test('_media full media object', () => {
  expect(media({ params: true, location: 'locationId' })).toEqual({
    height: 300,
    size: 'xs',
    width: 500,
  });
});

test('_media size', () => {
  expect(media({ params: 'size', location: 'locationId' })).toEqual('xs');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 700 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('sm');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 900 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('md');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1100 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('lg');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1400 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('xl');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1900 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('xxl');
});

test('_media width', () => {
  expect(media({ params: 'width', location: 'locationId' })).toEqual(500);
});

test('_media height', () => {
  expect(media({ params: 'height', location: 'locationId' })).toEqual(300);
});

test('_media throw on no innerWidth', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: undefined,
  });
  expect(() => media({ params: true, location: 'locationId' })).toThrow(
    'Operator Error: device window width not available for _media. Received: true at locationId.'
  );
});
