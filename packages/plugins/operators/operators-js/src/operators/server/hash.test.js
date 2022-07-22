/*
  Copyright 2020-2022 Lowdefy, Inc

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

import hash from './hash.js';

test('_hash.md5 a string', () => {
  expect(hash({ params: 'A string value', methodName: 'md5' })).toEqual(
    '55cff4fd4227c899e8fc194e55152c24'
  );
});

test('_hash.md5 a number', () => {
  expect(() => hash({ params: 10, methodName: 'md5' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.md5 accepts one of the following types: string."`
  );
});

test('_hash.md5 a boolean', () => {
  expect(() => hash({ params: true, methodName: 'md5' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.md5 accepts one of the following types: string."`
  );
});

test('_hash.md5 a object', () => {
  expect(() => hash({ params: { a: 1 }, methodName: 'md5' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.md5 accepts one of the following types: string."`
  );
});

test('_hash.md5 a array', () => {
  expect(() => hash({ params: ['a', 'b'], methodName: 'md5' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.md5 accepts one of the following types: string."`
  );
});

test('_hash.md5 undefined', () => {
  expect(() => hash({ methodName: 'md5' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.md5 accepts one of the following types: string."`
  );
});

test('_hash.md5 null', () => {
  expect(() => hash({ params: null, methodName: 'md5' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.md5 accepts one of the following types: string."`
  );
});

test('_hash.sha1 a string', () => {
  expect(hash({ params: 'A string value', methodName: 'sha1' })).toEqual(
    'ab185e961a1ff20ad9240f102dd0fc7a00565ccb'
  );
});

test('_hash.sha1 a number', () => {
  expect(() => hash({ params: 10, methodName: 'sha1' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha1 accepts one of the following types: string."`
  );
});

test('_hash.sha1 a boolean', () => {
  expect(() => hash({ params: true, methodName: 'sha1' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha1 accepts one of the following types: string."`
  );
});

test('_hash.sha1 a object', () => {
  expect(() => hash({ params: { a: 1 }, methodName: 'sha1' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha1 accepts one of the following types: string."`
  );
});

test('_hash.sha1 a array', () => {
  expect(() => hash({ params: ['a', 'b'], methodName: 'sha1' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha1 accepts one of the following types: string."`
  );
});

test('_hash.sha1 undefined', () => {
  expect(() => hash({ methodName: 'sha1' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha1 accepts one of the following types: string."`
  );
});

test('_hash.sha1 null', () => {
  expect(() => hash({ params: null, methodName: 'sha1' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha1 accepts one of the following types: string."`
  );
});

test('_hash.sha256 a string', () => {
  expect(hash({ params: 'A string value', methodName: 'sha256' })).toEqual(
    '67fa88551dc1becff8e9facba582cea0c4e4f1268094297824f266e87e98e014'
  );
});

test('_hash.sha256 a number', () => {
  expect(() => hash({ params: 10, methodName: 'sha256' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha256 accepts one of the following types: string."`
  );
});

test('_hash.sha256 a boolean', () => {
  expect(() => hash({ params: true, methodName: 'sha256' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha256 accepts one of the following types: string."`
  );
});

test('_hash.sha256 a object', () => {
  expect(() => hash({ params: { a: 1 }, methodName: 'sha256' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha256 accepts one of the following types: string."`
  );
});

test('_hash.sha256 a array', () => {
  expect(() =>
    hash({ params: ['a', 'b'], methodName: 'sha256' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha256 accepts one of the following types: string."`
  );
});

test('_hash.sha256 undefined', () => {
  expect(() => hash({ methodName: 'sha256' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha256 accepts one of the following types: string."`
  );
});

test('_hash.sha256 null', () => {
  expect(() => hash({ params: null, methodName: 'sha256' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha256 accepts one of the following types: string."`
  );
});

test('_hash.sha512 a string', () => {
  expect(hash({ params: 'A string value', methodName: 'sha512' })).toEqual(
    '4002438cc89dbe9092468aa10fa766fb977010a59879739fe77558d7685691e0ca0ccb70090267008e77447271106f490707b3f6f2d8efb3b6c8c6a63802c46a'
  );
});

test('_hash.sha512 a number', () => {
  expect(() => hash({ params: 10, methodName: 'sha512' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha512 accepts one of the following types: string."`
  );
});

test('_hash.sha512 a boolean', () => {
  expect(() => hash({ params: true, methodName: 'sha512' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha512 accepts one of the following types: string."`
  );
});

test('_hash.sha512 a object', () => {
  expect(() => hash({ params: { a: 1 }, methodName: 'sha512' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha512 accepts one of the following types: string."`
  );
});

test('_hash.sha512 a array', () => {
  expect(() =>
    hash({ params: ['a', 'b'], methodName: 'sha512' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha512 accepts one of the following types: string."`
  );
});

test('_hash.sha512 undefined', () => {
  expect(() => hash({ methodName: 'sha512' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha512 accepts one of the following types: string."`
  );
});

test('_hash.sha512 null', () => {
  expect(() => hash({ params: null, methodName: 'sha512' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.sha512 accepts one of the following types: string."`
  );
});

test('_hash.ripemd160 a string', () => {
  expect(hash({ params: 'A string value', methodName: 'ripemd160' })).toEqual(
    'a6267e14418b2833da3a44ff2513e544e71e1242'
  );
});

test('_hash.ripemd160 a number', () => {
  expect(() => hash({ params: 10, methodName: 'ripemd160' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.ripemd160 accepts one of the following types: string."`
  );
});

test('_hash.ripemd160 a boolean', () => {
  expect(() => hash({ params: true, methodName: 'ripemd160' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.ripemd160 accepts one of the following types: string."`
  );
});

test('_hash.ripemd160 a object', () => {
  expect(() =>
    hash({ params: { a: 1 }, methodName: 'ripemd160' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_hash.ripemd160 accepts one of the following types: string."`
  );
});

test('_hash.ripemd160 a array', () => {
  expect(() =>
    hash({ params: ['a', 'b'], methodName: 'ripemd160' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_hash.ripemd160 accepts one of the following types: string."`
  );
});

test('_hash.ripemd160 undefined', () => {
  expect(() => hash({ methodName: 'ripemd160' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.ripemd160 accepts one of the following types: string."`
  );
});

test('_hash.ripemd160 null', () => {
  expect(() => hash({ params: null, methodName: 'ripemd160' })).toThrowErrorMatchingInlineSnapshot(
    `"_hash.ripemd160 accepts one of the following types: string."`
  );
});
