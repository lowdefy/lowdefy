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

import unset from './unset.js';

test('unset a.1.b', () => {
  const obj = {
    a: [{ b: 2 }, { b: 5 }],
  };
  unset(obj, 'a.1.b');
  expect(obj).toEqual({ a: [{ b: 2 }, {}] });
});

test('unset a.b', () => {
  const obj = {
    a: { b: [] },
  };
  unset(obj, 'a.b');
  expect(obj).toEqual({ a: {} });
});

test('should update the given object when a property is unsetd:', () => {
  const obj = { a: 'b' };
  unset(obj, 'a');
  expect(obj).toEqual({});
});

test('should unset nested values:', () => {
  const one = { a: { b: { c: 'd' } } };
  unset(one, 'a.b');
  expect(one).toEqual({ a: {} });

  const two = { a: { b: { c: 'd' } } };
  unset(two, 'a.b.c');
  expect(two).toEqual({ a: { b: {} } });

  const three = { a: { b: { c: 'd', e: 'f' } } };
  unset(three, 'a.b.c');
  expect(three).toEqual({ a: { b: { e: 'f' } } });
});

test('should unset...:', () => {
  const three = { 'a.b': 'c', d: 'e' };
  unset(three, 'a.b');
  expect(three).toEqual({ d: 'e' });
});

test('should unset nested escaped values:', () => {
  const one = { a: { 'b.c': 'd' } };
  unset(one, 'a.b\\.c');
  expect(one).toEqual({ a: {} });

  const two = { 'a.b.c': 'd' };
  unset(two, 'a\\.b\\.c');
  expect(two).toEqual({});

  const three = { 'a.b': 'c', d: 'e' };
  unset(three, 'a\\.b');
  expect(three).toEqual({ d: 'e' });
});

describe('unset', () => {
  test('should update the given object when a property is unsetd:', () => {
    const obj = { a: 'b' };
    unset(obj, 'a');
    expect(obj).toEqual({});
  });

  test('should return true when a property is unsetd:', () => {
    const res = unset({ a: 'b' }, 'a');
    expect(res).toEqual(true);
  });

  test('should return true when the given property does not exist:', () => {
    const res = unset({ a: 'b' }, 'z');
    expect(res).toEqual(true);
  });

  test('should unset nested values:', () => {
    const one = { a: { b: { c: 'd' } } };
    unset(one, 'a.b');
    expect(one).toEqual({ a: {} });

    const two = { a: { b: { c: 'd' } } };
    unset(two, 'a.b.c');
    expect(two).toEqual({ a: { b: {} } });

    const three = { a: { b: { c: 'd', e: 'f' } } };
    unset(three, 'a.b.c');
    expect(three).toEqual({ a: { b: { e: 'f' } } });
  });

  test('should unset...:', () => {
    const three = { 'a.b': 'c', d: 'e' };
    unset(three, 'a.b');
    expect(three).toEqual({ d: 'e' });
  });

  test('should unset nested escaped values:', () => {
    const one = { a: { 'b.c': 'd' } };
    unset(one, 'a.b\\.c');
    expect(one).toEqual({ a: {} });

    const two = { 'a.b.c': 'd' };
    unset(two, 'a\\.b\\.c');
    expect(two).toEqual({});

    const three = { 'a.b': 'c', d: 'e' };
    unset(three, 'a\\.b');
    expect(three).toEqual({ d: 'e' });
  });

  test('should throw an error when invalid args are passed:', () => {
    expect(() => {
      unset();
    }).toThrow('expected an object.');
  });
});
