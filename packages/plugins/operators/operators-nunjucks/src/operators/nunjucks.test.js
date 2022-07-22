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

import _nunjucks from './nunjucks.js';

const defaultOn = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};

test('_nunjucks string template', () => {
  expect(
    _nunjucks({
      params: 'String with {{ string }} embedded',
      defaultOn,
    })
  ).toEqual('String with Some String embedded');
});

test('_nunjucks null', () => {
  expect(
    _nunjucks({
      params: null,
      defaultOn,
    })
  ).toEqual(null);
});

test('_nunjucks { template: , on: }', () => {
  expect(
    _nunjucks({
      params: { template: 'String with {{ string }} embedded', on: { string: 'test' } },
      defaultOn,
    })
  ).toEqual('String with test embedded');
});

test('_nunjucks template not a string', () => {
  expect(
    _nunjucks({
      params: { template: ['String with {{ string }} embedded'] },
      defaultOn,
    })
  ).toEqual(null);
});

test('_nunjucks params on template not a string', () => {
  expect(
    _nunjucks({
      params: { template: ['String with {{ string }} embedded'], on: { string: 'test' } },
      defaultOn,
    })
  ).toEqual(null);
});

test('_nunjucks on not a object', () => {
  expect(
    _nunjucks({
      params: { template: 'String with {{ string }} embedded', on: [{ string: 'test' }] },
      defaultOn,
    })
  ).toEqual('String with  embedded');
});

test('_nunjucks on null', () => {
  expect(
    _nunjucks({
      params: { template: 'String with {{ string }} embedded', on: null },
      defaultOn,
    })
  ).toEqual('String with  embedded');
});

test('_nunjucks invalid template', () => {
  expect(() => {
    _nunjucks({
      params: 'String with {{ string  embedded',
      defaultOn,
    });
  }).toThrow('_nunjucks failed to parse nunjucks template.');
});
