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

import { jest } from '@jest/globals';
import random from './random.js';

const mockRandom = jest.fn();
const mockRandomImp = () => 0.5234;
const mathRandomFn = Math.random;

beforeEach(() => {
  Math.random = mockRandom;
  mockRandom.mockReset();
  mockRandom.mockImplementation(mockRandomImp);
});

afterEach(() => {
  Math.random = mathRandomFn;
});

test('_random string', () => {
  expect(random({ params: 'string', location: 'locationId' })).toEqual('iubr0inu');
});

test('_random string with length', () => {
  expect(random({ params: { type: 'string', length: 3 }, location: 'locationId' })).toEqual('iub');
  expect(random({ params: { type: 'string', length: 10 }, location: 'locationId' })).toEqual(
    'iubr0inugx'
  );
});

test('_random integer', () => {
  expect(random({ params: 'integer', location: 'locationId' })).toEqual(52);
});

test('_random integer with min', () => {
  expect(random({ params: { type: 'integer', min: 500 }, location: 'locationId' })).toEqual(552);
});

test('_random integer with max', () => {
  expect(random({ params: { type: 'integer', max: 500 }, location: 'locationId' })).toEqual(261);
});

test('_random integer with min and max', () => {
  expect(
    random({ params: { type: 'integer', max: 500, min: 450 }, location: 'locationId' })
  ).toEqual(476);
});

test('_random integer with min greater than max', () => {
  expect(() =>
    random({ params: { type: 'integer', max: 500, min: 550 }, location: 'locationId' })
  ).toThrow(
    'Operator Error: _random.min must be less than _random.max. Received: {"type":"integer","max":500,"min":550} at locationId.'
  );
});

test('_random integer with max not a number', () => {
  expect(() => random({ params: { type: 'integer', max: null }, location: 'locationId' })).toThrow(
    'Operator Error: _random.max takes an number type. Received: {"type":"integer","max":null,"min":0} at locationId.'
  );
});

test('_random integer with min not a number', () => {
  expect(() => random({ params: { type: 'integer', min: null }, location: 'locationId' })).toThrow(
    'Operator Error: _random.min takes an number type. Received: {"type":"integer","min":null} at locationId.'
  );
});

test('_random float', () => {
  expect(random({ params: 'float', location: 'locationId' })).toEqual(0.5234);
});

test('_random float with min', () => {
  expect(random({ params: { type: 'float', min: 500 }, location: 'locationId' })).toEqual(500.5234);
});

test('_random float with max', () => {
  expect(random({ params: { type: 'float', max: 500 }, location: 'locationId' })).toEqual(261.7);
});

test('_random float with min and max', () => {
  expect(random({ params: { type: 'float', max: 500, min: 450 }, location: 'locationId' })).toEqual(
    476.17
  );
});

test('_random float with min greater than max', () => {
  expect(() =>
    random({ params: { type: 'float', max: 500, min: 550 }, location: 'locationId' })
  ).toThrow(
    'Operator Error: _random.min must be less than _random.max. Received: {"type":"float","max":500,"min":550} at locationId.'
  );
});

test('_random float with max not a number', () => {
  expect(() => random({ params: { type: 'float', max: null }, location: 'locationId' })).toThrow(
    'Operator Error: _random.max takes an number type. Received: {"type":"float","max":null,"min":0} at locationId.'
  );
});

test('_random float with min not a number', () => {
  expect(() => random({ params: { type: 'float', min: null }, location: 'locationId' })).toThrow(
    'Operator Error: _random.min takes an number type. Received: {"type":"float","min":null} at locationId.'
  );
});

test('_random type not a string', () => {
  expect(() => random({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _random takes an string or object type. Received: null at locationId.'
  );
  expect(() => random({ params: { type: null }, location: 'locationId' })).toThrow(
    "Operator Error: _random type can be either 'string', 'integer' or 'float'. Received: {\"type\":null} at locationId."
  );
});

test('_random type not a supported type', () => {
  expect(() => random({ params: 'boolean', location: 'locationId' })).toThrow(
    "Operator Error: _random type can be either 'string', 'integer' or 'float'. Received: {\"type\":\"boolean\"} at locationId."
  );
});
