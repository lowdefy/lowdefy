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

import evaluateJsEntries from './evaluateJsEntries.js';
import helloJsEntries from '../../fixtures/hello.jsEntries.json';

const accessors = {
  lowdefyGlobal: (key) => ({ greeting: 'Hello from Lowdefy' })[key],
};

test('evaluateJsEntries turns the hello page module text into its _js functions', () => {
  const jsMap = evaluateJsEntries(helloJsEntries.today);
  expect(Object.keys(jsMap)).toEqual([
    'HorPchxU3cTNYhB6dbx9DFcepx4=',
    'b+IYcPY3kW9J7YdZ4RyICtelfz8=',
  ]);
  expect(jsMap['HorPchxU3cTNYhB6dbx9DFcepx4='](accessors)).toBe('Hello from Lowdefy');
  expect(jsMap['b+IYcPY3kW9J7YdZ4RyICtelfz8='](accessors)).toBe(String(new Date().getFullYear()));
});

test('evaluateJsEntries keeps the volatile flag dependency tracking reads', () => {
  const jsMap = evaluateJsEntries(helloJsEntries.today);
  expect(jsMap['b+IYcPY3kW9J7YdZ4RyICtelfz8='].volatile).toBe(true);
  expect(jsMap['HorPchxU3cTNYhB6dbx9DFcepx4='].volatile).toBeUndefined();
});

test('evaluateJsEntries evaluates the app events module text of the root', () => {
  const jsMap = evaluateJsEntries(helloJsEntries.app);
  expect(jsMap['yHZGzdxAuSQ8P5USi0AFFY81iNg='](accessors)).toBe('Hello from Lowdefy');
});

test('evaluateJsEntries gives an empty map for a page without _js', () => {
  expect(evaluateJsEntries(undefined)).toEqual({});
  expect(evaluateJsEntries(null)).toEqual({});
});
