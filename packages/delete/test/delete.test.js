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

import del from '../src/delete';

test('delete a.1.b', () => {
  const obj = {
    a: [{ b: 2 }, { b: 5 }],
  };
  del(obj, 'a.1.b');
  expect(obj).toEqual({ a: [{ b: 2 }, {}] });
});

test('delete a.b', () => {
  const obj = {
    a: { b: [] },
  };
  del(obj, 'a.b');
  expect(obj).toEqual({ a: {} });
});

test('should update the given object when a property is deleted:', () => {
  const obj = { a: 'b' };
  del(obj, 'a');
  expect(obj).toEqual({});
});

test('should delete nested values:', () => {
  const one = { a: { b: { c: 'd' } } };
  del(one, 'a.b');
  expect(one).toEqual({ a: {} });

  const two = { a: { b: { c: 'd' } } };
  del(two, 'a.b.c');
  expect(two).toEqual({ a: { b: {} } });

  const three = { a: { b: { c: 'd', e: 'f' } } };
  del(three, 'a.b.c');
  expect(three).toEqual({ a: { b: { e: 'f' } } });
});

test('should delete...:', () => {
  const three = { 'a.b': 'c', d: 'e' };
  del(three, 'a.b');
  expect(three).toEqual({ d: 'e' });
});

test('should delete nested escaped values:', () => {
  const one = { a: { 'b.c': 'd' } };
  del(one, 'a.b\\.c');
  expect(one).toEqual({ a: {} });

  const two = { 'a.b.c': 'd' };
  del(two, 'a\\.b\\.c');
  expect(two).toEqual({});

  const three = { 'a.b': 'c', d: 'e' };
  del(three, 'a\\.b');
  expect(three).toEqual({ d: 'e' });
});

describe('del', () => {
  test('should update the given object when a property is deleted:', () => {
    const obj = { a: 'b' };
    del(obj, 'a');
    expect(obj).toEqual({});
  });

  test('should return true when a property is deleted:', () => {
    const res = del({ a: 'b' }, 'a');
    expect(res).toEqual(true);
  });

  test('should return true when the given property does not exist:', () => {
    const res = del({ a: 'b' }, 'z');
    expect(res).toEqual(true);
  });

  test('should delete nested values:', () => {
    const one = { a: { b: { c: 'd' } } };
    del(one, 'a.b');
    expect(one).toEqual({ a: {} });

    const two = { a: { b: { c: 'd' } } };
    del(two, 'a.b.c');
    expect(two).toEqual({ a: { b: {} } });

    const three = { a: { b: { c: 'd', e: 'f' } } };
    del(three, 'a.b.c');
    expect(three).toEqual({ a: { b: { e: 'f' } } });
  });

  test('should delete...:', () => {
    const three = { 'a.b': 'c', d: 'e' };
    del(three, 'a.b');
    expect(three).toEqual({ d: 'e' });
  });

  test('should delete nested escaped values:', () => {
    const one = { a: { 'b.c': 'd' } };
    del(one, 'a.b\\.c');
    expect(one).toEqual({ a: {} });

    const two = { 'a.b.c': 'd' };
    del(two, 'a\\.b\\.c');
    expect(two).toEqual({});

    const three = { 'a.b': 'c', d: 'e' };
    del(three, 'a\\.b');
    expect(three).toEqual({ d: 'e' });
  });

  test('should throw an error when invalid args are passed:', () => {
    expect(() => {
      del();
    }).toThrow('expected an object.');
  });
});
