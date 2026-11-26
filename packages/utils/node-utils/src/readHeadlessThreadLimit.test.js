/*
  Copyright 2020-2026 Lowdefy, Inc

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

import { expect, test } from 'vitest';

import readHeadlessThreadLimit from './readHeadlessThreadLimit.js';

const GiB = 1024 ** 3;

test('readHeadlessThreadLimit leaves one core for the run above 4 cores', () => {
  expect(readHeadlessThreadLimit({ cores: 10, memory: 64 * GiB })).toBe(9);
});

test('readHeadlessThreadLimit runs on every core of a machine with up to 4', () => {
  expect(readHeadlessThreadLimit({ cores: 2, memory: 7 * GiB })).toBe(2);
  expect(readHeadlessThreadLimit({ cores: 4, memory: 16 * GiB })).toBe(4);
});

test('readHeadlessThreadLimit keeps one thread per GiB of memory', () => {
  expect(readHeadlessThreadLimit({ cores: 10, memory: 6 * GiB })).toBe(6);
});

test('readHeadlessThreadLimit is at least one on little memory', () => {
  expect(readHeadlessThreadLimit({ cores: 8, memory: 0.5 * GiB })).toBe(1);
});

test('readHeadlessThreadLimit reads the machine when given nothing', () => {
  expect(readHeadlessThreadLimit()).toBeGreaterThanOrEqual(1);
});
