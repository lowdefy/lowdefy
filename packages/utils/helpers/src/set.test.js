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

import typeTest from './type.js';
import set, { split } from './set.js';

test('setNestedValue - set a nested value in array object', () => {
  const objOne = {
    a: [{ b: 2 }, { b: 5, c: 4 }],
  };
  expect(set(objOne, 'a.1.b', 10)).toEqual({ a: [{ b: 2 }, { b: 10, c: 4 }] });
});

test('setNestedValue - set a nested object in array', () => {
  const objOne = {
    a: [{ b: 2 }, { b: 5, c: 4 }],
  };
  expect(set(objOne, 'a.1', { a: 2 })).toEqual({ a: [{ b: 2 }, { a: 2 }] });
});

test('setNestedObject - set a.b', () => {
  const objOne = {
    a: { b: 1 },
  };
  expect(set(objOne, 'a.b', 5)).toEqual({ a: { b: 5 } });
});

test('setNestedObject - set a', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'a', 5)).toEqual({ a: 5 });
});

test('setNestedObject - set b when b is undefined', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'b', 5)).toEqual({ a: 1, b: 5 });
});

test('setNestedObject - set b.c when b.c is undefined', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'b.c', 5)).toEqual({ a: 1, b: { c: 5 } });
});

test('setNestedObject - set b.0.c when b.0.c is undefined', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'b.0.c', 5)).toEqual({ a: 1, b: [{ c: 5 }] });
});

test('setNestedObject - set b.0.c when b.0.c is undefined (but b as empty array is)', () => {
  const objOne = {
    a: 1,
    b: [],
  };
  expect(set(objOne, 'b.0.c', 5)).toEqual({ a: 1, b: [{ c: 5 }] });
});

test('setNestedObject - set b.1.c when b.1.c is undefined', () => {
  const objOne = {
    a: 1,
    b: [{ a: 10 }],
  };
  expect(set(objOne, 'b.1.c', 5)).toEqual({ a: 1, b: [{ a: 10 }, { c: 5 }] });
});

test('setNestedObject - set b.3.c when b.3.c is undefined', () => {
  const objOne = {
    a: 1,
    b: [{ a: 10 }],
  };
  expect(set(objOne, 'b.3.c', 5)).toEqual({ a: 1, b: [{ a: 10 }, undefined, undefined, { c: 5 }] });
});

test('setNestedObject - set a.b.3.c when a.b.3.c is undefined', () => {
  const objOne = {
    a: { b: [{ a: 10 }] },
  };
  expect(set(objOne, 'a.b.3.c', 5)).toEqual({
    a: { b: [{ a: 10 }, undefined, undefined, { c: 5 }] },
  });
});

test('setNestedObject - set a.d.b.c.2 when a is undefined', () => {
  const objOne = {};
  expect(set(objOne, 'a.d.b.c.2', 5)).toEqual({
    a: { d: { b: { c: [undefined, undefined, 5] } } },
  });
});

test('setNestedObject - set a.0.b.0.c when a is undefined', () => {
  const objOne = {};
  expect(set(objOne, 'a.0.b.0.c', 5)).toEqual({ a: [{ b: [{ c: 5 }] }] });
});

// Tests from set-value github

test('setNestedObject - should return non-objects', () => {
  let res = set('foo', 'a.b', 'c');
  expect(res).toEqual('foo');
  res = set(null, 'a.b', 'c');
  expect(res).toEqual(null);
});

test('setNestedObject - should create a nested property if it does not already exist', () => {
  const o = {};
  set(o, 'a.b', 'c');
  expect(o.a.b).toEqual('c');
});

test('setNestedObject - should merge an existing value with the given value', () => {
  const o = { a: { b: { c: 'd' } } };
  set(o, 'a.b', { y: 'z' }, { merge: true });
  expect(o.a.b).toEqual({ c: 'd', y: 'z' });
});

test('setNestedObject - should update an object value', () => {
  const o = {};
  set(o, 'a', { b: 'c' });
  set(o, 'a', { c: 'd' }, { merge: true });
  expect(o).toEqual({ a: { b: 'c', c: 'd' } });
  set(o, 'a', 'b');
  expect(o.a).toEqual('b'); // o.a, 'b'
});

test('setNestedObject - should extend an array', () => {
  const o = { a: [] };
  expect(typeTest.isArray(o.a)).toEqual(true);
  set(o, 'a.0', { y: 'z' });
  expect(o.a[0]).toEqual({ y: 'z' });
});

test('setNestedObject - should extend a function', () => {
  function log() {}
  const warning = function () {};
  const o = {};
  set(o, 'helpers.foo', log);
  set(o, 'helpers.foo.warning', warning);
  expect(typeTest.isFunction(o.helpers.foo)).toEqual(true);
  expect(typeTest.isFunction(o.helpers.foo.warning)).toEqual(true);
});

