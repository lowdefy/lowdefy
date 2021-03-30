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
import WebParser from '../../src/webParser';
import { context } from '../testContext';

const contexts = {
  own: context,

  c: { contextId: 'c' },
  a: { contextId: 'a' },
  b: { contextId: 'b' },
};

const arrayIndices = [1];

test('_list_contexts empty contexts', async () => {
  const obj = { _list_contexts: true };
  const parser = new WebParser({ context, contexts: {} });
  await parser.init();
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_list_contexts contexts exist, sorts list', async () => {
  const obj = { _list_contexts: true };
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(['a', 'b', 'c', 'own']);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
