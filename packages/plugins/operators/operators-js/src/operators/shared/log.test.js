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

/* eslint-disable max-classes-per-file */
import { NodeParser } from '@lowdefy/operators';

const logger = console.log;
const mockLogger = jest.fn();
beforeEach(() => {
  console.log = mockLogger;
  mockLogger.mockReset();
});
afterAll(() => {
  console.log = logger;
});

test('_log a string', async () => {
  const input = { a: { _log: 'value' } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'value',
  });
  expect(mockLogger).toHaveBeenCalledWith('value');
});

test('_log a number', async () => {
  const input = { a: { _log: 1 } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: 1,
  });
  expect(mockLogger).toHaveBeenCalledWith(1);
});

test('_log a null', async () => {
  const input = { a: { _log: null } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: null,
  });
  expect(mockLogger).toHaveBeenCalledWith(null);
});

// TODO: Confirm if this is expected behaviour??
test('_log a undefined', async () => {
  const input = { a: { _log: undefined } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: {},
  });
  expect(mockLogger).not.toHaveBeenCalled();
});

test('_log a 0', async () => {
  const input = { a: { _log: 0 } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: 0,
  });
  expect(mockLogger).toHaveBeenCalledWith(0);
});

test('_log a false', async () => {
  const input = { a: { _log: false } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: false,
  });
  expect(mockLogger).toHaveBeenCalledWith(false);
});

test('_log a object', async () => {
  const input = { a: { _log: { b: 1 } } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: { b: 1 },
  });
  expect(mockLogger).toHaveBeenCalledWith({ b: 1 });
});

test('_log a array', async () => {
  const input = { a: { _log: [{ b: 1 }] } };
  const parser = new NodeParser();
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({
    a: [{ b: 1 }],
  });
  expect(mockLogger).toHaveBeenCalledWith([{ b: 1 }]);
});