test('setNestedObject - should extend an object in an array', () => {
  const o = { a: [{}, {}, {}] };
  set(o, 'a.0.a', { y: 'z' });
  set(o, 'a.1.b', { y: 'z' });
  set(o, 'a.2.c', { y: 'z' });
  expect(typeTest.isArray(o.a)).toEqual(true);
  expect(o.a[0].a).toEqual({ y: 'z' });
  expect(o.a[1].b).toEqual({ y: 'z' });
  expect(o.a[2].c).toEqual({ y: 'z' });
});

test('setNestedObject - should create a deeply nested property if it does not already exist', () => {
  const o = {};
  set(o, 'a.b.c.d.e', 'c');
  expect(o.a.b.c.d.e).toEqual('c');
});

test('setNestedObject - should not create a nested property if it does already exist', () => {
  const first = { name: 'Halle' };
  const o = { a: first };
  set(o, 'a.b', 'c');
  expect(o.a.b).toEqual('c');
  expect(o.a).toEqual(first);
  expect(o.a.name).toEqual('Halle');
});

test('setNestedObject - should support immediate properties', () => {
  const o = {};
  set(o, 'a', 'b');
  expect(o.a).toEqual('b');
});

test('setNestedObject - should support immediate properties', () => {
  const o = {};
  set(o, 'a.locals.name', { first: 'Brian' });
  set(o, 'b.locals.name', { last: 'Woodward' });
  set(o, 'b.locals.name.last', 'Woodward');
  expect(o).toEqual({
    a: { locals: { name: { first: 'Brian' } } },
    b: { locals: { name: { last: 'Woodward' } } },
  });
});

test('setNestedObject - should add the property even if a value is not defined', () => {
  const fixture = {};
  expect(set(fixture, 'a.locals.name')).toEqual({ a: { locals: { name: undefined } } });
  expect(set(fixture, 'b.locals.name')).toEqual({
    b: { locals: { name: undefined } },
    a: { locals: { name: undefined } },
  });
});

test('setNestedObject - should set the specified property.', () => {
  expect(set({ a: 'aaa', b: 'b' }, 'a', 'bbb')).toEqual({ a: 'bbb', b: 'b' });
});

test('setNestedObject - should support passing an array as the key.', () => {
  const actual = set({ a: 'a', b: { c: 'd' } }, ['b', 'c', 'd'], 'eee');
  expect(actual).toEqual({ a: 'a', b: { c: { d: 'eee' } } });
});

test('setNestedObject - should set a deeply nested value.', () => {
  const actual = set({ a: 'a', b: { c: 'd' } }, 'b.c.d', 'eee');
  expect(actual).toEqual({ a: 'a', b: { c: { d: 'eee' } } });
});

test('setNestedObject - should return the entire object if no property is passed.', () => {
  expect(set({ a: 'a', b: { c: 'd' } })).toEqual({ a: 'a', b: { c: 'd' } });
});

test('setNestedObject - should set a value only.', () => {
  expect(set({ a: 'a', b: { c: 'd' } }, 'b.c')).toEqual({ a: 'a', b: { c: undefined } });
});

test('setNestedObject - should set non-plain objects', (done) => {
  const o = {};

  set(o, 'a.b', new Date('July 20, 69 00:20:18 GMT+00:00'));
  const firstDate = o.a.b.getTime();

  setTimeout(() => {
    set(o, 'a.b', new Date('July 20, 69 00:20:18 GMT+00:00'));
    const secondDate = o.a.b.getTime();

    expect(firstDate).toEqual(secondDate);
    done();
  }, 10);
});

test('setNestedObject - should not split escaped dots.', () => {
  const o = {};
  set(o, 'a\\.b.c.d.e', 'c', { escape: true });
  expect(o['a.b'].c.d.e).toEqual('c');
});

test('setNestedObject - should work with multiple escaped dots.', () => {
  const obj1 = {};
  set(obj1, 'e\\.f\\.g', 1, { escape: true });
  expect(obj1['e.f.g']).toEqual(1);
  const obj2 = {};
  set(obj2, 'e\\.f.g\\.h\\.i.j', 1, { escape: true });
  expect(obj2).toEqual({ 'e.f': { 'g.h.i': { j: 1 } } });
});

// Test split

test('setNestedObject - split on dot', () => {
  expect(split('a.b.c.d.e')).toEqual(['a', 'b', 'c', 'd', 'e']);
});

test('setNestedObject - split should not split on escape dots', () => {
  expect(split('e\\.f\\.g')).toEqual(['e.f.g']);
});

test('setNestedObject - split path with number', () => {
  expect(split('a.0.a')).toEqual(['a', '0', 'a']);
});

test('setNestedObject - object pointers - we maintain the reference', () => {
  const objA = {};
  const objB = [{ b: 1 }];
  set(objA, 'a', objB);
  expect(objA).toEqual({ a: [{ b: 1 }] });
  expect(objB).toEqual([{ b: 1 }]);

  set(objA, 'a.0.c', 1); // this is an edit on objB
  expect(objA).toEqual({ a: [{ b: 1, c: 1 }] });

  // expect(objB).toEqual([{b: 1}]);
  // or - we maintain the reference
  expect(objB).toEqual([{ b: 1, c: 1 }]);
});
